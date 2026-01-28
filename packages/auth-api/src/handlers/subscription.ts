import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAuthToken } from '../utils/auth';

/**
 * 从请求中提取用户 ID
 */
function extractUserId(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    try {
        const payload = verifyAuthToken(parts[1]);
        return payload.userId;
    } catch (error) {
        return null;
    }
}

/**
 * 获取订阅状态
 * GET /api/subscription/status
 */
export async function handleSubscriptionStatus(request: NextRequest) {
    try {
        const userId = extractUserId(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 获取用户所有活跃的授权
        const entitlements = await prisma.userEntitlement.findMany({
            where: {
                userId: BigInt(userId),
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

        // 判断是否有全局授权
        const hasGlobalAccess = activeEntitlements.some(e => e.scopeType === 'GLOBAL');

        // 获取可访问的应用列表
        const accessibleAppIds = new Set<string>();
        activeEntitlements.forEach(e => {
            if (e.scopeType === 'GLOBAL') {
                // 全局授权
            } else if (e.scopeType === 'SPECIFIC_APP') {
                e.apps?.forEach(a => accessibleAppIds.add(a.app.id.toString()));
            }
        });

        // 序列化授权信息
        const serializedEntitlements = JSON.parse(JSON.stringify(
            activeEntitlements,
            (key, value) => typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({
            isActive,
            hasGlobalAccess,
            accessibleAppIds: Array.from(accessibleAppIds),
            entitlements: serializedEntitlements,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Error getting subscription status:', error);
        return NextResponse.json(
            {
                error: 'Failed to get subscription status',
                message: error.message
            },
            { status: 500 }
        );
    }
}
