// Usage 相关路由 - 次数消费和余额管理
import { Router } from 'express';
import { prisma } from '@repo/database';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * GET /api/usage/balance/:userId
 * 获取用户所有功能点余额
 */
router.get('/balance/:userId', authenticateJWT, async (req, res) => {
    try {
        const { userId } = req.params;

        const balances = await prisma.userFeatureBalance.findMany({
            where: { userId },
            include: {
                feature: {
                    include: {
                        app: {
                            select: {
                                id: true,
                                name: true,
                                appKey: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Serialize BigInt fields
        const serializedBalances = balances.map((b: any) => ({
            ...b,
            id: b.id.toString(),
            featureId: b.featureId.toString(),
            feature: {
                ...b.feature,
                id: b.feature.id.toString(),
                appId: b.feature.appId.toString(),
                app: b.feature.app ? {
                    ...b.feature.app,
                    id: b.feature.app.id.toString()
                } : null
            }
        }));

        res.json(serializedBalances);
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

        // 先查找feature
        const feature = await prisma.feature.findUnique({
            where: { featureKey }
        });

        if (!feature) {
            return res.status(404).json({ error: 'Feature not found' });
        }

        // 查找用户余额
        const balance = await prisma.userFeatureBalance.findUnique({
            where: {
                userId_featureId: {
                    userId,
                    featureId: feature.id
                }
            },
            include: {
                feature: {
                    include: {
                        app: {
                            select: {
                                id: true,
                                name: true,
                                appKey: true
                            }
                        }
                    }
                }
            }
        });

        if (!balance) {
            return res.json({
                userId,
                featureKey,
                remainingCount: 0,
                totalPurchased: 0,
                totalUsed: 0
            });
        }

        res.json({
            ...balance,
            id: balance.id.toString(),
            featureId: balance.featureId.toString(),
            feature: {
                ...balance.feature,
                id: balance.feature.id.toString(),
                appId: balance.feature.appId.toString(),
                app: balance.feature.app ? {
                    ...balance.feature.app,
                    id: balance.feature.app.id.toString()
                } : null
            }
        });
    } catch (error: any) {
        console.error('[Usage API] Error fetching feature balance:', error);
        res.status(500).json({ error: 'Failed to fetch feature balance' });
    }
});

/**
 * POST /api/usage/consume
 * 消耗使用次数
 */
router.post('/consume', authenticateJWT, async (req, res) => {
    try {
        const { userId, featureKey, usedCount = 1, metadata } = req.body;

        if (!userId || !featureKey) {
            return res.status(400).json({
                error: 'Missing required fields: userId, featureKey'
            });
        }

        // 查找feature
        const feature = await prisma.feature.findUnique({
            where: { featureKey }
        });

        if (!feature || !feature.isActive) {
            return res.status(404).json({ error: 'Feature not found or inactive' });
        }

        // 使用事务处理消费逻辑
        const result = await prisma.$transaction(async (tx) => {
            // 查找用户余额
            const balance = await tx.userFeatureBalance.findUnique({
                where: {
                    userId_featureId: {
                        userId,
                        featureId: feature.id
                    }
                }
            });

            if (!balance || balance.remainingCount < usedCount) {
                throw new Error('Insufficient balance');
            }

            // 扣减余额
            const updatedBalance = await tx.userFeatureBalance.update({
                where: {
                    userId_featureId: {
                        userId,
                        featureId: feature.id
                    }
                },
                data: {
                    remainingCount: { decrement: usedCount },
                    totalUsed: { increment: usedCount },
                    lastUsedAt: new Date()
                }
            });

            // 创建使用日志
            const log = await tx.usageLog.create({
                data: {
                    userId,
                    featureId: feature.id,
                    sourceType: 'USAGE_PACK',
                    usedCount,
                    metadata
                }
            });

            return { balance: updatedBalance, log };
        });

        res.json({
            success: true,
            remainingCount: result.balance.remainingCount,
            usedCount,
            logId: result.log.id.toString()
        });
    } catch (error: any) {
        console.error('[Usage API] Error consuming usage:', error);

        if (error.message === 'Insufficient balance') {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        res.status(500).json({ error: 'Failed to consume usage' });
    }
});

/**
 * GET /api/usage/logs/:userId
 * 获取用户使用日志
 */
router.get('/logs/:userId', authenticateJWT, async (req, res) => {
    try {
        const { userId } = req.params;
        const { featureKey, limit = '20', offset = '0' } = req.query;

        const where: any = { userId };

        // 如果指定了featureKey，需要先查找feature
        if (featureKey) {
            const feature = await prisma.feature.findUnique({
                where: { featureKey: featureKey as string }
            });

            if (feature) {
                where.featureId = feature.id;
            }
        }

        const logs = await prisma.usageLog.findMany({
            where,
            include: {
                feature: {
                    include: {
                        app: {
                            select: {
                                id: true,
                                name: true,
                                appKey: true
                            }
                        }
                    }
                },
                order: {
                    select: {
                        id: true,
                        orderNo: true,
                        amount: true,
                        currency: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        // Serialize BigInt fields
        const serializedLogs = logs.map(log => ({
            ...log,
            id: log.id.toString(),
            featureId: log.featureId.toString(),
            orderId: log.orderId?.toString() || null,
            feature: {
                ...log.feature,
                id: log.feature.id.toString(),
                appId: log.feature.appId.toString(),
                app: log.feature.app ? {
                    ...log.feature.app,
                    id: log.feature.app.id.toString()
                } : null
            },
            order: log.order ? {
                ...log.order,
                id: log.order.id.toString()
            } : null
        }));

        res.json(serializedLogs);
    } catch (error: any) {
        console.error('[Usage API] Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch usage logs' });
    }
});

/**
 * POST /api/usage/check-access
 * 检查用户对功能的访问权限（仅用于前端UI判断，不执行扣减）
 */
router.post('/check-access', authenticateJWT, async (req, res) => {
    try {
        const { userId, featureKey } = req.body;

        if (!userId || !featureKey) {
            return res.status(400).json({
                error: 'Missing required fields: userId, featureKey'
            });
        }

        // 1. 查找feature
        const feature = await prisma.feature.findUnique({
            where: { featureKey }
        });

        if (!feature || !feature.isActive) {
            return res.json({ hasAccess: false, source: null });
        }

        // 2. 检查订阅权益（优先）
        const subscription = await prisma.userEntitlement.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                OR: [
                    { expireTime: null },
                    { expireTime: { gt: new Date() } }
                ],
                apps: {
                    some: {
                        app: {
                            id: feature.appId
                        }
                    }
                }
            }
        });

        if (subscription) {
            return res.json({
                hasAccess: true,
                source: 'SUBSCRIPTION',
                unlimited: true
            });
        }

        // 3. 检查次数包余额
        const balance = await prisma.userFeatureBalance.findUnique({
            where: {
                userId_featureId: {
                    userId,
                    featureId: feature.id
                }
            }
        });

        if (balance && balance.remainingCount > 0) {
            return res.json({
                hasAccess: true,
                source: 'USAGE_PACK',
                remainingCount: balance.remainingCount
            });
        }

        // 4. 无权限
        res.json({ hasAccess: false, source: null });
    } catch (error: any) {
        console.error('[Usage API] Error checking access:', error);
        res.status(500).json({ error: 'Failed to check access' });
    }
});

export default router;
