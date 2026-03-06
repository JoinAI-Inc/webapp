// 订阅管理API路由
import express, { Request, Response } from 'express';
import {
    getUserSubscription,
    cancelSubscription,
    reactivateSubscription,
    syncUserSubscription
} from '../services/stripe/index.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyInternalRequest } from '../lib/internal-auth.js';
import { prisma } from '@repo/database';

const router = express.Router();

/**
 * GET /api/subscription/status
 * 获取当前登录用户的订阅状态(需要JWT认证)
 * SDK调用此端点来校验订阅状态
 */
router.get('/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;

        // 获取用户所有活跃的授权
        const entitlements = await prisma.userEntitlement.findMany({
            where: {
                userId: userId,
                status: 'ACTIVE'
            },
            include: {
                apps: { include: { app: true } },
                order: {
                    include: {
                        pricingPlan: true
                    }
                }
            }
        });

        // 检查是否有有效授权
        const now = new Date();
        const activeEntitlements = entitlements.filter(e => {
            // 永久授权始终有效
            if (e.entitlementType === 'PERMANENT') return true;
            // 订阅授权检查过期时间
            return e.expireTime && new Date(e.expireTime) > now;
        });

        const isActive = activeEntitlements.length > 0;

        // 获取可访问的应用列表（基于apps关联）
        const accessibleAppIds = new Set<string>();
        activeEntitlements.forEach(e => {
            e.apps?.forEach(a => accessibleAppIds.add(a.app.id.toString()));
        });

        // 序列化授权信息
        const serializedEntitlements = JSON.parse(JSON.stringify(
            activeEntitlements,
            (key, value) => typeof value === 'bigint' ? value.toString() : value
        ));

        res.json({
            isActive,
            accessibleAppIds: Array.from(accessibleAppIds),
            entitlements: serializedEntitlements,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({
            error: 'Failed to get subscription status',
            message: error.message
        });
    }
});

/**
 * GET /api/subscription/status/:userId
 * 内部接口：同步用户订阅状态（仅限 bacc server-to-server 调用）
 * 外部请求请使用 GET /api/subscription/status（需 JWT）
 */
router.get('/status/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // 仅允许内部签名调用
        const authedUserId = verifyInternalRequest(
            req.headers['x-internal-user-id'] as string | undefined,
            req.headers['x-internal-timestamp'] as string | undefined,
            req.headers['x-internal-signature'] as string | undefined,
        );
        if (!authedUserId || authedUserId !== userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const subscription = await getUserSubscription(userId);
        res.json({ subscription });
    } catch (error: any) {
        console.error('Error getting subscription:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
    }
});

/**
 * POST /api/subscription/cancel
 * 取消订阅（周期结束时生效，需要 JWT 认证）
 */
router.post('/cancel', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const result = await cancelSubscription(userId);
        res.json(result);
    } catch (error: any) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

/**
 * POST /api/subscription/reactivate
 * 恢复已取消的订阅（需要 JWT 认证）
 */
router.post('/reactivate', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const result = await reactivateSubscription(userId);
        res.json(result);
    } catch (error: any) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
});

/**
 * POST /api/subscription/sync/:userId
 * 内部接口：从 Stripe 同步用户订阅状态（仅限内部或 admin 调用）
 * TODO: 生产上线前应限制为仅 admin token 可调用
 */
router.post('/sync/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // 允许内部签名调用
        const authedUserId = verifyInternalRequest(
            req.headers['x-internal-user-id'] as string | undefined,
            req.headers['x-internal-timestamp'] as string | undefined,
            req.headers['x-internal-signature'] as string | undefined,
        );
        if (!authedUserId || authedUserId !== userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await syncUserSubscription(userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error syncing subscription:', error);
        res.status(500).json({ error: 'Failed to sync subscription' });
    }
});

export default router;
