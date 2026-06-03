import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { serializeBigInt } from './utils';
import { stripe } from '../../services/stripe/client';

const router = express.Router();

/**
 * 在 Stripe 创建 Product + Price，返回 stripePriceId 和 stripeProductId
 */
async function createStripeProduct(opts: {
    name: string;
    price: number;
    currency: string;
    planType: string;
    interval?: string | null;
    description?: string;
}): Promise<{ stripePriceId: string; stripeProductId: string }> {
    const { name, price, currency, planType, interval, description } = opts;
    const amountInCents = Math.round(price * 100);

    const product = await stripe.products.create({
        name,
        description: description || name,
        metadata: { planType },
    });

    let stripePrice;
    if (planType === 'SUBSCRIPTION' && interval) {
        const intervalMap: Record<string, 'month' | 'year'> = {
            MONTH: 'month', QUARTER: 'month', YEAR: 'year'
        };
        stripePrice = await stripe.prices.create({
            product: product.id,
            unit_amount: amountInCents,
            currency: currency.toLowerCase(),
            recurring: {
                interval: intervalMap[interval] || 'month',
                interval_count: interval === 'QUARTER' ? 3 : 1,
            },
        });
    } else {
        stripePrice = await stripe.prices.create({
            product: product.id,
            unit_amount: amountInCents,
            currency: currency.toLowerCase(),
        });
    }

    return { stripePriceId: stripePrice.id, stripeProductId: product.id };
}

// GET /api/admin/plans
router.get('/', async (req: Request, res: Response) => {
    const plans = await prisma.pricingPlan.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            apps: true,
            planFeatures: { include: { feature: true } },
            usagePacks: { include: { feature: true } },  // 兼容旧数据
        }
    });
    res.json(serializeBigInt(plans));
});

// POST /api/admin/plans
router.post('/', async (req: Request, res: Response) => {
    const { name, type, price, currency, interval, appIds, featureId, usageCount } = req.body;
    try {
        if (type === 'USAGE_PACK' && !featureId)
            return res.status(400).json({ error: 'Feature is required for USAGE_PACK' });

        // 功能点计费：从 feature.appId 自动推导 app 关联
        let resolvedAppIds: string[] = appIds || [];
        if (featureId && resolvedAppIds.length === 0) {
            const feat = await prisma.feature.findUnique({ where: { id: BigInt(featureId) } });
            if (!feat) return res.status(400).json({ error: 'Feature not found' });
            resolvedAppIds = [feat.appId.toString()];
        }

        if (type === 'SUBSCRIPTION' && resolvedAppIds.length === 0)
            return res.status(400).json({ error: 'At least one app must be selected for SUBSCRIPTION' });

        const plan = await prisma.pricingPlan.create({ data: { name, planType: type, price, currency, billingInterval: interval } });
        if (resolvedAppIds.length > 0) {
            await prisma.pricingPlanApp.createMany({ data: resolvedAppIds.map((id: any) => ({ appId: BigInt(id), pricingPlanId: plan.id })) });
        }

        if (featureId) {
            const count = usageCount ? parseInt(usageCount) : null;
            await prisma.pricingPlanFeature.create({
                data: { pricingPlanId: plan.id, featureId: BigInt(featureId), usageCount: count }
            });
            if (type === 'USAGE_PACK' && count) {
                await prisma.usagePack.create({ data: { pricingPlanId: plan.id, featureId: BigInt(featureId), usageCount: count } });
            }
        }

        // 自动在 Stripe 创建 Product + Price
        try {
            const { stripePriceId, stripeProductId } = await createStripeProduct({
                name, price, currency, planType: type, interval
            });
            const updated = await prisma.pricingPlan.update({
                where: { id: plan.id },
                data: { stripePriceId, stripeProductId }
            });
            res.json(serializeBigInt(updated));
        } catch (stripeErr: any) {
            console.error('[Admin Plans] Stripe product creation failed:', stripeErr.message);
            // Stripe 可先失败，不阻塞套餐创建，返回警告
            res.json({ ...serializeBigInt(plan), _stripeWarning: stripeErr.message });
        }
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// PUT /api/admin/plans/:id
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type, price, currency, interval, appIds, featureId, usageCount } = req.body;
    try {
        let resolvedAppIds: string[] = appIds || [];
        if (featureId && resolvedAppIds.length === 0) {
            const feat = await prisma.feature.findUnique({ where: { id: BigInt(featureId) } });
            if (!feat) return res.status(400).json({ error: 'Feature not found' });
            resolvedAppIds = [feat.appId.toString()];
        }
        if (type === 'SUBSCRIPTION' && resolvedAppIds.length === 0)
            return res.status(400).json({ error: 'At least one app must be selected for SUBSCRIPTION' });

        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: { name, planType: type, price, currency, billingInterval: interval }
        });
        await prisma.pricingPlanApp.deleteMany({ where: { pricingPlanId: plan.id } });
        if (resolvedAppIds.length > 0) {
            await prisma.pricingPlanApp.createMany({ data: resolvedAppIds.map((appId: any) => ({ appId: BigInt(appId), pricingPlanId: plan.id })) });
        }

        // 清除旧关联
        await prisma.pricingPlanFeature.deleteMany({ where: { pricingPlanId: plan.id } });
        await prisma.usagePack.deleteMany({ where: { pricingPlanId: plan.id } });

        if (featureId) {
            const count = usageCount ? parseInt(usageCount) : null;
            await prisma.pricingPlanFeature.create({
                data: { pricingPlanId: plan.id, featureId: BigInt(featureId), usageCount: count }
            });
            if (type === 'USAGE_PACK' && count) {
                await prisma.usagePack.create({ data: { pricingPlanId: plan.id, featureId: BigInt(featureId), usageCount: count } });
            }
        }

        // 当价格或名称变化时，archive 旧 Stripe Price 并创建新的
        try {
            const existing = await prisma.pricingPlan.findUnique({ where: { id: plan.id } });
            const priceChanged = existing && (Number(existing.price) !== Number(price) || existing.currency !== currency || existing.name !== name);
            if (priceChanged && existing?.stripeProductId) {
                // archive 旧 price
                if (existing.stripePriceId) {
                    await stripe.prices.update(existing.stripePriceId, { active: false }).catch(() => { });
                }
                const stripePrice = await stripe.prices.create({
                    product: existing.stripeProductId,
                    unit_amount: Math.round(Number(price) * 100),
                    currency: (currency as string).toLowerCase(),
                    ...(type === 'SUBSCRIPTION' && interval ? {
                        recurring: {
                            interval: interval === 'YEAR' ? 'year' : 'month',
                            interval_count: interval === 'QUARTER' ? 3 : 1,
                        }
                    } : {})
                });
                // 同时更新 product 名称
                await stripe.products.update(existing.stripeProductId, { name });
                await prisma.pricingPlan.update({ where: { id: plan.id }, data: { stripePriceId: stripePrice.id } });
                const final = await prisma.pricingPlan.findUnique({ where: { id: plan.id } });
                return res.json(serializeBigInt(final));
            }
            // 尚无 stripe product 时（旧数据）也创建一个
            if (!existing?.stripeProductId) {
                const { stripePriceId, stripeProductId } = await createStripeProduct({
                    name, price: Number(price), currency, planType: type, interval
                });
                await prisma.pricingPlan.update({ where: { id: plan.id }, data: { stripePriceId, stripeProductId } });
                const final = await prisma.pricingPlan.findUnique({ where: { id: plan.id } });
                return res.json(serializeBigInt(final));
            }
        } catch (stripeErr: any) {
            console.error('[Admin Plans] Stripe sync failed:', stripeErr.message);
        }
        res.json(serializeBigInt(plan));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// GET /api/admin/plans/:id/deletion-blockers
router.get('/:id/deletion-blockers', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const plan = await prisma.pricingPlan.findUnique({ where: { id: BigInt(id) }, include: { orders: true } });
        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        const activeOrders = plan.orders.filter((o: any) => o.status === 'PAID').length;
        const pendingOrders = plan.orders.filter((o: any) => o.status === 'PENDING').length;
        const activeSubscriptions = await prisma.userEntitlement.count({
            where: { sourceOrderId: { in: plan.orders.map((o: any) => o.id) }, entitlementType: 'SUBSCRIPTION', status: 'ACTIVE' }
        });
        const totalRevenue = plan.orders.filter((o: any) => o.status === 'PAID').reduce((sum: number, o: any) => sum + Number(o.amount), 0);

        res.json({
            activeOrders, activeSubscriptions, pendingOrders, totalRevenue,
            canRetire: plan.status === 'ACTIVE',
            canArchive: activeSubscriptions === 0 && pendingOrders === 0 && plan.status === 'RETIRED',
            canReactivate: plan.status === 'RETIRED'
        });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// POST /api/admin/plans/:id/retire
router.post('/:id/retire', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { replacementPlanId } = req.body;
    try {
        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: { status: 'RETIRED', sellable: false, retiredAt: new Date(), replacementPlanId: replacementPlanId ? BigInt(replacementPlanId) : null }
        });
        res.json(serializeBigInt(plan));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// POST /api/admin/plans/:id/archive
router.post('/:id/archive', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        const activeSubscriptions = await prisma.userEntitlement.count({
            where: { order: { pricingPlanId: BigInt(id) }, entitlementType: 'SUBSCRIPTION', status: 'ACTIVE' }
        });
        if (activeSubscriptions > 0) return res.status(400).json({ error: `Cannot archive: ${activeSubscriptions} active subscription(s) exist` });
        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: { status: 'ARCHIVED', archivedAt: new Date(), archivedReason: reason }
        });
        res.json(serializeBigInt(plan));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// POST /api/admin/plans/:id/reactivate
router.post('/:id/reactivate', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: { status: 'ACTIVE', sellable: true, retiredAt: null, archivedAt: null, archivedReason: null }
        });
        res.json(serializeBigInt(plan));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
