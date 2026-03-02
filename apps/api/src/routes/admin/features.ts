import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { serializeBigInt } from './utils.js';

const router = express.Router();

// GET /api/admin/features
router.get('/', async (req: Request, res: Response) => {
    try {
        const features = await prisma.feature.findMany({ orderBy: { createdAt: 'desc' }, include: { app: true } });
        res.json(serializeBigInt(features));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/features
router.post('/', async (req: Request, res: Response) => {
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
router.put('/:id', async (req: Request, res: Response) => {
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
