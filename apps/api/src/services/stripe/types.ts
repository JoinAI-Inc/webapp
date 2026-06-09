// Stripe服务类型定义
import Stripe from 'stripe';

export interface CreateCheckoutSessionParams {
    userId: string;
    pricingPlanId: bigint;
    successUrl: string;
    cancelUrl: string;
    billingInterval?: 'MONTH' | 'QUARTER' | 'YEAR'; // 用于订阅计划
}

export interface CheckoutSessionResult {
    sessionId: string;
    url: string;
    orderId: bigint;
}

export interface SubscriptionInfo {
    id: string;
    status: string;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    planName: string;
    amount: number;
}

export interface SyncSessionParams {
    sessionId: string;
    userId?: string;
}

export interface SyncSessionResult {
    success: boolean;
    orderId: bigint;
    entitlementId?: bigint;
    type: 'payment' | 'subscription';
}

// Webhook事件直接使用 Stripe.Event 类型
export type WebhookEvent = Stripe.Event;

export interface StripeCustomerData {
    customerId: string;
    email: string;
    name?: string;
}

export interface ProductSyncResult {
    synced: number;
    created: number;
    updated: number;
    errors: string[];
}

export interface ReconciliationResult {
    totalChecked: number;
    mismatches: Array<{
        type: 'missing_order' | 'status_mismatch' | 'amount_mismatch';
        sessionId?: string;
        orderId?: string;
        details: any;
    }>;
}
