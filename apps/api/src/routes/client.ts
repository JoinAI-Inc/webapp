import express, { Request, Response, NextFunction } from 'express';
import { prisma } from '@repo/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// 使用JWT认证中间件保护需要登录的端点
router.use('/entitlements', authenticateJWT);
router.use('/checkout', authenticateJWT);


// GET /api/store/apps
// Public: List visible apps
router.get('/apps', async (req: Request, res: Response) => {
    const apps = await prisma.app.findMany({
        where: { status: 'PUBLISHED' },
        select: {
            id: true,
            name: true,
            description: true,
            appKey: true,
        }
    });

    const serializedApps = JSON.parse(JSON.stringify(apps, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(serializedApps);
});

// GET /api/store/apps/:id
// Public: App details + related plans (one-time purchases AND subscriptions)
router.get('/apps/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    // 判断id是数字还是字符串（appKey）
    const isNumericId = /^\d+$/.test(id);

    const app = await prisma.app.findUnique({
        where: isNumericId ? { id: BigInt(id) } : { appKey: id },
    });

    if (!app) return res.status(404).json({ error: 'App not found' });

    // 查询所有与该应用关联的计划（不管 planType 和 scopeType）
    // scopeType (GLOBAL/SPECIFIC_APP) 只用于权限控制，不影响查询条件
    // 关键是必须在 PricingPlanApp 表中有明确的关联记录
    const plans = await prisma.pricingPlan.findMany({
        where: {
            isActive: true,
            status: 'ACTIVE',
            apps: {
                some: { appId: app.id }
            }
        },
        include: {
            apps: { include: { app: true } },
            usagePacks: { include: { feature: true } }
        }
    });

    const serializedData = JSON.parse(JSON.stringify({ app, plans }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    res.json(serializedData);
});

// GET /api/store/plans
// Public: Get all active plans (SUBSCRIPTION, ONE_TIME, USAGE_PACK)
router.get('/plans', async (req: Request, res: Response) => {
    const { appId } = req.query;

    const plans = await prisma.pricingPlan.findMany({
        where: {
            isActive: true,
            status: 'ACTIVE',
            ...(appId && {
                apps: {
                    some: { appId: BigInt(appId as string) }
                }
            })
        },
        include: {
            apps: { include: { app: true } },
            usagePacks: { include: { feature: true } }
        },
        orderBy: { price: 'asc' }
    });
    const serializedPlans = JSON.parse(JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(serializedPlans);
});

// POST /api/store/checkout
// User: Create Order & Mock Payment
router.post('/checkout', async (req: AuthenticatedRequest, res: Response) => {
    const { planId, appId } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not found' });
    }

    try {
        const plan = await prisma.pricingPlan.findUnique({ where: { id: BigInt(planId) } });
        if (!plan) throw new Error('Plan not found');

        // 1. Create PENDING Order
        const order = await prisma.order.create({
            data: {
                orderNo: `ord_${Date.now()}`, // Simple ID generation
                userId: userId,
                pricingPlanId: BigInt(planId),
                amount: plan.price,
                currency: plan.currency,
                status: 'PAID', // Direct success for demo
                paidAt: new Date()
            }
        });

        // 2. Create Entitlement
        const entitlement = await prisma.userEntitlement.create({
            data: {
                userId: userId,
                sourceOrderId: order.id,
                entitlementType: plan.planType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'PERMANENT',
                // Set expiry if subscription
                expireTime: plan.planType === 'SUBSCRIPTION' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
            }
        });

        // 3. Link apps to entitlement from plan's apps
        const planApps = await prisma.pricingPlanApp.findMany({
            where: { pricingPlanId: BigInt(planId) }
        });

        // Create UserEntitlementApp entries for each app in the plan
        if (planApps.length > 0) {
            await prisma.userEntitlementApp.createMany({
                data: planApps.map(pa => ({
                    entitlementId: entitlement.id,
                    appId: pa.appId
                }))
            });
        }

        const serializedOrderId = JSON.parse(JSON.stringify({ success: true, orderId: order.id }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(serializedOrderId);

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/store/entitlements
router.get('/entitlements', async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not found' });
    }

    const entitlements = await prisma.userEntitlement.findMany({
        where: {
            userId: userId,
            status: 'ACTIVE'
        },
        include: {
            apps: { include: { app: true } },
            order: {
                include: {
                    pricingPlan: {
                        include: {
                            apps: { include: { app: true } }
                        }
                    }
                }
            }
        }
    });

    const serializedEntitlements = JSON.parse(JSON.stringify(entitlements, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    res.json(serializedEntitlements);
});

export default router;
