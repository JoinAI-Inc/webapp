import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';

const router = express.Router();

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 从 Authorization header 获取 userId（复用现有 nextauth session 逻辑） */
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const token = req.headers['authorization'];
    if (!token || !token.startsWith('Bearer ')) return null;
    const sessionToken = token.replace('Bearer ', '');
    const session = await (prisma as any).session.findUnique({
        where: { sessionToken },
        select: { userId: true, expires: true }
    });
    if (!session || session.expires < new Date()) return null;
    return session.userId;
}

// ─── 公开接口 ─────────────────────────────────────────────────────────────────

/**
 * GET /api/templates
 * 获取模板列表
 * Query: tagIds (逗号分隔), page, pageSize
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { tagIds, page = '1', pageSize = '20' } = req.query;
        const userId = await getUserIdFromRequest(req);

        const pageNum = Math.max(1, parseInt(page as string));
        const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string)));
        const skip = (pageNum - 1) * sizeNum;

        const tagIdList = tagIds
            ? (tagIds as string).split(',').filter(Boolean)
            : [];

        const where: any = { status: 'PUBLISHED' };
        if (tagIdList.length > 0) {
            where.tags = { some: { tagId: { in: tagIdList } } };
        }

        const [templates, total] = await Promise.all([
            (prisma as any).template.findMany({
                where,
                skip,
                take: sizeNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    tags: { include: { tag: true } },
                    slots: { orderBy: { sortOrder: 'asc' } },
                    ...(userId
                        ? { favorites: { where: { userId }, select: { id: true } } }
                        : {})
                }
            }),
            (prisma as any).template.count({ where })
        ]);

        const data = templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            imageUrl: t.imageUrl,
            resolution: t.resolution,
            theme: t.theme,
            favoriteCount: t.favoriteCount,
            isFavorited: userId ? t.favorites?.length > 0 : false,
            tags: t.tags.map((tt: any) => ({ id: tt.tag.id, name: tt.tag.name })),
            slots: t.slots.map((s: any) => ({
                id: s.id,
                slotType: s.slotType,
                refId: s.refId,
                label: s.label,
                description: s.description,
                sortOrder: s.sortOrder
            }))
        }));

        res.json({ data, total, page: pageNum, pageSize: sizeNum });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/:id
 * 获取模板详情（含完整 descriptor）
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = await getUserIdFromRequest(req);

        const template = await (prisma as any).template.findUnique({
            where: { id },
            include: {
                tags: { include: { tag: true } },
                slots: { orderBy: { sortOrder: 'asc' } },
                ...(userId
                    ? { favorites: { where: { userId }, select: { id: true } } }
                    : {})
            }
        });

        if (!template || template.status === 'ARCHIVED') {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({
            id: template.id,
            name: template.name,
            imageUrl: template.imageUrl,
            resolution: template.resolution,
            theme: template.theme,
            descriptor: template.descriptor,
            favoriteCount: template.favoriteCount,
            isFavorited: userId ? template.favorites?.length > 0 : false,
            tags: template.tags.map((tt: any) => ({ id: tt.tag.id, name: tt.tag.name })),
            slots: template.slots
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/templates/:id/favorite
 * 收藏 / 取消收藏（需要登录）
 */
router.post('/:id/favorite', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = await getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const template = await (prisma as any).template.findUnique({ where: { id } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const existing = await (prisma as any).templateFavorite.findUnique({
            where: { userId_templateId: { userId, templateId: id } }
        });

        if (existing) {
            // 取消收藏
            await (prisma as any).templateFavorite.delete({ where: { id: existing.id } });
            await (prisma as any).template.update({
                where: { id },
                data: { favoriteCount: { decrement: 1 } }
            });
            return res.json({ isFavorited: false });
        } else {
            // 添加收藏
            await (prisma as any).templateFavorite.create({
                data: { id: crypto.randomUUID(), userId, templateId: id }
            });
            await (prisma as any).template.update({
                where: { id },
                data: { favoriteCount: { increment: 1 } }
            });
            return res.json({ isFavorited: true });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/tags/list
 * 获取所有标签（用于过滤器）
 */
router.get('/tags/list', async (_req: Request, res: Response) => {
    try {
        const tags = await (prisma as any).tag.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(tags);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
