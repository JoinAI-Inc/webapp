import express from 'express';
import { prisma } from '@repo/database';

const router = express.Router();
const db = prisma as any;

function ensureGenerationConfigClient() {
    if (!db.promptPolicy) {
        throw new Error('Prompt policy Prisma model is unavailable. Run prisma generate and restart the API service.');
    }
}

function parseJsonField(value: unknown) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        return JSON.parse(trimmed);
    }
    return value ?? null;
}

router.get('/options', async (_req, res) => {
    try {
        ensureGenerationConfigClient();
        const promptPolicies = await db.promptPolicy.findMany({
            where: { status: 'active' },
            orderBy: [{ key: 'asc' }, { version: 'desc' }],
        });
        res.json({ promptPolicies });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/prompt-policies', async (_req, res) => {
    try {
        ensureGenerationConfigClient();
        res.json(await db.promptPolicy.findMany({ orderBy: [{ key: 'asc' }, { version: 'desc' }] }));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/prompt-policies', async (req, res) => {
    try {
        ensureGenerationConfigClient();
        const { key, version, name, config, status } = req.body;
        if (!key || !version || !name || !config) {
            return res.status(400).json({ error: 'key, version, name, config are required' });
        }
        res.status(201).json(await db.promptPolicy.create({
            data: { key, version: Number(version), name, config: parseJsonField(config), status: status || 'draft' },
        }));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/prompt-policies/:id', async (req, res) => {
    try {
        ensureGenerationConfigClient();
        const { key, version, name, config, status } = req.body;
        res.json(await db.promptPolicy.update({
            where: { id: req.params.id },
            data: { key, version: Number(version), name, config: parseJsonField(config), status },
        }));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
