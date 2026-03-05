// Stripe数据同步和对账工具
import { prisma } from '@repo/database';
import { stripe } from './client.js';
import type { ProductSyncResult, ReconciliationResult } from './types.js';
import type { PlanType, BillingInterval } from '@prisma/client';

/**
 * 从Stripe同步Products和Prices到数据库
 */
export async function syncProductsFromStripe(): Promise<ProductSyncResult> {
    const result: ProductSyncResult = {
        synced: 0,
        created: 0,
        updated: 0,
        errors: []
    };

    try {
        // 获取所有活跃的Stripe Products
        const products = await stripe.products.list({
            active: true,
            limit: 100
        });

        for (const product of products.data) {
            try {
                // 获取该产品的所有价格
                const prices = await stripe.prices.list({
                    product: product.id,
                    active: true
                });

                if (prices.data.length === 0) {
                    result.errors.push(`Product ${product.id} has no active prices`);
                    continue;
                }

                // 按计费周期分组price
                const pricesByInterval: Record<string, string> = {};
                let defaultPriceId = prices.data[0].id;

                for (const price of prices.data) {
                    if (price.recurring) {
                        const interval = price.recurring.interval;
                        if (interval === 'month') {
                            pricesByInterval.monthly = price.id;
                        } else if (interval === 'year') {
                            pricesByInterval.yearly = price.id;
                        }
                        // 季度订阅：3个月间隔
                        if (interval === 'month' && price.recurring.interval_count === 3) {
                            pricesByInterval.quarterly = price.id;
                        }
                    } else {
                        // 一次性价格
                        defaultPriceId = price.id;
                    }
                }

                // 查找或创建PricingPlan
                const existingPlan = await prisma.pricingPlan.findFirst({
                    where: { stripeProductId: product.id }
                });

                const planType: PlanType = prices.data[0].recurring ? 'SUBSCRIPTION' : 'ONE_TIME';
                const billingInterval: BillingInterval | null =
                    prices.data[0].recurring?.interval === 'month' ? 'MONTH' :
                        prices.data[0].recurring?.interval === 'year' ? 'YEAR' : null;

                const planData = {
                    name: product.name,
                    planType,
                    price: prices.data[0].unit_amount ? prices.data[0].unit_amount / 100 : 0,
                    currency: prices.data[0].currency.toUpperCase(),
                    billingInterval,
                    stripeProductId: product.id,
                    stripePriceId: defaultPriceId,
                    stripePriceIdMonthly: pricesByInterval.monthly || null,
                    stripePriceIdYearly: pricesByInterval.yearly || null,
                    stripePriceIdQuarterly: pricesByInterval.quarterly || null,
                    stripeMetadata: product.metadata as any,
                    isActive: product.active
                };

                if (existingPlan) {
                    await prisma.pricingPlan.update({
                        where: { id: existingPlan.id },
                        data: planData
                    });
                    result.updated++;
                } else {
                    await prisma.pricingPlan.create({
                        data: planData
                    });
                    result.created++;
                }

                result.synced++;
            } catch (error: any) {
                result.errors.push(`Error syncing product ${product.id}: ${error.message}`);
            }
        }
    } catch (error: any) {
        result.errors.push(`Error fetching products from Stripe: ${error.message}`);
    }

    return result;
}

/**
 * 对账：检查Stripe和数据库的订单数据一致性
 */
export async function reconcileOrders(days: number = 30): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
        totalChecked: 0,
        mismatches: []
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 获取Stripe的checkout sessions
    const sessions = await stripe.checkout.sessions.list({
        created: { gte: Math.floor(cutoffDate.getTime() / 1000) },
        limit: 100
    });

    for (const session of sessions.data) {
        result.totalChecked++;

        // 查找对应的Order
        const order = await prisma.order.findFirst({
            where: { stripeSessionId: session.id }
        });

        // 检查1: 订单缺失
        if (!order) {
            if (session.payment_status === 'paid') {
                result.mismatches.push({
                    type: 'missing_order',
                    sessionId: session.id,
                    details: {
                        amount: session.amount_total,
                        email: session.customer_details?.email,
                        created: new Date(session.created * 1000)
                    }
                });
            }
            continue;
        }

        // 检查2: 状态不匹配
        if (session.payment_status === 'paid' && order.status !== 'PAID') {
            result.mismatches.push({
                type: 'status_mismatch',
                sessionId: session.id,
                orderId: order.id.toString(),
                details: {
                    stripeStatus: session.payment_status,
                    dbStatus: order.status,
                    orderId: order.id.toString()
                }
            });
        }

        // 检查3: 金额不匹配
        const stripeAmount = session.amount_total ? session.amount_total / 100 : 0;
        const dbAmount = Number(order.amount);

        if (Math.abs(stripeAmount - dbAmount) > 0.01) {
            result.mismatches.push({
                type: 'amount_mismatch',
                sessionId: session.id,
                orderId: order.id.toString(),
                details: {
                    stripeAmount,
                    dbAmount
                }
            });
        }
    }

    return result;
}

/**
 * 修复订单状态不一致
 */
export async function fixOrderMismatch(sessionId: string): Promise<void> {
    // 从Stripe获取session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
        throw new Error('Session is not paid');
    }

    // 查找订单
    const order = await prisma.order.findFirst({
        where: { stripeSessionId: sessionId },
        include: { pricingPlan: { include: { apps: true } } }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    if (order.status === 'PAID') {
        console.log('Order already marked as PAID');
        return;
    }

    // 使用事务更新
    await prisma.$transaction(async (tx) => {
        // 更新订单
        await tx.order.update({
            where: { id: order.id },
            data: {
                status: 'PAID',
                paidAt: new Date(session.created * 1000),
                stripePaymentIntentId: session.payment_intent as string
            }
        });

        // 检查是否已有entitlement
        const existingEntitlement = await tx.userEntitlement.findFirst({
            where: { sourceOrderId: order.id }
        });

        if (!existingEntitlement) {
            // 创建entitlement
            let expireTime: Date | null = null;
            const plan = order.pricingPlan;

            if (plan.planType === 'SUBSCRIPTION' && session.subscription) {
                const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                expireTime = new Date((sub as any).current_period_end * 1000);
            }

            const entitlement = await tx.userEntitlement.create({
                data: {
                    userId: order.userId,
                    sourceOrderId: order.id,
                    entitlementType: plan.planType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'PERMANENT',
                    startTime: new Date(),
                    expireTime,
                    status: 'ACTIVE',
                    stripeSubscriptionId: session.subscription as string || null
                }
            });

            // 关联应用
            if (plan.apps && plan.apps.length > 0) {
                await tx.userEntitlementApp.createMany({
                    data: plan.apps.map(app => ({
                        entitlementId: entitlement.id,
                        appId: app.appId
                    }))
                });
            }

            // 更新用户统计
            await tx.user.update({
                where: { id: order.userId },
                data: {
                    totalSpendAmount: { increment: order.amount },
                    totalOrderCount: { increment: 1 }
                }
            });
        }
    });

    console.log(`Fixed order mismatch for session ${sessionId}`);
}

/**
 * 同步所有活跃订阅的状态
 */
export async function syncAllSubscriptions(): Promise<{ synced: number; errors: string[] }> {
    const result = { synced: 0, errors: [] as string[] };

    // 获取所有活跃的订阅entitlement
    const entitlements = await prisma.userEntitlement.findMany({
        where: {
            entitlementType: 'SUBSCRIPTION',
            stripeSubscriptionId: { not: null }
        },
        include: { user: true }
    });

    for (const ent of entitlements) {
        try {
            if (!ent.stripeSubscriptionId) continue;

            const subscription = await stripe.subscriptions.retrieve(ent.stripeSubscriptionId);

            let status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' = 'ACTIVE';

            if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
                status = 'EXPIRED';
            } else if (['active', 'trialing'].includes(subscription.status)) {
                status = 'ACTIVE';
            }

            await prisma.userEntitlement.update({
                where: { id: ent.id },
                data: {
                    status,
                    expireTime: new Date((subscription as any).current_period_end * 1000)
                }
            });

            result.synced++;
        } catch (error: any) {
            result.errors.push(`Error syncing subscription ${ent.stripeSubscriptionId}: ${error.message}`);
        }
    }

    return result;
}
