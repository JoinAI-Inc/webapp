// Stripe客户端初始化
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Stripe配置常量
export const STRIPE_CONFIG = {
    currency: 'USD',
    successUrlTemplate: process.env.APP_URL + '/payment/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrlTemplate: process.env.APP_URL + '/payment/cancel',
} as const;
