// Usage 相关路由 - 次数消费和余额管理
import { Router } from 'express';
import { prisma } from '@repo/database';
import { authenticateJWT } from '../middleware/auth.js';
import { verifyInternalRequest } from '../lib/internal-auth.js';

const router = Router();

/**
 * GET /api/usage/balance/:userId
 * 获取用户所有功能点余额（需携带 x-internal-* 签名头）
 */
router.get('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 验证内部请求签名（bacc server-to-server 调用必须携带）
        const authedUserId = verifyInternalRequest(
            req.headers['x-internal-user-id'] as string | undefined,
            req.headers['x-internal-timestamp'] as string | undefined,
            req.headers['x-internal-signature'] as string | undefined,
        );
        if (!authedUserId || authedUserId !== userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const balances = await prisma.userFeatureBalance.findMany({
            where: { userId },
            include: { feature: { include: { app: true } } },
            orderBy: { updatedAt: 'desc' }
        });

        const serialized = JSON.parse(JSON.stringify(balances, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(serialized);
    } catch (error: any) {
        console.error('[Usage API] Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

/**
 * GET /api/usage/balance/:userId/:featureKey
 * 获取用户特定功能点的余额
 */
router.get('/balance/:userId/:featureKey', authenticateJWT, async (req, res) => {
    try {
        const { userId, featureKey } = req.params;

        const feature = await prisma.feature.findUnique({ where: { featureKey } });
        if (!feature) {
            return res.status(404).json({ error: 'Feature not found' });
        }

        const balance = await prisma.userFeatureBalance.findUnique({
            where: { userId_featureId: { userId, featureId: feature.id } },
            include: { feature: { include: { app: { select: { id: true, name: true, appKey: true } } } } }
        });

        if (!balance) {
            return res.json({ userId, featureKey, remainingCount: 0, totalPurchased: 0, totalUsed: 0 });
        }

        res.json(JSON.parse(JSON.stringify(balance, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )));
    } catch (error: any) {
        console.error('[Usage API] Error fetching feature balance:', error);
        res.status(500).json({ error: 'Failed to fetch feature balance' });
    }
});

/**
 * POST /api/usage/consume
 * 原子扣减次数（并发安全）
 *
 * 使用 UPDATE ... WHERE remainingCount >= usedCount 实现原子扣减：
 * - PostgreSQL 行级锁保证同一行只允许一次成功的并发 UPDATE
 * - 100 个并发请求只有 1 个能扣减成功，其余 99 个得到 402
 */
router.post('/consume', async (req, res) => {
    try {
        const { userId, featureKey, usedCount = 1, metadata } = req.body;

        if (!userId || !featureKey) {
            return res.status(400).json({ error: 'Missing required fields: userId, featureKey' });
        }

        const feature = await prisma.feature.findUnique({ where: { featureKey } });
        if (!feature || !feature.isActive) {
            return res.status(404).json({ error: 'Feature not found or inactive' });
        }

        // ── 原子扣减：行锁保证并发安全 ─────────────────────────────────────────
        const affected = await prisma.$executeRaw`
            UPDATE "user_feature_balances"
            SET
                remaining_count = remaining_count - ${usedCount},
                total_used      = total_used      + ${usedCount},
                last_used_at    = NOW(),
                updated_at      = NOW()
            WHERE
                user_id         = ${userId}
                AND feature_id  = ${feature.id}
                AND remaining_count >= ${usedCount}
        `;

        if (affected === 0) {
            return res.status(402).json({ error: 'Insufficient balance' });
        }

        // 读取更新后余额
        const updatedBalance = await prisma.userFeatureBalance.findUnique({
            where: { userId_featureId: { userId, featureId: feature.id } }
        });
        const balanceAfter = updatedBalance?.remainingCount ?? 0;
        const balanceBefore = balanceAfter + usedCount;

        // FIFO pack 扣减（非关键路径）
        let usagePackId = null;
        let orderId = null;
        try {
            const availablePack = await prisma.userUsagePack.findFirst({
                where: {
                    userId,
                    featureId: feature.id,
                    remainingCount: { gt: 0 },
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                },
                orderBy: { purchasedAt: 'asc' }
            });
            if (availablePack) {
                await prisma.userUsagePack.update({
                    where: { id: availablePack.id },
                    data: { remainingCount: { decrement: usedCount } }
                });
                usagePackId = availablePack.id;
                orderId = availablePack.orderId;
            }
        } catch (packErr: any) {
            console.warn('[Consume] Pack decrement failed (non-fatal):', packErr.message);
        }

        const log = await prisma.usageLog.create({
            data: { userId, featureId: feature.id, sourceType: 'USAGE_PACK', usagePackId, orderId, usedCount, balanceBefore, balanceAfter, metadata }
        });

        console.log(`[Consume] User ${userId}: ${balanceBefore} → ${balanceAfter}`);
        res.json({ success: true, remainingCount: balanceAfter, usedCount, logId: log.id.toString() });
    } catch (error: any) {
        console.error('[Usage API] Error consuming usage:', error);
        res.status(500).json({ error: 'Failed to consume usage' });
    }
});

/**
 * POST /api/usage/refund
 * 退还次数（任务失败时由 worker 调用）
 */
router.post('/refund', async (req, res) => {
    try {
        const { userId, featureKey, refundCount = 1, reason } = req.body;

        if (!userId || !featureKey) {
            return res.status(400).json({ error: 'Missing required fields: userId, featureKey' });
        }

        const feature = await prisma.feature.findUnique({ where: { featureKey } });
        if (!feature) {
            return res.status(404).json({ error: 'Feature not found' });
        }

        await prisma.$executeRaw`
            UPDATE "user_feature_balances"
            SET
                remaining_count = remaining_count + ${refundCount},
                total_used      = GREATEST(total_used - ${refundCount}, 0),
                updated_at      = NOW()
            WHERE
                user_id         = ${userId}
                AND feature_id  = ${feature.id}
        `;

        console.log(`[Refund] User ${userId} refunded ${refundCount} credits for ${featureKey}. Reason: ${reason}`);
        res.json({ success: true, refundCount });
    } catch (error: any) {
        console.error('[Usage API] Error refunding usage:', error);
        res.status(500).json({ error: 'Failed to refund usage' });
    }
});

/**
 * GET /api/usage/logs/:userId
 * 获取用户使用日志
 */
router.get('/logs/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // 支持 internal headers 认证（bacc server-to-server）
        const internalUserId = verifyInternalRequest(
            req.headers['x-internal-user-id'] as string | undefined,
            req.headers['x-internal-timestamp'] as string | undefined,
            req.headers['x-internal-signature'] as string | undefined,
        );
        // userId 必须与 internal 认证一致
        if (!internalUserId || internalUserId !== userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { featureKey, limit = '20', offset = '0' } = req.query;

        const where: any = { userId };

        if (featureKey) {
            const feature = await prisma.feature.findUnique({ where: { featureKey: featureKey as string } });
            if (feature) { where.featureId = feature.id; }
        }

        const logs = await prisma.usageLog.findMany({
            where,
            include: {
                feature: { include: { app: { select: { id: true, name: true, appKey: true } } } },
                order: { select: { id: true, orderNo: true, amount: true, currency: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        const serializedLogs = logs.map(log => ({
            ...log,
            id: log.id.toString(),
            featureId: log.featureId.toString(),
            orderId: log.orderId?.toString() || null,
            feature: {
                ...log.feature,
                id: log.feature.id.toString(),
                appId: log.feature.appId.toString(),
                app: log.feature.app ? { ...log.feature.app, id: log.feature.app.id.toString() } : null
            },
            order: log.order ? { ...log.order, id: log.order.id.toString() } : null
        }));

        res.json(serializedLogs);
    } catch (error: any) {
        console.error('[Usage API] Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch usage logs' });
    }
});

/**
 * POST /api/usage/check-access
 * 检查用户是否有访问特定功能的权限（订阅或次数包）
 */
router.post('/check-access', async (req, res) => {
    try {
        const { userId, featureKey } = req.body;

        if (!userId || !featureKey) {
            return res.status(400).json({ error: 'Missing required fields: userId, featureKey' });
        }

        const feature = await prisma.feature.findUnique({ where: { featureKey } });
        if (!feature || !feature.isActive) {
            return res.json({ hasAccess: false, source: null });
        }

        // 检查订阅权益（最高优先级）
        const subscription = await prisma.userEntitlement.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                OR: [{ expireTime: null }, { expireTime: { gt: new Date() } }],
                apps: { some: { app: { id: feature.appId } } }
            }
        });

        if (subscription) {
            return res.json({ hasAccess: true, source: 'SUBSCRIPTION', unlimited: true });
        }

        // 按 chargingType 分叉检查
        if (feature.chargingType === 'TOGGLE') {
            // TOGGLE：检查解锁记录
            const unlock = await prisma.userFeatureUnlock.findUnique({
                where: { userId_featureId: { userId, featureId: feature.id } }
            });
            const isUnlocked = !!unlock && (!unlock.expireAt || unlock.expireAt > new Date());
            if (isUnlocked) {
                return res.json({ hasAccess: true, source: 'FEATURE_UNLOCK', expireAt: unlock!.expireAt });
            }
        } else {
            // COUNT：检查次数包余额
            const balance = await prisma.userFeatureBalance.findUnique({
                where: { userId_featureId: { userId, featureId: feature.id } }
            });
            if (balance && balance.remainingCount > 0) {
                return res.json({ hasAccess: true, source: 'USAGE_PACK', remainingCount: balance.remainingCount });
            }
        }

        res.json({ hasAccess: false, source: null, remainingCount: 0 });
    } catch (error: any) {
        console.error('[Usage API] Error checking access:', error);
        res.status(500).json({ error: 'Failed to check access' });
    }
});

export default router;
