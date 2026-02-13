// Stripe Checkout Session 创建和管理
import { prisma } from '@repo/database';
import { stripe, STRIPE_CONFIG } from './client';
import type { CreateCheckoutSessionParams, CheckoutSessionResult, SyncSessionParams, SyncSessionResult } from './types';

/**
 * 创建Stripe Checkout Session
 * 支持订阅和一次性购买
 */
export async function createCheckoutSession(
    params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
    const { userId, pricingPlanId, successUrl, cancelUrl, billingInterval } = params;

    // 1. 获取用户信息
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // 2. 获取pricing plan
    const plan = await prisma.pricingPlan.findUnique({
        where: { id: pricingPlanId },
        include: {
            apps: {
                include: { app: true }
            }
        }
    });

    if (!plan || !plan.sellable || plan.status !== 'ACTIVE') {
        throw new Error('Pricing plan not available for purchase');
    }

    // 3. 获取或创建Stripe Customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email || undefined,
            name: user.name || undefined,
            metadata: {
                userId: userId,
            }
        });
        customerId = customer.id;

        // 更新用户记录
        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId }
        });
    }

    // 4. 确定使用哪个Stripe Price ID
    let stripePriceId: string;

    if (plan.planType === 'SUBSCRIPTION') {
        // 订阅类型：根据billingInterval选择对应的Price ID
        const interval = billingInterval || plan.billingInterval;

        switch (interval) {
            case 'MONTH':
                stripePriceId = plan.stripePriceIdMonthly || plan.stripePriceId || '';
                break;
            case 'YEAR':
                stripePriceId = plan.stripePriceIdYearly || plan.stripePriceId || '';
                break;
            case 'QUARTER':
                stripePriceId = plan.stripePriceIdQuarterly || plan.stripePriceId || '';
                break;
            default:
                stripePriceId = plan.stripePriceId || '';
        }
    } else {
        // 一次性购买
        stripePriceId = plan.stripePriceId || '';
    }

    if (!stripePriceId) {
        throw new Error('Stripe Price ID not configured for this plan');
    }

    // 5. 生成订单号
    const orderNo = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // 6. 创建Order记录（状态为PENDING）
    const order = await prisma.order.create({
        data: {
            orderNo,
            userId: userId,
            pricingPlanId,
            amount: plan.price,
            currency: plan.currency,
            status: 'PENDING'
        }
    });

    // 7. 创建Stripe Checkout Session
    const mode = plan.planType === 'SUBSCRIPTION' ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode,
        line_items: [
            {
                price: stripePriceId,
                quantity: 1,
            }
        ],
        payment_method_types: ['card', 'alipay', 'paypal'],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            userId: userId,
            orderId: order.id.toString(),
            pricingPlanId: pricingPlanId.toString(),
            planType: plan.planType,
        },
        // 允许promotion codes
        allow_promotion_codes: true,
    });

    // 8. 更新Order记录，保存session ID
    await prisma.order.update({
        where: { id: order.id },
        data: {
            stripeSessionId: session.id,
            stripeMetadata: {
                mode,
                stripePriceId,
                billingInterval: billingInterval || plan.billingInterval
            }
        }
    });

    return {
        sessionId: session.id,
        url: session.url!,
        orderId: order.id
    };
}

/**
 * 同步Checkout Session结果
 * 在支付成功后调用，更新订单和创建权益
 */
export async function syncCheckoutSession(
    params: SyncSessionParams
): Promise<SyncSessionResult> {
    const { sessionId } = params;

    // 1. 从Stripe获取session详情
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'subscription']
    });

    if (session.payment_status !== 'paid') {
        throw new Error('Payment not completed yet');
    }

    // 2. 查找对应的Order
    const order = await prisma.order.findFirst({
        where: { stripeSessionId: sessionId },
        include: {
            pricingPlan: {
                include: { apps: true }
            }
        }
    });

    if (!order) {
        throw new Error('Order not found for this session');
    }

    // 防止重复处理
    if (order.status === 'PAID') {
        return {
            success: true,
            orderId: order.id,
            type: session.mode as 'payment' | 'subscription'
        };
    }

    // 3. 使用事务处理支付成功后的操作
    const result = await prisma.$transaction(async (tx) => {
        // 3.1 更新Order状态
        const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                stripePaymentIntentId: session.payment_intent as string,
                stripeSubscriptionId: session.subscription as string | null,
                stripeInvoiceId: (session as any).invoice || null,
            }
        });

        // 3.2 计算权益到期时间
        let expireTime: Date | null = null;
        const plan = order.pricingPlan;

        if (plan.planType === 'SUBSCRIPTION' && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            expireTime = new Date((subscription as any).current_period_end * 1000);
        }

        // 3.3 创建UserEntitlement
        const entitlement = await tx.userEntitlement.create({
            data: {
                userId: order.userId,
                sourceOrderId: order.id,
                entitlementType: plan.planType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'PERMANENT',
                startTime: new Date(),
                expireTime,
                status: 'ACTIVE',
                stripeSubscriptionId: session.subscription as string | null,
            }
        });

        // 3.4 Link apps to entitlement from plan's apps
        if (plan.apps && plan.apps.length > 0) {
            await tx.userEntitlementApp.createMany({
                data: plan.apps.map(app => ({
                    entitlementId: entitlement.id,
                    appId: app.appId
                }))
            });
        }

        // 3.5 更新用户统计
        await tx.user.update({
            where: { id: order.userId },
            data: {
                totalSpendAmount: {
                    increment: order.amount
                },
                totalOrderCount: {
                    increment: 1
                }
            }
        });

        return {
            success: true,
            orderId: updatedOrder.id,
            entitlementId: entitlement.id,
            type: session.mode as 'payment' | 'subscription'
        };
    });

    return result;
}

/**
 * 取消待支付的订单
 */
export async function cancelPendingOrder(orderId: bigint): Promise<void> {
    await prisma.order.update({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'FAILED' }
    });
}
