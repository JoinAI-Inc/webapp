import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { serializeBigInt } from './utils.js';

const router = express.Router();

// GET /api/admin/plans
router.get('/', async (req: Request, res: Response) => {
    const plans = await prisma.pricingPlan.findMany({ orderBy: { createdAt: 'desc' }, include: { apps: true } });
    res.json(serializeBigInt(plans));
});

// POST /api/admin/plans
router.post('/', async (req: Request, res: Response) => {
    const { name, type, price, currency, interval, appIds, featureId, usageCount } = req.body;
    try {
        if (!appIds || appIds.length === 0) return res.status(400).json({ error: 'At least one app must be selected' });
        if (type === 'USAGE_PACK' && (!featureId || !usageCount))
            return res.status(400).json({ error: 'Feature and usage count are required for USAGE_PACK' });

        const plan = await prisma.pricingPlan.create({ data: { name, planType: type, price, currency, billingInterval: interval } });
        await prisma.pricingPlanApp.createMany({ data: appIds.map((id: any) => ({ appId: BigInt(id), pricingPlanId: plan.id })) });
        if (type === 'USAGE_PACK') {
            await prisma.usagePack.create({ data: { pricingPlanId: plan.id, featureId: BigInt(featureId), usageCount: parseInt(usageCount) } });
        }
        res.json(serializeBigInt(plan));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// PUT /api/admin/plans/:id
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type, price, currency, interval, appIds, featureId, usageCount } = req.body;
    try {
        if (!appIds || appIds.length === 0) return res.status(400).json({ error: 'At least one app must be selected' });
        if (type === 'USAGE_PACK' && (!featureId || !usageCount))
            return res.status(400).json({ error: 'Feature and usage count are required for USAGE_PACK' });

        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: { name, planType: type, price, currency, billingInterval: interval }
        });
        await prisma.pricingPlanApp.deleteMany({ where: { pricingPlanId: plan.id } });
        await prisma.pricingPlanApp.createMany({ data: appIds.map((appId: any) => ({ appId: BigInt(appId), pricingPlanId: plan.id })) });
        await prisma.usagePack.deleteMany({ where: { pricingPlanId: plan.id } });
        if (type === 'USAGE_PACK') {
            await prisma.usagePack.create({ data: { pricingPlanId: plan.id, featureId: BigInt(featureId), usageCount: parseInt(usageCount) } });
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

        const activeOrders = plan.orders.filter(o => o.status === 'PAID').length;
        const pendingOrders = plan.orders.filter(o => o.status === 'PENDING').length;
        const activeSubscriptions = await prisma.userEntitlement.count({
            where: { sourceOrderId: { in: plan.orders.map(o => o.id) }, entitlementType: 'SUBSCRIPTION', status: 'ACTIVE' }
        });
        const totalRevenue = plan.orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + Number(o.amount), 0);

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
