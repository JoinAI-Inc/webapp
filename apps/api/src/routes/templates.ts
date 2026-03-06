import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import type { Prisma } from '@prisma/client';
import { verifyInternalRequest } from '../lib/internal-auth.js';

const router = express.Router();

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

async function getUserIdFromRequest(req: Request): Promise<string | null> {
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
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { tagIds, page = '1', pageSize = '20' } = req.query;
        const userId = await getUserIdFromRequest(req);

        const pageNum = Math.max(1, parseInt(page as string));
        const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string)));
        const skip = (pageNum - 1) * sizeNum;

        const tagIdList = tagIds ? (tagIds as string).split(',').filter(Boolean) : [];

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
            prisma.template.findMany({ where, skip, take: sizeNum, orderBy: { createdAt: 'desc' }, include: includeBase }),
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
                id: s.id, slotType: s.slotType, refId: s.refId,
                label: s.label, description: s.description, sortOrder: s.sortOrder
            }))
        }));

        res.json({ data, total, page: pageNum, pageSize: sizeNum });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/tags/list
 * 必须在 /:id 之前注册
 */
router.get('/tags/list', async (_req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        res.json(tags);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/favorites
 * 必须在 /:id 之前注册
 */
router.get('/favorites', async (req: Request, res: Response) => {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const favorites = await prisma.templateFavorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                template: {
                    include: { tags: { include: { tag: true } } }
                }
            }
        });

        const data = favorites
            .filter((f: any) => f.template && f.template.status !== 'ARCHIVED')
            .map((f: any) => ({
                id: f.template.id,
                name: f.template.name,
                imageUrl: f.template.imageUrl,
                resolution: f.template.resolution,
                theme: f.template.theme,
                favoriteCount: f.template.favoriteCount,
                isFavorited: true,
                tags: f.template.tags.map((tt: any) => ({ id: tt.tag.id, name: tt.tag.name })),
            }));

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/:id
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

        const template = await prisma.template.findUnique({ where: { id }, include: includeBase });
        if (!template || template.status === 'ARCHIVED') {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({
            id: template.id, name: template.name, imageUrl: template.imageUrl,
            resolution: template.resolution, theme: template.theme,
            descriptor: template.descriptor, favoriteCount: template.favoriteCount,
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
 */
router.post('/:id/favorite', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = await getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const template = await prisma.template.findUnique({ where: { id } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const existing = await prisma.templateFavorite.findUnique({
            where: { userId_templateId: { userId, templateId: id } }
        });

        if (existing) {
            await prisma.templateFavorite.delete({ where: { id: existing.id } });
            await prisma.template.update({ where: { id }, data: { favoriteCount: { decrement: 1 } } });
            return res.json({ isFavorited: false });
        } else {
            await prisma.templateFavorite.create({ data: { id: crypto.randomUUID(), userId, templateId: id } });
            await prisma.template.update({ where: { id }, data: { favoriteCount: { increment: 1 } } });
            return res.json({ isFavorited: true });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/:id/last-result
 */
router.get('/:id/last-result', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = await getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const media = await prisma.mediaFile.findFirst({
            where: { userId, templateId: id, generationType: 'template', status: 'active' },
            orderBy: { createdAt: 'desc' },
            select: { storageUrl: true, createdAt: true },
        });

        return res.json(media ? { imageUrl: media.storageUrl, createdAt: media.createdAt } : { imageUrl: null });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/templates/:id/generate
 *
 * 并发安全流程：
 *   1. 验证登录
 *   2. 验证 slots
 *   3. 原子扣减次数（UPDATE WHERE remainingCount >= 1，行锁防并发双扣）
 *      - 余额不足且无订阅 → 402
 *   4. 入队，将 _deductedFeatureKey 存入 payload
 *   5. Worker 执行失败（重试耗尽）时调用 /api/usage/refund 退款
 */
router.post('/:id/generate', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = await getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { slots } = req.body as {
            slots: Array<{ refId: string; slotType?: string; imageSource: string }>;
        };

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ error: 'slots is required and must be a non-empty array' });
        }

        const template = await prisma.template.findUnique({
            where: { id },
            include: { slots: { orderBy: { sortOrder: 'asc' } } }
        });
        if (!template || template.status === 'ARCHIVED') {
            return res.status(404).json({ error: 'Template not found' });
        }

        // 校验必填 slot（PERSON 槽位必填）
        const requiredSlotIds = template.slots
            .filter((s: any) => s.slotType === 'PERSON')
            .map((s: any) => s.refId);
        const providedIds = slots.map((s) => s.refId);
        const missing = requiredSlotIds.filter((rid: string) => !providedIds.includes(rid));
        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required slots: ${missing.join(', ')}` });
        }

        // ── 入队前原子扣减（核心并发防线）─────────────────────────────────────
        const FEATURE_KEY = 'bacc_generation';
        const feature = await prisma.feature.findUnique({
            where: { featureKey: FEATURE_KEY }
        });

        let deductedFeatureKey: string | null = null;

        if (!feature || !feature.isActive) {
            return res.status(500).json({
                error: 'Generation feature (bacc_generation) not configured.',
                code: 'FEATURE_NOT_FOUND'
            });
        }

        const affected = await prisma.$executeRaw`
            UPDATE "user_feature_balances"
            SET
                remaining_count = remaining_count - 1,
                total_used      = total_used + 1,
                last_used_at    = NOW(),
                updated_at      = NOW()
            WHERE
                user_id         = ${userId}
                AND feature_id  = ${feature.id}
                AND remaining_count >= 1
        `;

        if (affected === 0) {
            return res.status(402).json({
                error: 'Insufficient counts. Please purchase more.',
                code: 'INSUFFICIENT_COUNT'
            });
        } else {
            deductedFeatureKey = feature.featureKey;
            console.log(`[Templates API] Deducted 1 count for user ${userId} (${feature.featureKey})`);
            // 写入使用流水，供 Usage History 展示
            try {
                const updatedBalance = await prisma.userFeatureBalance.findUnique({
                    where: { userId_featureId: { userId, featureId: feature.id } }
                });
                const balanceAfter = Number(updatedBalance?.remainingCount ?? 0);
                await prisma.usageLog.create({
                    data: {
                        userId,
                        featureId: feature.id,
                        sourceType: 'USAGE_PACK',
                        usedCount: 1,
                        balanceBefore: balanceAfter + 1,
                        balanceAfter,
                        metadata: { templateId: id, templateName: template.name },
                    }
                });
            } catch (logErr: any) {
                console.warn('[Templates API] Failed to write usageLog (non-fatal):', logErr.message);
            }
        }

        // 构建 payload（_deductedFeatureKey 供 worker 失败退款用）
        const payload = {
            templateId: id,
            templateName: template.name,
            templateImageUrl: template.imageUrl ?? undefined,
            descriptor: template.descriptor,
            slots: slots.map((s) => ({
                refId: s.refId,
                slotType: s.slotType || 'IMAGE',
                imageSource: s.imageSource,
            })),
            _deductedFeatureKey: deductedFeatureKey,
        };

        const { taskManager } = await import('../lib/queue/task-manager.js');
        const { userTaskTracker } = await import('../lib/queue/user-task-tracker.js');

        const taskId = await taskManager.submitTask({ userId, type: 'template', payload });
        await userTaskTracker.setCurrentTask(userId, taskId, {
            type: 'template', payload,
            submittedAt: new Date().toISOString(),
        });

        console.log(`[Templates API] Task ${taskId} submitted by user ${userId}`);
        res.json({ taskId, status: 'pending', message: 'Task submitted. Poll /api/queue/status?taskId= to track progress.' });
    } catch (error: any) {
        console.error('[Templates API] Generate error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
