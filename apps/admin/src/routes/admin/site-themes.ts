import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import type { Prisma } from '@prisma/client';

const router = express.Router();

const VALID_STATUSES = new Set(['draft', 'active', 'archived']);

function parseConfig(config: unknown): Prisma.InputJsonValue {
    if (typeof config === 'string') {
        return JSON.parse(config) as Prisma.InputJsonValue;
    }

    if (!config || typeof config !== 'object') {
        throw new Error('config must be a JSON object');
    }

    return config as Prisma.InputJsonValue;
}

async function deactivateOtherThemes(activeId: string) {
    await prisma.siteTheme.updateMany({
        where: {
            status: 'active',
            id: { not: activeId },
        },
        data: { status: 'draft' },
    });
}

// GET /api/admin/site-themes
router.get('/', async (_req: Request, res: Response) => {
    try {
        const themes = await prisma.siteTheme.findMany({
            orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        });
        res.json(themes);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/site-themes/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const theme = await prisma.siteTheme.findUnique({
            where: { id: req.params.id },
        });
        if (!theme) return res.status(404).json({ error: 'Site theme not found' });
        res.json(theme);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/site-themes
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, status = 'draft', config } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' });
        }
        if (!VALID_STATUSES.has(status)) {
            return res.status(400).json({ error: 'status must be draft, active, or archived' });
        }

        const theme = await prisma.siteTheme.create({
            data: {
                name,
                status,
                config: parseConfig(config),
            },
        });

        if (theme.status === 'active') {
            await deactivateOtherThemes(theme.id);
        }

        res.status(201).json(theme);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/admin/site-themes/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, status, config } = req.body;
        if (status !== undefined && !VALID_STATUSES.has(status)) {
            return res.status(400).json({ error: 'status must be draft, active, or archived' });
        }

        const data: Prisma.SiteThemeUpdateInput = {};
        if (name !== undefined) data.name = name;
        if (status !== undefined) data.status = status;
        if (config !== undefined) data.config = parseConfig(config);

        const theme = await prisma.siteTheme.update({
            where: { id },
            data,
        });

        if (theme.status === 'active') {
            await deactivateOtherThemes(theme.id);
        }

        res.json(theme);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/admin/site-themes/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await prisma.siteTheme.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
