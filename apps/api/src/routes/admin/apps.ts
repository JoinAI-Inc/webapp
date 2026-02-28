import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { serializeBigInt } from './utils.js';

const router = express.Router();

// GET /api/admin/apps
router.get('/', async (req: Request, res: Response) => {
    const apps = await prisma.app.findMany({
        orderBy: { createdAt: 'desc' },
        include: { pricingPlans: { include: { pricingPlan: true } } }
    });
    res.json(serializeBigInt(apps));
});

// POST /api/admin/apps
router.post('/', async (req: Request, res: Response) => {
    const { name, appKey, description, accessUrl } = req.body;
    try {
        const app = await prisma.app.create({ data: { name, appKey, description, accessUrl } });
        res.json(serializeBigInt(app));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/admin/apps/:id
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, accessUrl, status, planIds } = req.body;
    try {
        const app = await prisma.app.update({ where: { id: BigInt(id) }, data: { name, description, accessUrl, status } });
        if (planIds && Array.isArray(planIds)) {
            await prisma.pricingPlanApp.deleteMany({ where: { appId: BigInt(id) } });
            if (planIds.length > 0) {
                await prisma.pricingPlanApp.createMany({
                    data: planIds.map((planId: any) => ({ appId: BigInt(id), pricingPlanId: BigInt(planId) }))
                });
            }
        }
        res.json(serializeBigInt(app));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/admin/apps/:id/deletion-blockers
router.get('/:id/deletion-blockers', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const app = await prisma.app.findUnique({
            where: { id: BigInt(id) },
            include: {
                pricingPlans: { include: { pricingPlan: true } },
                entitlementApps: { include: { entitlement: true } }
            }
        });
        if (!app) return res.status(404).json({ error: 'App not found' });

        const activePricingPlans = app.pricingPlans.filter((pp: any) => pp.pricingPlan.status === 'ACTIVE');
        const activeEntitlements = app.entitlementApps.filter((ea: any) => ea.entitlement.status === 'ACTIVE');
        const permanentPurchases = activeEntitlements.filter((ea: any) => ea.entitlement.entitlementType === 'PERMANENT');

        res.json({
            hasActivePricingPlans: activePricingPlans.map((pp: any) => ({
                id: pp.pricingPlan.id.toString(), name: pp.pricingPlan.name, status: pp.pricingPlan.status
            })),
            hasActiveEntitlements: activeEntitlements.length,
            hasPermanentPurchases: permanentPurchases.length,
            canUnlist: app.status === 'PUBLISHED',
            canDisable: ['PUBLISHED', 'UNLISTED'].includes(app.status),
            canSunset: ['UNLISTED', 'DISABLED'].includes(app.status),
            canArchive: activeEntitlements.length === 0 && ['DISABLED', 'SUNSET'].includes(app.status),
            canRepublish: ['UNLISTED', 'DISABLED'].includes(app.status)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/apps/:id/unlist
router.post('/:id/unlist', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const app = await prisma.app.update({ where: { id: BigInt(id) }, data: { status: 'UNLISTED', purchasable: false } });
        res.json(serializeBigInt(app));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// POST /api/admin/apps/:id/disable
router.post('/:id/disable', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const app = await prisma.app.update({ where: { id: BigInt(id) }, data: { status: 'DISABLED', allowInNewPlan: false } });
        res.json(serializeBigInt(app));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// POST /api/admin/apps/:id/sunset
router.post('/:id/sunset', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { sunsetAt, reason } = req.body;
    try {
        if (!sunsetAt) return res.status(400).json({ error: 'sunsetAt is required' });
        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: { status: 'SUNSET', sunsetAt: new Date(sunsetAt), archivedReason: reason }
        });
        res.json(serializeBigInt(app));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// POST /api/admin/apps/:id/archive
router.post('/:id/archive', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        const activeEntitlements = await prisma.userEntitlementApp.count({
            where: { appId: BigInt(id), entitlement: { status: 'ACTIVE' } }
        });
        if (activeEntitlements > 0) {
            return res.status(400).json({ error: `Cannot archive: ${activeEntitlements} active entitlement(s) exist` });
        }
        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: { status: 'ARCHIVED', archivedAt: new Date(), archivedReason: reason }
        });
        res.json(serializeBigInt(app));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// POST /api/admin/apps/:id/republish
router.post('/:id/republish', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const app = await prisma.app.update({
            where: { id: BigInt(id) },
            data: { status: 'PUBLISHED', purchasable: true, allowInNewPlan: true, sunsetAt: null, archivedAt: null, archivedReason: null }
        });
        res.json(serializeBigInt(app));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
