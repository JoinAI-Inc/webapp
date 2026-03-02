import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import type { Prisma } from '@prisma/client';
import { verifyInternalRequest } from '../lib/internal-auth.js';

const router = express.Router();

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 从请求中获取 userId：优先验证内部签名，其次验证 Bearer session token */
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    // 内部服务调用：验证 HMAC 签名
    const internalUserId = req.headers['x-internal-user-id'] as string | undefined;
    const timestamp = req.headers['x-internal-timestamp'] as string | undefined;
    const signature = req.headers['x-internal-signature'] as string | undefined;
    if (internalUserId) {
        return verifyInternalRequest(internalUserId, timestamp, signature);
    }

    const token = req.headers['authorization'];
    if (!token || !token.startsWith('Bearer ')) return null;
    const sessionToken = token.replace('Bearer ', '');
    const session = await prisma.session.findUnique({
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

        const where: Prisma.TemplateWhereInput = { status: 'PUBLISHED' };
        if (tagIdList.length > 0) {
            where.tags = { some: { tagId: { in: tagIdList } } };
        }

        const includeBase: Prisma.TemplateInclude = {
            tags: { include: { tag: true } },
            slots: { orderBy: { sortOrder: 'asc' } },
        };
        if (userId) {
            includeBase.favorites = { where: { userId }, select: { id: true } };
        }

        const [templates, total] = await Promise.all([
            prisma.template.findMany({
                where,
                skip,
                take: sizeNum,
                orderBy: { createdAt: 'desc' },
                include: includeBase,
            }),
            prisma.template.count({ where })
        ]);

        const data = templates.map((t: typeof templates[number]) => ({
            id: t.id,
            name: t.name,
            imageUrl: t.imageUrl,
            resolution: t.resolution,
            theme: t.theme,
            favoriteCount: t.favoriteCount,
            isFavorited: userId ? (t.favorites?.length ?? 0) > 0 : false,
            tags: t.tags.map((tt: any) => ({ id: tt.tag.id, name: tt.tag.name })),
            slots: t.slots.map((s: typeof t.slots[number]) => ({
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
 * GET /api/templates/tags/list
 * 获取所有标签（用于过滤器）
 * 注意：必须在 /:id 之前注册，否则 "tags" 会被当作 id
 */
router.get('/tags/list', async (_req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(tags);
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

        const includeBase: Prisma.TemplateInclude = {
            tags: { include: { tag: true } },
            slots: { orderBy: { sortOrder: 'asc' } },
        };
        if (userId) {
            includeBase.favorites = { where: { userId }, select: { id: true } };
        }

        const template = await prisma.template.findUnique({
            where: { id },
            include: includeBase,
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
            isFavorited: userId ? (template.favorites?.length ?? 0) > 0 : false,
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

        const template = await prisma.template.findUnique({ where: { id } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const existing = await prisma.templateFavorite.findUnique({
            where: { userId_templateId: { userId, templateId: id } }
        });

        if (existing) {
            // 取消收藏
            await prisma.templateFavorite.delete({ where: { id: existing.id } });
            await prisma.template.update({
                where: { id },
                data: { favoriteCount: { decrement: 1 } }
            });
            return res.json({ isFavorited: false });
        } else {
            // 添加收藏
            await prisma.templateFavorite.create({
                data: { id: crypto.randomUUID(), userId, templateId: id }
            });
            await prisma.template.update({
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
 * POST /api/templates/:id/generate
 * 基于模板生成图像（需要登录）
 * Body: { slots: Array<{ refId: string; imageSource: string }> }
 * 将任务提交到队列，返回 taskId 供轮询
 */
router.post('/:id/generate', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = await getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { slots } = req.body as {
            slots: Array<{ refId: string; slotType?: string; imageSource: string }>;
        };

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ error: 'slots is required and must be a non-empty array' });
        }

        // 获取模板信息（descriptor + slots 定义）
        const template = await prisma.template.findUnique({
            where: { id },
            include: { slots: { orderBy: { sortOrder: 'asc' } } }
        });

        if (!template || template.status === 'ARCHIVED') {
            return res.status(404).json({ error: 'Template not found' });
        }

        // 校验必填 slot 是否都已提供 (仅 PERSON 槽位为必填)
        const requiredSlotIds = template.slots
            .filter((s: typeof template.slots[number]) => s.slotType === 'PERSON')
            .map((s: typeof template.slots[number]) => s.refId);
        const providedIds = slots.map((s: { refId: string; slotType?: string; imageSource: string }) => s.refId);
        const missing = requiredSlotIds.filter((rid: string) => !providedIds.includes(rid));
        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required slots: ${missing.join(', ')}` });
        }

        // 构建生成 payload
        const payload = {
            templateId: id,
            templateName: template.name,
            templateImageUrl: template.imageUrl ?? undefined,   // 模板原图（第1张参考图）
            descriptor: template.descriptor,
            slots: slots.map((s) => ({
                refId: s.refId,
                slotType: s.slotType || 'IMAGE',
                imageSource: s.imageSource,
            })),
        };

        // 提交到队列
        const { taskManager } = await import('../lib/queue/task-manager.js');
        const { userTaskTracker } = await import('../lib/queue/user-task-tracker.js');

        const taskId = await taskManager.submitTask({
            userId,
            type: 'template',
            payload,
        });

        await userTaskTracker.setCurrentTask(userId, taskId, {
            type: 'template',
            payload,
            submittedAt: new Date().toISOString(),
        });

        console.log(`[Templates API] Template generation task ${taskId} submitted by user ${userId}`);

        res.json({
            taskId,
            status: 'pending',
            message: 'Task submitted. Poll /api/queue/status?taskId= to track progress.',
        });
    } catch (error: any) {
        console.error('[Templates API] Generate error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
