// Stripe客户端初始化（懒加载，避免缺少 key 时整个进程崩溃）
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
    }
    return _stripe;
}

/** @deprecated 使用 getStripe() 代替直接访问 stripe */
export const stripe = new Proxy({} as Stripe, {
    get(_, prop) {
        return (getStripe() as any)[prop];
    }
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Stripe配置常量
export const STRIPE_CONFIG = {
    currency: 'USD',
    successUrlTemplate: process.env.APP_URL + '/payment/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrlTemplate: process.env.APP_URL + '/payment/cancel',
} as const;
