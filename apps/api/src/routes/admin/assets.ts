import express from 'express';
import { prisma } from '@repo/database';

const router = express.Router();

// GET /api/admin/assets
router.get('/', async (req, res) => {
    try {
        const assets = await prisma.asset.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(assets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/assets
router.post('/', async (req, res) => {
    try {
        const { assetType, name, thumbnailUrl, payload, requiredFeatureKey, status } = req.body;
        const newAsset = await prisma.asset.create({
            data: {
                assetType,
                name,
                thumbnailUrl,
                payload: payload ? (typeof payload === 'string' ? JSON.parse(payload) : payload) : null,
                requiredFeatureKey: requiredFeatureKey || null,
                status: status || 'active'
            }
        });
        res.json(newAsset);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/assets/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { assetType, name, thumbnailUrl, payload, requiredFeatureKey, status } = req.body;
        
        let parsedPayload = payload;
        if (typeof payload === 'string') {
            try { parsedPayload = JSON.parse(payload); } catch(e) {}
        }
        
        const updatedAsset = await prisma.asset.update({
            where: { id },
            data: {
                assetType,
                name,
                thumbnailUrl,
                payload: parsedPayload,
                requiredFeatureKey: requiredFeatureKey || null,
                status: status || 'active'
            }
        });
        res.json(updatedAsset);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/assets/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.asset.delete({ where: { id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
