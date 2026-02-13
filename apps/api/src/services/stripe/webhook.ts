// Stripe Webhook事件处理器
import { prisma } from '@repo/database';
import { stripe, STRIPE_WEBHOOK_SECRET } from './client';
import type Stripe from 'stripe';
import type { Request } from 'express';

/**
 * 验证Webhook签名并解析事件
 */
export function constructWebhookEvent(req: Request): Stripe.Event {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
        throw new Error('Missing stripe-signature header');
    }

    if (!STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            STRIPE_WEBHOOK_SECRET
        );
        return event;
    } catch (err: any) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
}

/**
 * 处理Webhook事件
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`[Stripe Webhook] Received event: ${event.type}, ID: ${event.id}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
    } catch (error: any) {
        console.error(`[Stripe Webhook] Error handling event ${event.id}:`, error);
        throw error;
    }
}

/**
 * 处理：Checkout Session完成
 * 主要用于一次性购买，订阅会由invoice.payment_succeeded处理
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log(`[Webhook] Processing checkout.session.completed: ${session.id}`);

    // 查找对应的Order
    const order = await prisma.order.findFirst({
        where: { stripeSessionId: session.id },
        include: { pricingPlan: true }
    });

    if (!order) {
        console.warn(`[Webhook] Order not found for session: ${session.id}`);
        return;
    }

    // 防止重复处理
    if (order.status === 'PAID') {
        console.log(`[Webhook] Order ${order.id} already marked as PAID`);
        return;
    }

    // 对于一次性支付，立即处理
    if (session.mode === 'payment') {
        await processPaymentSuccess(order.id, session);
    }

    // 对于订阅，等待invoice.payment_succeeded事件
    // 这里只更新session信息
    if (session.mode === 'subscription') {
        await prisma.order.update({
            where: { id: order.id },
            data: {
                stripeSubscriptionId: session.subscription as string,
                stripePaymentIntentId: session.payment_intent as string || null
            }
        });
    }
}

/**
 * 处理：Invoice支付成功（订阅续费）
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`[Webhook] Processing invoice.payment_succeeded: ${invoice.id}`);

    if (!(invoice as any).subscription) {
        console.log('[Webhook] Invoice is not related to a subscription');
        return;
    }

    const subscriptionId = (invoice as any).subscription as string;

    // 查找对应的entitlement
    const entitlement = await prisma.userEntitlement.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
        include: { order: true }
    });

    if (!entitlement) {
        console.warn(`[Webhook] Entitlement not found for subscription: ${subscriptionId}`);
        return;
    }

    // 如果是首次支付，创建权益（checkout.session.completed可能已处理）
    if (entitlement.order && entitlement.order.status === 'PENDING') {
        await processPaymentSuccess(entitlement.order.id, null, invoice);
    } else {
        // 订阅续费：延长权益有效期
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await prisma.userEntitlement.update({
            where: { id: entitlement.id },
            data: {
                expireTime: new Date((subscription as any).current_period_end * 1000),
                status: 'ACTIVE'
            }
        });

        console.log(`[Webhook] Extended entitlement ${entitlement.id} to ${new Date((subscription as any).current_period_end * 1000)}`);
    }
}

/**
 * 处理：Invoice支付失败
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`[Webhook] Processing invoice.payment_failed: ${invoice.id}`);

    if (!(invoice as any).subscription) {
        return;
    }

    const subscriptionId = (invoice as any).subscription as string;

    // 查找对应的entitlement
    const entitlement = await prisma.userEntitlement.findFirst({
        where: { stripeSubscriptionId: subscriptionId }
    });

    if (entitlement) {
        // 标记为过期或等待重试
        await prisma.userEntitlement.update({
            where: { id: entitlement.id },
            data: {
                status: 'EXPIRED'
            }
        });

        console.log(`[Webhook] Marked entitlement ${entitlement.id} as EXPIRED due to payment failure`);
    }
}

/**
 * 处理：订阅更新
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log(`[Webhook] Processing customer.subscription.updated: ${subscription.id}`);

    const entitlement = await prisma.userEntitlement.findFirst({
        where: { stripeSubscriptionId: subscription.id }
    });

    if (!entitlement) {
        console.warn(`[Webhook] Entitlement not found for subscription: ${subscription.id}`);
        return;
    }

    // 更新权益状态和到期时间
    let status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' = 'ACTIVE';

    if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
        status = 'EXPIRED';
    }

    await prisma.userEntitlement.update({
        where: { id: entitlement.id },
        data: {
            status,
            expireTime: new Date((subscription as any).current_period_end * 1000)
        }
    });

    console.log(`[Webhook] Updated entitlement ${entitlement.id}, status: ${status}`);
}

/**
 * 处理：订阅删除/取消
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log(`[Webhook] Processing customer.subscription.deleted: ${subscription.id}`);

    const entitlement = await prisma.userEntitlement.findFirst({
        where: { stripeSubscriptionId: subscription.id }
    });

    if (!entitlement) {
        console.warn(`[Webhook] Entitlement not found for subscription: ${subscription.id}`);
        return;
    }

    // 标记权益为已撤销
    await prisma.userEntitlement.update({
        where: { id: entitlement.id },
        data: {
            status: 'REVOKED',
            expireTime: new Date() // 立即过期
        }
    });

    console.log(`[Webhook] Revoked entitlement ${entitlement.id}`);
}

/**
 * 处理支付成功的通用逻辑
 */
async function processPaymentSuccess(
    orderId: bigint,
    session?: Stripe.Checkout.Session | null,
    invoice?: Stripe.Invoice | null
): Promise<void> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            pricingPlan: {
                include: { apps: true }
            }
        }
    });

    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }

    // 防止重复处理
    if (order.status === 'PAID') {
        console.log(`[Webhook] Order ${orderId} already processed`);
        return;
    }

    await prisma.$transaction(async (tx) => {
        // 1. 更新Order状态
        await tx.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                stripeInvoiceId: invoice?.id || null
            }
        });

        // 2. 计算权益到期时间
        let expireTime: Date | null = null;
        const plan = order.pricingPlan;

        if (plan.planType === 'SUBSCRIPTION' && order.stripeSubscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(order.stripeSubscriptionId);
            expireTime = new Date((subscription as any).current_period_end * 1000);
        }

        // 3. 创建UserEntitlement
        const entitlement = await tx.userEntitlement.create({
            data: {
                userId: order.userId,
                sourceOrderId: order.id,
                entitlementType: plan.planType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'PERMANENT',
                startTime: new Date(),
                expireTime,
                status: 'ACTIVE',
                stripeSubscriptionId: order.stripeSubscriptionId
            }
        });

        // 4. 关联应用 - 从pricingPlan复制apps关联
        if (plan.apps && plan.apps.length > 0) {
            await tx.userEntitlementApp.createMany({
                data: plan.apps.map(app => ({
                    entitlementId: entitlement.id,
                    appId: app.appId
                }))
            });
        }

        // 5. 更新用户统计
        await tx.user.update({
            where: { id: order.userId },
            data: {
                totalSpendAmount: { increment: order.amount },
                totalOrderCount: { increment: 1 }
            }
        });

        console.log(`[Webhook] Created entitlement ${entitlement.id} for order ${orderId}`);
    });
}
