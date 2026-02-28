import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { serializeBigInt } from './utils.js';

const router = express.Router();

// GET /api/admin/users
router.get('/', async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { orders: true, entitlements: true } } }
    });

    const usersWithStats = await Promise.all(users.map(async (user) => {
        const orders = await prisma.order.findMany({ where: { userId: user.id, status: 'PAID' } });
        const totalSpent = orders.reduce((sum, o) => sum + Number(o.amount), 0);
        return { ...user, totalSpent, orderCount: user._count.orders, activeEntitlements: user._count.entitlements };
    }));

    res.json(serializeBigInt(usersWithStats));
});

// GET /api/admin/users/:id
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
        where: { id },
        include: { entitlements: { include: { apps: { include: { app: true } } }, where: { status: 'ACTIVE' } } }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const orders = await prisma.order.findMany({ where: { userId: id, status: 'PAID' } });
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.amount), 0);
    res.json({ ...serializeBigInt(user), totalSpent });
});

// PATCH /api/admin/users/:id/lock
router.patch('/:id/lock', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isLocked } = req.body;
    try {
        const user = await prisma.user.update({ where: { id }, data: { status: isLocked ? 'LOCKED' : 'ACTIVE' } });
        res.json(serializeBigInt(user));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/admin/features
router.get('/features', async (req: Request, res: Response) => {
    try {
        const features = await prisma.feature.findMany({ orderBy: { createdAt: 'desc' }, include: { app: true } });
        res.json(serializeBigInt(features));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/features
router.post('/features', async (req: Request, res: Response) => {
    const { featureKey, appId, name, description, isActive } = req.body;
    try {
        const feature = await prisma.feature.create({
            data: { featureKey, appId: BigInt(appId), name, description, isActive: isActive !== undefined ? isActive : true },
            include: { app: true }
        });
        res.json(serializeBigInt(feature));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/admin/features/:id
router.put('/features/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { featureKey, appId, name, description, isActive } = req.body;
    try {
        const feature = await prisma.feature.update({
            where: { id: BigInt(id) },
            data: {
                ...(featureKey && { featureKey }),
                ...(appId && { appId: BigInt(appId) }),
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive })
            },
            include: { app: true }
        });
        res.json(serializeBigInt(feature));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
