import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import type { Prisma } from '@prisma/client';
import { verifyInternalRequest } from '../lib/internal-auth.js';
import { normalizeTemplateSlots } from './template-slot-normalization.js';

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

function isSupportedImageSource(value: unknown): value is string {
    return typeof value === 'string'
        && value.trim().length > 0
        && (
            value.startsWith('data:image/')
            || value.startsWith('http://')
            || value.startsWith('https://')
        );
}

async function resolveTemplateGenerationConfig(template: any): Promise<Record<string, any>> {
    const promptPolicy = template.promptPolicyKey
        ? (
            template.promptPolicyVersion
                ? await (prisma as any).promptPolicy.findUnique({
                    where: {
                        key_version: {
                            key: template.promptPolicyKey,
                            version: template.promptPolicyVersion,
                        },
                    },
                })
                : await (prisma as any).promptPolicy.findFirst({
                    where: { key: template.promptPolicyKey, status: 'active' },
                    orderBy: { version: 'desc' },
                })
        )
        : null;

    return {
        ...(promptPolicy?.config ? { promptPolicy: promptPolicy.config } : {}),
        presetKeys: {
            promptPolicyKey: template.promptPolicyKey ?? null,
            promptPolicyVersion: promptPolicy?.version ?? template.promptPolicyVersion ?? null,
        },
    };
}

async function refundDeductedCount(userId: string, featureId: bigint): Promise<void> {
    await prisma.$executeRaw`
        UPDATE "user_feature_balances"
        SET
            remaining_count = remaining_count + 1,
            total_used      = GREATEST(total_used - 1, 0),
            updated_at      = NOW()
        WHERE
            user_id         = ${userId}
            AND feature_id  = ${featureId}
    `;
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
            slots: { 
                orderBy: { sortOrder: 'asc' },
                include: {
                    assets: {
                        include: { asset: true },
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            },
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
            generationFeatureKey: (template as any).generationFeatureKey ?? null,
            descriptor: template.descriptor, favoriteCount: template.favoriteCount,
            isFavorited: userId ? (template.favorites?.length ?? 0) > 0 : false,
            tags: template.tags.map((tt: any) => ({ id: tt.tag.id, name: tt.tag.name })),
            slots: template.slots.map((s: any) => ({
                id: s.id,
                slotType: s.slotType,
                refId: s.refId,
                label: s.label,
                description: s.description,
                sortOrder: s.sortOrder,
                assets: s.assets?.map((a: any) => ({
                    id: a.asset.id,
                    assetType: a.asset.assetType,
                    name: a.asset.name,
                    thumbnailUrl: a.asset.thumbnailUrl,
                    requiredFeatureKey: a.asset.requiredFeatureKey,
                    sortOrder: a.sortOrder
                })) || []
            }))
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
            slots: Array<{
                refId: string;
                slotType?: string;
                imageSource?: string;
                assetId?: string;
                gender?: unknown;
                makeup?: unknown;
            }>;
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

        const templateConfig = template as any;
        const generationFeatureKey = templateConfig.generationFeatureKey;
        if (!generationFeatureKey || typeof generationFeatureKey !== 'string') {
            return res.status(400).json({
                error: 'Template generation featureKey is not configured',
                code: 'FEATURE_KEY_REQUIRED'
            });
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

        // ── 获取并验证 Assets：必须在扣生成次数前完成，避免鉴权失败仍扣费 ─────────
        const selectedAssetIds = slots.filter((s: any) => s.assetId).map((s: any) => s.assetId as string);
        let assetsMap: Record<string, any> = {};

        if (selectedAssetIds.length > 0) {
            const assets = await prisma.asset.findMany({
                where: { id: { in: selectedAssetIds } },
            });
            for (const asset of assets) {
                assetsMap[asset.id] = asset;
            }

            const missingAssetIds = selectedAssetIds.filter((assetId: string) => !assetsMap[assetId]);
            if (missingAssetIds.length > 0) {
                return res.status(400).json({
                    error: `Selected assets not found: ${missingAssetIds.join(', ')}`,
                    code: 'ASSET_NOT_FOUND'
                });
            }

            const requiredFeatures = Array.from(new Set(assets.map(a => a.requiredFeatureKey).filter(Boolean))) as string[];
            if (requiredFeatures.length > 0) {
                const featuresInfo = await prisma.feature.findMany({
                    where: { featureKey: { in: requiredFeatures }, isActive: true },
                    select: { id: true, featureKey: true, appId: true, chargingType: true }
                });

                const featureByKey = new Map<string, typeof featuresInfo[number]>(
                    featuresInfo.map(feature => [feature.featureKey, feature])
                );
                const featureIds = featuresInfo.map(f => f.id);
                const appIds = Array.from(new Set<bigint>(featuresInfo.map(f => f.appId)));

                const [subscriptions, unlocks, balances] = await Promise.all([
                    prisma.userEntitlement.findMany({
                        where: {
                            userId,
                            status: 'ACTIVE',
                            OR: [{ expireTime: null }, { expireTime: { gt: new Date() } }],
                            apps: { some: { appId: { in: appIds } } }
                        },
                        include: { apps: { select: { appId: true } } }
                    }),
                    prisma.userFeatureUnlock.findMany({
                        where: {
                            userId,
                            featureId: { in: featureIds },
                            OR: [{ expireAt: null }, { expireAt: { gt: new Date() } }]
                        }
                    }),
                    prisma.userFeatureBalance.findMany({
                        where: {
                            userId,
                            featureId: { in: featureIds },
                            remainingCount: { gt: 0 }
                        }
                    })
                ]);

                const entitledAppIds = new Set(subscriptions.flatMap(entitlement => entitlement.apps.map(app => app.appId.toString())));
                const unlockedFeatureIds = new Set(unlocks.map(unlock => unlock.featureId.toString()));
                const positiveBalanceFeatureIds = new Set(balances.map(balance => balance.featureId.toString()));

                const hasFeatureAccess = (requiredFeatureKey: string) => {
                    const requiredFeature = featureByKey.get(requiredFeatureKey);
                    if (!requiredFeature) return false;
                    if (entitledAppIds.has(requiredFeature.appId.toString())) return true;
                    if (requiredFeature.chargingType === 'TOGGLE') {
                        return unlockedFeatureIds.has(requiredFeature.id.toString());
                    }
                    return positiveBalanceFeatureIds.has(requiredFeature.id.toString());
                };

                for (const asset of assets) {
                    if (asset.requiredFeatureKey && !hasFeatureAccess(asset.requiredFeatureKey)) {
                        return res.status(403).json({
                            error: `Premium asset "${asset.name}" requires subscription upgrade.`,
                            code: 'PREMIUM_ASSET_LOCKED',
                            requiredFeatureKey: asset.requiredFeatureKey
                        });
                    }
                }
            }
        }

        const normalizedSlots = normalizeTemplateSlots(slots, assetsMap);

        const invalidSlots = normalizedSlots.filter((s) => !isSupportedImageSource(s.imageSource));
        if (invalidSlots.length > 0) {
            return res.status(400).json({
                error: `Invalid or missing image source for slots: ${invalidSlots.map((s) => s.refId || '(unknown)').join(', ')}`,
                code: 'INVALID_SLOT_IMAGE_SOURCE'
            });
        }

        // ── 入队前原子扣减（核心并发防线）─────────────────────────────────────
        const feature = await prisma.feature.findUnique({
            where: { featureKey: generationFeatureKey }
        });

        let deductedFeatureKey: string | null = null;

        if (!feature || !feature.isActive || feature.chargingType !== 'COUNT') {
            return res.status(400).json({
                error: `Generation feature (${generationFeatureKey}) is not configured for count usage.`,
                code: 'FEATURE_NOT_FOUND'
            });
        }

        const updatedBalances = await prisma.$queryRaw<Array<{ remaining_count: number }>>`
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
            RETURNING remaining_count
        `;

        if (updatedBalances.length === 0) {
            return res.status(402).json({
                error: 'Insufficient counts. Please purchase more.',
                code: 'INSUFFICIENT_COUNT'
            });
        } else {
            deductedFeatureKey = feature.featureKey;
            console.log(`[Templates API] Deducted 1 count for user ${userId} (${feature.featureKey})`);
        }
        const balanceAfter = Number(updatedBalances[0].remaining_count);

        // 构建 payload（_deductedFeatureKey 供 worker 失败退款用）
        const payload = {
            templateId: id,
            templateName: template.name,
            templateImageUrl: template.imageUrl ?? undefined,
            descriptor: template.descriptor,
            slots: normalizedSlots.map(({ assetId, ...slot }) => slot),
            generationConfig: await resolveTemplateGenerationConfig(template),
            _deductedFeatureKey: deductedFeatureKey,
        };

        let taskId: string;
        try {
            const { taskManager } = await import('@repo/queue');
            taskId = await taskManager.submitTask({ userId, type: 'template', payload });
        } catch (queueErr: any) {
            await refundDeductedCount(userId, feature.id);
            console.error('[Templates API] Queue submit failed after deduction, refunded count:', queueErr);
            return res.status(500).json({
                error: 'Failed to submit generation task. Count has been refunded.',
                code: 'QUEUE_SUBMIT_FAILED'
            });
        }

        try {
            const { userTaskTracker } = await import('@repo/queue');
            await userTaskTracker.setCurrentTask(userId, taskId, {
                type: 'template', payload,
                submittedAt: new Date().toISOString(),
            });
        } catch (trackErr: any) {
            console.warn('[Templates API] Failed to track current task (non-fatal):', trackErr.message);
        }

        // 写入使用流水，供 Usage History 展示。任务已经入队后再写，避免“扣费流水有了但任务不存在”。
        try {
            await prisma.usageLog.create({
                data: {
                    userId,
                    featureId: feature.id,
                    sourceType: 'USAGE_PACK',
                    usedCount: 1,
                    balanceBefore: balanceAfter + 1,
                    balanceAfter,
                    metadata: { templateId: id, templateName: template.name, taskId },
                }
            });
        } catch (logErr: any) {
            console.warn('[Templates API] Failed to write usageLog (non-fatal):', logErr.message);
        }

        console.log(`[Templates API] Task ${taskId} submitted by user ${userId}`);
        res.json({ taskId, status: 'pending', message: 'Task submitted. Poll /api/queue/status?taskId= to track progress.' });
    } catch (error: any) {
        console.error('[Templates API] Generate error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
