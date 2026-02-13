// Feature 管理路由
import { Router } from 'express';
import { prisma } from '@repo/database';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * GET /api/features
 * 获取所有功能点列表
 */
router.get('/', async (req, res) => {
    try {
        const { appId, isActive } = req.query;

        const where: any = {};

        if (appId) {
            where.appId = BigInt(appId as string);
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const features = await prisma.feature.findMany({
            where,
            include: {
                app: {
                    select: {
                        id: true,
                        name: true,
                        appKey: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Convert BigInt to string for JSON serialization
        const serializedFeatures = features.map(f => ({
            ...f,
            id: f.id.toString(),
            appId: f.appId.toString(),
            app: f.app ? {
                ...f.app,
                id: f.app.id.toString()
            } : null
        }));

        res.json(serializedFeatures);
    } catch (error: any) {
        console.error('[Features API] Error fetching features:', error);
        res.status(500).json({ error: 'Failed to fetch features' });
    }
});

/**
 * POST /api/features
 * 创建新功能点（需要认证）
 */
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const { featureKey, appId, name, description, isActive } = req.body;

        // 验证必填字段
        if (!featureKey || !appId || !name) {
            return res.status(400).json({
                error: 'Missing required fields: featureKey, appId, name'
            });
        }

        // 检查featureKey是否已存在
        const existing = await prisma.feature.findUnique({
            where: { featureKey }
        });

        if (existing) {
            return res.status(409).json({
                error: 'Feature key already exists'
            });
        }

        // 创建功能点
        const feature = await prisma.feature.create({
            data: {
                featureKey,
                appId: BigInt(appId),
                name,
                description,
                isActive: isActive ?? true
            },
            include: {
                app: {
                    select: {
                        id: true,
                        name: true,
                        appKey: true
                    }
                }
            }
        });

        res.status(201).json({
            ...feature,
            id: feature.id.toString(),
            appId: feature.appId.toString(),
            app: feature.app ? {
                ...feature.app,
                id: feature.app.id.toString()
            } : null
        });
    } catch (error: any) {
        console.error('[Features API] Error creating feature:', error);
        res.status(500).json({ error: 'Failed to create feature' });
    }
});

/**
 * PUT /api/features/:id
 * 更新功能点（需要认证）
 */
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const feature = await prisma.feature.update({
            where: { id: BigInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive })
            },
            include: {
                app: {
                    select: {
                        id: true,
                        name: true,
                        appKey: true
                    }
                }
            }
        });

        res.json({
            ...feature,
            id: feature.id.toString(),
            appId: feature.appId.toString(),
            app: feature.app ? {
                ...feature.app,
                id: feature.app.id.toString()
            } : null
        });
    } catch (error: any) {
        console.error('[Features API] Error updating feature:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Feature not found' });
        }

        res.status(500).json({ error: 'Failed to update feature' });
    }
});

export default router;
