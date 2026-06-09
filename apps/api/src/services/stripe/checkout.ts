// Stripe Checkout Session 创建和管理
import { prisma } from '@repo/database';
import { stripe, STRIPE_CONFIG } from './client.js';
import type { CreateCheckoutSessionParams, CheckoutSessionResult, SyncSessionParams, SyncSessionResult } from './types.js';
import { processPaymentSuccess } from './webhook.js';

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
            apps: { include: { app: true } },
            planFeatures: { include: { feature: true } },  // 新关联
            usagePacks: { include: { feature: true } }      // 旧：兼容
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
    } else if (plan.planType === 'USAGE_PACK') {
        // 次数包：使用默认Price ID
        stripePriceId = plan.stripePriceId || '';
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
        line_items: [{ price: stripePriceId, quantity: 1 }],
        // subscription 模式不能手动指定 payment_method_types
        ...(mode === 'payment' ? { payment_method_types: ['card', 'alipay'] as any } : {}),
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        metadata: {
            userId: userId,
            orderId: order.id.toString(),
            pricingPlanId: pricingPlanId.toString(),
            planType: plan.planType,
        },
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
    const { sessionId, userId } = params;

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

    if (userId && order.userId !== userId) {
        throw new Error('Order does not belong to authenticated user');
    }

    // 防止重复处理
    if (order.status === 'PAID') {
        return {
            success: true,
            orderId: order.id,
            type: session.mode as 'payment' | 'subscription'
        };
    }

    await processPaymentSuccess(order.id, session);

    return {
        success: true,
        orderId: order.id,
        type: session.mode as 'payment' | 'subscription'
    };
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
