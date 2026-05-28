import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';

const router = express.Router();

// GET /api/site-theme
router.get('/', async (_req: Request, res: Response) => {
    try {
        const theme = await prisma.siteTheme.findFirst({
            where: { status: 'active' },
            orderBy: { updatedAt: 'desc' },
        });

        if (!theme) {
            return res.json(null);
        }

        res.json({
            id: theme.id,
            name: theme.name,
            config: theme.config,
            updatedAt: theme.updatedAt,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
