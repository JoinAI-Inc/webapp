// Stripe订阅管理服务
import { prisma } from '@repo/database';
import { stripe } from './client';
import type { SubscriptionInfo } from './types';

/**
 * 获取用户的订阅信息
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    // 查找用户的活跃订阅权益
    const entitlement = await prisma.userEntitlement.findFirst({
        where: {
            userId,
            entitlementType: 'SUBSCRIPTION',
            status: 'ACTIVE',
            stripeSubscriptionId: { not: null }
        },
        include: {
            order: {
                include: { pricingPlan: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!entitlement || !entitlement.stripeSubscriptionId) {
        return null;
    }

    // 从Stripe获取最新的订阅状态
    try {
        const subscription = await stripe.subscriptions.retrieve(entitlement.stripeSubscriptionId);

        if (!entitlement.order || !entitlement.order.pricingPlan) {
            return null;
        }

        return {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: (subscription as any).current_period_end,
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            planName: entitlement.order.pricingPlan.name,
            amount: subscription.items.data[0]?.price?.unit_amount || 0
        };
    } catch (error) {
        console.error('Failed to retrieve subscription from Stripe:', error);
        return null;
    }
}

/**
 * 取消订阅（在周期结束时生效）
 */
export async function cancelSubscription(userId: string): Promise<SubscriptionInfo> {
    // 查找用户的活跃订阅
    const entitlement = await prisma.userEntitlement.findFirst({
        where: {
            userId,
            entitlementType: 'SUBSCRIPTION',
            status: 'ACTIVE',
            stripeSubscriptionId: { not: null }
        },
        include: {
            order: {
                include: { pricingPlan: true }
            }
        }
    });

    if (!entitlement || !entitlement.stripeSubscriptionId) {
        throw new Error('No active subscription found');
    }

    // 在Stripe中取消订阅（周期结束时生效）
    const subscription = await stripe.subscriptions.update(
        entitlement.stripeSubscriptionId,
        {
            cancel_at_period_end: true,
            metadata: {
                cancelledBy: 'user',
                cancelledAt: new Date().toISOString()
            }
        }
    );

    if (!entitlement.order || !entitlement.order.pricingPlan) {
        throw new Error('Entitlement order data missing');
    }

    return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        planName: entitlement.order.pricingPlan.name,
        amount: subscription.items.data[0]?.price?.unit_amount || 0
    };
}

/**
 * 恢复已取消的订阅
 */
export async function reactivateSubscription(userId: string): Promise<SubscriptionInfo> {
    // 查找已标记取消的订阅
    const entitlement = await prisma.userEntitlement.findFirst({
        where: {
            userId,
            entitlementType: 'SUBSCRIPTION',
            status: 'ACTIVE',
            stripeSubscriptionId: { not: null }
        },
        include: {
            order: {
                include: { pricingPlan: true }
            }
        }
    });

    if (!entitlement || !entitlement.stripeSubscriptionId) {
        throw new Error('No subscription found');
    }

    // 检查订阅是否标记为取消
    const currentSub = await stripe.subscriptions.retrieve(entitlement.stripeSubscriptionId);

    if (!(currentSub as any).cancel_at_period_end) {
        throw new Error('Subscription is not marked for cancellation');
    }

    // 恢复订阅
    const subscription = await stripe.subscriptions.update(
        entitlement.stripeSubscriptionId,
        {
            cancel_at_period_end: false,
            metadata: {
                reactivatedAt: new Date().toISOString()
            }
        }
    );

    if (!entitlement.order || !entitlement.order.pricingPlan) {
        throw new Error('Entitlement order data missing');
    }

    return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        planName: entitlement.order.pricingPlan.name,
        amount: subscription.items.data[0]?.price?.unit_amount || 0
    };
}

/**
 * 立即取消订阅（不等到周期结束）
 * 仅管理员可调用
 */
export async function cancelSubscriptionImmediately(userId: string, reason?: string): Promise<void> {
    const entitlement = await prisma.userEntitlement.findFirst({
        where: {
            userId,
            entitlementType: 'SUBSCRIPTION',
            status: 'ACTIVE',
            stripeSubscriptionId: { not: null }
        }
    });

    if (!entitlement || !entitlement.stripeSubscriptionId) {
        throw new Error('No active subscription found');
    }

    // 在Stripe中立即取消
    await stripe.subscriptions.cancel(entitlement.stripeSubscriptionId, {
        prorate: false // 不按比例退款
    });

    // 更新数据库中的权益状态
    await prisma.userEntitlement.update({
        where: { id: entitlement.id },
        data: {
            status: 'REVOKED',
            expireTime: new Date() // 立即过期
        }
    });
}

/**
 * 同步用户订阅状态（从Stripe更新到数据库）
 */
export async function syncUserSubscription(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user || !user.stripeCustomerId) {
        return;
    }

    // 获取该客户的所有订阅
    const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 100
    });

    // 同步每个订阅的状态
    for (const sub of subscriptions.data) {
        const entitlement = await prisma.userEntitlement.findFirst({
            where: {
                userId,
                stripeSubscriptionId: sub.id
            }
        });

        if (entitlement) {
            // 更新entitlement状态
            let status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' = 'ACTIVE';

            if (['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)) {
                status = 'EXPIRED';
            } else if (['active', 'trialing'].includes(sub.status)) {
                status = 'ACTIVE';
            }

            await prisma.userEntitlement.update({
                where: { id: entitlement.id },
                data: {
                    status,
                    expireTime: new Date((sub as any).current_period_end * 1000)
                }
            });
        }
    }
}
