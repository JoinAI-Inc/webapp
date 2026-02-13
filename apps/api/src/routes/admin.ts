import express, { Request, Response, NextFunction } from 'express';
import { prisma, OrderStatus } from '@repo/database';

const router = express.Router();

// Middleware to check admin secret (Simple Mock Auth)
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (token !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

router.use(adminAuth);

// --- USER MANAGEMENT ---

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { orders: true, entitlements: true }
            }
        }
    });

    // Calculate total spent for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
        const orders = await prisma.order.findMany({
            where: { userId: user.id, status: 'PAID' }
        });
        const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);

        return {
            ...user,
            totalSpent,
            orderCount: user._count.orders,
            activeEntitlements: user._count.entitlements
        };
    }));

    // Serialize BigInt for JSON response
    const serializedUsers = JSON.parse(JSON.stringify(usersWithStats, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    res.json(serializedUsers);
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },  // id is now String
        include: {
            entitlements: {
                include: { apps: { include: { app: true } } },
                where: { status: 'ACTIVE' }
            }
        }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate stats from orders separately
    const orders = await prisma.order.findMany({
        where: { userId: id, status: 'PAID' }
    });
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);

    // Serialize BigInt for JSON response
    const serializedUser = JSON.parse(JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    res.json({ ...serializedUser, totalSpent });
});

// PATCH /api/admin/users/:id/lock
router.patch('/users/:id/lock', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isLocked } = req.body;

    try {
        const user = await prisma.user.update({
            where: { id },  // id is now String
            data: { status: isLocked ? 'LOCKED' : 'ACTIVE' }
        });
        // Serialize BigInt
        const serializedUser = JSON.parse(JSON.stringify(user, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedUser);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- APP MANAGEMENT ---

// GET /api/admin/apps
router.get('/apps', async (req: Request, res: Response) => {
    const apps = await prisma.app.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            pricingPlans: {
                include: { pricingPlan: true }
            }
        }
    });
    // Serialize BigInt
    const serializedApps = JSON.parse(JSON.stringify(apps, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(serializedApps);
});

// POST /api/admin/apps
router.post('/apps', async (req: Request, res: Response) => {
    const { name, appKey, description, accessUrl } = req.body;
    try {
        const app = await prisma.app.create({
            data: { name, appKey, description, accessUrl }
        });
        const serializedApp = JSON.parse(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedApp);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/admin/apps/:id
router.put('/apps/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, accessUrl, status, planIds } = req.body;

    try {
        // Update basic info
        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: { name, description, accessUrl, status }
        });

        // Update pricing plans if provided
        if (planIds && Array.isArray(planIds)) {
            // 1. Remove existing relations
            await prisma.pricingPlanApp.deleteMany({
                where: { appId: BigInt(id) }
            });
            // 2. Add new relations
            if (planIds.length > 0) {
                await prisma.pricingPlanApp.createMany({
                    data: planIds.map((planId: any) => ({ appId: BigInt(id), pricingPlanId: BigInt(planId) }))
                });
            }
        }

        const serializedApp = JSON.parse(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedApp);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- APP LIFECYCLE MANAGEMENT ---

// GET /api/admin/apps/:id/deletion-blockers
router.get('/apps/:id/deletion-blockers', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const app = await prisma.app.findUnique({
            where: { id: BigInt(id) },
            include: {
                pricingPlans: {
                    include: { pricingPlan: true }
                },
                entitlementApps: {
                    include: { entitlement: true }
                }
            }
        });

        if (!app) return res.status(404).json({ error: 'App not found' });

        // Check active pricing plans
        const activePricingPlans = app.pricingPlans.filter(
            pp => pp.pricingPlan.status === 'ACTIVE'
        );

        // Check active entitlements
        const activeEntitlements = app.entitlementApps.filter(
            ea => ea.entitlement.status === 'ACTIVE'
        );

        // Check permanent purchases
        const permanentPurchases = activeEntitlements.filter(
            ea => ea.entitlement.entitlementType === 'PERMANENT'
        );

        const blockers = {
            hasActivePricingPlans: activePricingPlans.map(pp => ({
                id: pp.pricingPlan.id.toString(),
                name: pp.pricingPlan.name,
                status: pp.pricingPlan.status
            })),
            hasActiveEntitlements: activeEntitlements.length,
            hasPermanentPurchases: permanentPurchases.length,
            canUnlist: app.status === 'PUBLISHED',
            canDisable: ['PUBLISHED', 'UNLISTED'].includes(app.status),
            canSunset: ['UNLISTED', 'DISABLED'].includes(app.status),
            canArchive: activeEntitlements.length === 0 && ['DISABLED', 'SUNSET'].includes(app.status),
            canRepublish: ['UNLISTED', 'DISABLED'].includes(app.status)
        };

        res.json(blockers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/apps/:id/unlist
router.post('/apps/:id/unlist', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: {
                status: 'UNLISTED',
                purchasable: false
            }
        });

        const serializedApp = JSON.parse(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedApp);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/admin/apps/:id/disable
router.post('/apps/:id/disable', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: {
                status: 'DISABLED',
                allowInNewPlan: false
            }
        });

        const serializedApp = JSON.parse(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedApp);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/admin/apps/:id/sunset
router.post('/apps/:id/sunset', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { sunsetAt, reason } = req.body;

    try {
        if (!sunsetAt) {
            return res.status(400).json({ error: 'sunsetAt is required' });
        }

        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: {
                status: 'SUNSET',
                sunsetAt: new Date(sunsetAt),
                archivedReason: reason
            }
        });

        const serializedApp = JSON.parse(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedApp);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/admin/apps/:id/archive
router.post('/apps/:id/archive', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        // Check blockers first
        const activeEntitlements = await prisma.userEntitlementApp.count({
            where: {
                appId: BigInt(id),
                entitlement: { status: 'ACTIVE' }
            }
        });

        if (activeEntitlements > 0) {
            return res.status(400).json({
                error: `Cannot archive: ${activeEntitlements} active entitlement(s) exist`
            });
        }

        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: {
                status: 'ARCHIVED',
                archivedAt: new Date(),
                archivedReason: reason
            }
        });

        const serializedApp = JSON.parse(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedApp);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/admin/apps/:id/republish
router.post('/apps/:id/republish', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: {
                status: 'PUBLISHED',
                purchasable: true,
                allowInNewPlan: true,
                sunsetAt: null,
                archivedAt: null,
                archivedReason: null
            }
        });

        const serializedApp = JSON.parse(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedApp);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- PRICING MANAGEMENT ---

// GET /api/admin/plans
router.get('/plans', async (req: Request, res: Response) => {
    const plans = await prisma.pricingPlan.findMany({
        orderBy: { createdAt: 'desc' },
        include: { apps: true }
    });
    const serializedPlans = JSON.parse(JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(serializedPlans);
});

// POST /api/admin/plans
router.post('/plans', async (req: Request, res: Response) => {
    const { name, type, price, currency, interval, appIds } = req.body;

    try {
        // All plans must have associated apps
        if (!appIds || appIds.length === 0) {
            return res.status(400).json({ error: 'At least one app must be selected' });
        }

        const plan = await prisma.pricingPlan.create({
            data: {
                name,
                planType: type,
                price,
                currency,
                billingInterval: interval
            }
        });

        // Link to apps
        await prisma.pricingPlanApp.createMany({
            data: appIds.map((id: any) => ({ appId: BigInt(id), pricingPlanId: plan.id }))
        });

        const serializedPlan = JSON.parse(JSON.stringify(plan, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedPlan);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/admin/plans/:id - Update pricing plan
router.put('/plans/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type, price, currency, interval, appIds } = req.body;

    try {
        // All plans must have associated apps
        if (!appIds || appIds.length === 0) {
            return res.status(400).json({ error: 'At least one app must be selected' });
        }

        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: {
                name,
                planType: type,
                price,
                currency,
                billingInterval: interval
            }
        });

        // Update app associations
        // Delete existing links
        await prisma.pricingPlanApp.deleteMany({
            where: { pricingPlanId: plan.id }
        });

        // Create new links
        await prisma.pricingPlanApp.createMany({
            data: appIds.map((appId: any) => ({ appId: BigInt(appId), pricingPlanId: plan.id }))
        });

        const serializedPlan = JSON.parse(JSON.stringify(plan, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedPlan);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- PRICING PLAN LIFECYCLE MANAGEMENT ---

// GET /api/admin/plans/:id/deletion-blockers
router.get('/plans/:id/deletion-blockers', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const plan = await prisma.pricingPlan.findUnique({
            where: { id: BigInt(id) },
            include: {
                orders: true
            }
        });

        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        // Count active orders and subscriptions
        const activeOrders = plan.orders.filter(o => o.status === 'PAID').length;
        const pendingOrders = plan.orders.filter(o => o.status === 'PENDING').length;

        // Count active subscriptions (entitlements with subscription type)
        const activeSubscriptions = await prisma.userEntitlement.count({
            where: {
                sourceOrderId: { in: plan.orders.map(o => o.id) },
                entitlementType: 'SUBSCRIPTION',
                status: 'ACTIVE'
            }
        });

        // Calculate total revenue
        const totalRevenue = plan.orders
            .filter(o => o.status === 'PAID')
            .reduce((sum, o) => sum + Number(o.amount), 0);

        const blockers = {
            activeOrders,
            activeSubscriptions,
            pendingOrders,
            totalRevenue,
            canRetire: plan.status === 'ACTIVE',
            canArchive: activeSubscriptions === 0 && pendingOrders === 0 && plan.status === 'RETIRED',
            canReactivate: plan.status === 'RETIRED'
        };

        res.json(blockers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/plans/:id/retire
router.post('/plans/:id/retire', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { replacementPlanId } = req.body;

    try {
        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: {
                status: 'RETIRED',
                sellable: false,
                retiredAt: new Date(),
                replacementPlanId: replacementPlanId ? BigInt(replacementPlanId) : null
            }
        });

        const serializedPlan = JSON.parse(JSON.stringify(plan, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedPlan);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/admin/plans/:id/archive
router.post('/plans/:id/archive', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        // Check blockers first
        const activeSubscriptions = await prisma.userEntitlement.count({
            where: {
                order: { pricingPlanId: BigInt(id) },
                entitlementType: 'SUBSCRIPTION',
                status: 'ACTIVE'
            }
        });

        if (activeSubscriptions > 0) {
            return res.status(400).json({
                error: `Cannot archive: ${activeSubscriptions} active subscription(s) exist`
            });
        }

        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: {
                status: 'ARCHIVED',
                archivedAt: new Date(),
                archivedReason: reason
            }
        });

        const serializedPlan = JSON.parse(JSON.stringify(plan, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedPlan);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/admin/plans/:id/reactivate
router.post('/plans/:id/reactivate', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const plan = await prisma.pricingPlan.update({
            where: { id: BigInt(id) },
            data: {
                status: 'ACTIVE',
                sellable: true,
                retiredAt: null,
                archivedAt: null,
                archivedReason: null
            }
        });

        const serializedPlan = JSON.parse(JSON.stringify(plan, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(serializedPlan);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- STATS ---

// GET /api/admin/stats/revenue
router.get('/stats/revenue', async (req: Request, res: Response) => {
    try {
        // Calculate date range (last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6); // Include today, so -6
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Get all PAID orders in the last 7 days
        const orders = await prisma.order.findMany({
            where: {
                status: 'PAID',
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            select: {
                amount: true,
                createdAt: true
            }
        });

        // Group by date and calculate revenue
        const revenueByDate: { [key: string]: number } = {};

        orders.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
            const amount = Number(order.amount);
            revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + amount;
        });

        // Generate array for last 7 days with proper day names
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dateKey = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];

            data.push({
                name: dayName,
                revenue: revenueByDate[dateKey] || 0
            });
        }

        res.json(data);
    } catch (error: any) {
        console.error('Revenue stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/stats/overview
router.get('/stats/overview', async (req: Request, res: Response) => {
    try {
        // Run all queries in parallel
        const [
            totalOrdersCount,
            paidOrders,
            totalUsers,
            activeEntitlements
        ] = await Promise.all([
            // Total orders count
            prisma.order.count(),

            // All PAID orders for revenue calculation
            prisma.order.findMany({
                where: { status: 'PAID' },
                select: { amount: true, createdAt: true }
            }),

            // Total users
            prisma.user.count(),

            // Active entitlements
            prisma.userEntitlement.count({
                where: { status: 'ACTIVE' }
            })
        ]);

        // Calculate total revenue
        const totalRevenue = paidOrders.reduce((sum: number, order) =>
            sum + Number(order.amount), 0
        );

        // Calculate last month stats
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

        const lastMonthOrders = paidOrders.filter(order =>
            order.createdAt >= lastMonthStart && order.createdAt < lastMonthEnd
        );

        const revenueLastMonth = lastMonthOrders.reduce((sum, order) =>
            sum + Number(order.amount), 0
        );

        res.json({
            totalRevenue,
            totalOrders: totalOrdersCount,
            totalUsers,
            activeEntitlements,
            revenueLastMonth,
            ordersLastMonth: lastMonthOrders.length
        });
    } catch (error: any) {
        console.error('Overview stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- STRIPE MANAGEMENT ---

// POST /api/admin/stripe/sync-products
router.post('/stripe/sync-products', async (req: Request, res: Response) => {
    try {
        const { syncProductsFromStripe } = await import('../services/stripe/sync');
        const result = await syncProductsFromStripe();

        res.json(result);
    } catch (error: any) {
        console.error('Stripe sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/stripe/reconcile
router.get('/stripe/reconcile', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const { reconcileOrders } = await import('../services/stripe/sync');
        const result = await reconcileOrders(days);

        res.json(result);
    } catch (error: any) {
        console.error('Reconciliation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/stripe/fix-mismatch
router.post('/stripe/fix-mismatch', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        const { fixOrderMismatch } = await import('../services/stripe/sync');
        await fixOrderMismatch(sessionId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Fix mismatch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/stripe/sync-subscriptions
router.post('/stripe/sync-subscriptions', async (req: Request, res: Response) => {
    try {
        const { syncAllSubscriptions } = await import('../services/stripe/sync');
        const result = await syncAllSubscriptions();

        res.json(result);
    } catch (error: any) {
        console.error('Sync subscriptions error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

