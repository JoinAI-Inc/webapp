// Stripe类型辅助函数
// 解决Stripe SDK类型定义问题

import type Stripe from 'stripe';

/**
 * 安全获取订阅的current_period_end
 */
export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number {
    return (subscription as any).current_period_end || 0;
}

/**
 * 安全检查Invoice是否有subscription
 */
export function getInvoiceSubscription(invoice: Stripe.Invoice): string | null {
    return (invoice as any).subscription || null;
}

/**
 * 类型断言辅助
 */
export function asStripSubscription(sub: any): Stripe.Subscription {
    return sub as Stripe.Subscription;
}
