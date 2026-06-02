import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { verifyInternalRequest } from '../lib/internal-auth.js';

const router = express.Router();

function getUserId(req: Request): string | null {
    return verifyInternalRequest(
        req.headers['x-internal-user-id'] as string | undefined,
        req.headers['x-internal-timestamp'] as string | undefined,
        req.headers['x-internal-signature'] as string | undefined,
    );
}

// GET /api/history?page=1&type=template&pageSize=20
router.get('/', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const type = req.query.type as string | undefined;

    const where: any = { appId: 'bacc', userId, status: 'active' };
    if (type) {
        where.generationType = (type === 'magic' || type === 'hanfu') ? 'portrait' : type;
    }

    const [items, total] = await Promise.all([
        prisma.mediaFile.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.mediaFile.count({ where })
    ]);

    res.json({
        items: items.map(item => ({
            id: item.id,
            fileName: item.fileName,
            fileType: item.fileType,
            url: item.storageUrl,
            thumbnailUrl: item.thumbnailUrl,
            generationType: item.generationType,
            metadata: item.metadata,
            promptData: item.promptData,
            templateId: item.templateId,
            createdAt: item.createdAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// GET /api/history/:id
router.get('/:id', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await prisma.mediaFile.findFirst({
        where: { id: req.params.id, userId, appId: 'bacc', status: 'active' }
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.json({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        url: file.storageUrl,
        thumbnailUrl: file.thumbnailUrl,
        generationType: file.generationType,
        metadata: file.metadata,
        promptData: file.promptData,
        templateId: file.templateId,
        createdAt: file.createdAt,
    });
});

// DELETE /api/history/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await prisma.mediaFile.findFirst({
        where: { id: req.params.id, userId, appId: 'bacc' }
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await prisma.mediaFile.update({
        where: { id: req.params.id },
        data: { status: 'deleted', deletedAt: new Date() }
    });

    res.json({ success: true, deletedAt: new Date() });
});

export default router;
