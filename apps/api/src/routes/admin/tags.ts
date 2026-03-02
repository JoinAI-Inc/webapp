import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';

const router = express.Router();

// GET /api/admin/tags
router.get('/', async (_req: Request, res: Response) => {
    try {
        res.json(await prisma.tag.findMany({ orderBy: { name: 'asc' } }));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// POST /api/admin/tags
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });
        res.status(201).json(await prisma.tag.create({ data: { id: crypto.randomUUID(), name } }));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// DELETE /api/admin/tags/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await prisma.tag.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
