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
 * 获取所有应用列表
 * GET /api/store/apps
 */
export async function handleGetApps(request: NextRequest) {
    try {
        const apps = await prisma.app.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                id: true,
                name: true,
                description: true,
                appKey: true,
            }
        });

        const serializedApps = JSON.parse(JSON.stringify(apps, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedApps);
    } catch (error: any) {
        console.error('Error getting apps:', error);
        return NextResponse.json(
            { error: 'Failed to get apps', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * 获取应用详情
 * GET /api/store/apps/:id
 */
export async function handleGetAppById(id: string) {
    try {
        // 判断 id 是数字还是字符串（appKey）
        const isNumericId = /^\d+$/.test(id);

        const app = await prisma.app.findUnique({
            where: isNumericId ? { id: BigInt(id) } : { appKey: id },
        });

        if (!app) {
            return NextResponse.json(
                { error: 'App not found' },
                { status: 404 }
            );
        }

        // 只返回针对此应用的一次性购买计划
        const plans = await prisma.pricingPlan.findMany({
            where: {
                isActive: true,
                status: 'ACTIVE',
                scopeType: 'SPECIFIC_APP',
                planType: 'ONE_TIME',
                apps: {
                    some: { appId: app.id }
                }
            }
        });

        const serializedData = JSON.parse(JSON.stringify({ app, plans }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedData);
    } catch (error: any) {
        console.error('Error getting app:', error);
        return NextResponse.json(
            { error: 'Failed to get app', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * 获取用户的权益
 * GET /api/store/entitlements
 */
export async function handleGetEntitlements(request: NextRequest) {
    try {
        const userId = extractUserId(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const entitlements = await prisma.userEntitlement.findMany({
            where: {
                userId: BigInt(userId),
                status: 'ACTIVE'
            },
            include: {
                apps: { include: { app: true } },
                order: {
                    include: {
                        pricingPlan: {
                            include: {
                                apps: { include: { app: true } }
                            }
                        }
                    }
                }
            }
        });

        const serializedEntitlements = JSON.parse(JSON.stringify(entitlements, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedEntitlements);
    } catch (error: any) {
        console.error('Error getting entitlements:', error);
        return NextResponse.json(
            { error: 'Failed to get entitlements', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * 获取订阅计划列表
 * GET /api/store/plans
 */
export async function handleGetPlans(request: NextRequest) {
    try {
        const plans = await prisma.pricingPlan.findMany({
            where: {
                isActive: true,
                status: 'ACTIVE',
                planType: 'SUBSCRIPTION'
            },
            include: {
                apps: { include: { app: true } }
            },
            orderBy: { price: 'asc' }
        });

        const serializedPlans = JSON.parse(JSON.stringify(plans, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedPlans);
    } catch (error: any) {
        console.error('Error getting plans:', error);
        return NextResponse.json(
            { error: 'Failed to get plans', message: error.message },
            { status: 500 }
        );
    }
}
