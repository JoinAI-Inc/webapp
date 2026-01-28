// 用户信息
export interface User {
    id: string;
    email: string;
    name: string;
}

// OAuth提供商类型
export type OAuthProvider = 'google' | 'apple' | 'discord' | 'twitter';

// 认证结果
export interface AuthResult {
    success: boolean;
    token: string;
    user: User;
}

// 计费方案
export interface Plan {
    id: number;
    name: string;
    type: 'SUBSCRIPTION' | 'ONE_TIME';
    price: string;
    currency: string;
    interval?: 'MONTH' | 'QUARTER' | 'YEAR';
    scope: string;
}

// 应用信息
export interface App {
    id: string;
    name: string;
    appKey: string;
    description: string;
    url: string;
}

// 授权信息
export interface Entitlement {
    id: number;
    entitlementType: 'SUBSCRIPTION' | 'PERMANENT';
    scopeType: 'GLOBAL' | 'SPECIFIC_APP';
    appId?: string;
    application?: App;
    apps?: Array<{ app: App }>;
    expireTime?: string;
}

// 支付会话结果
export interface CheckoutSessionResult {
    sessionId: string;
    url: string;
    orderId: string;
}

// SDK配置
export interface SDKConfig {
    apiBaseUrl: string;
    appId?: string;
    oauth?: {
        google?: { clientId: string };
        apple?: { clientId: string };
        discord?: { clientId: string };
        twitter?: { clientId: string };
    };
    callbackUrl?: string;
    // 自动校验配置
    autoValidate?: {
        enabled: boolean;
        interval?: number; // 校验间隔(毫秒),默认5分钟
    };
}

// 创建支付参数
export interface CreateCheckoutParams {
    planId: number;
    successUrl?: string;
    cancelUrl?: string;
}

// 认证校验结果
export interface AuthValidationResult {
    isValid: boolean;
    user?: User;
    error?: string;
    message?: string;
}

// 订阅状态
export interface SubscriptionStatus {
    isActive: boolean;
    hasGlobalAccess: boolean;
    accessibleAppIds: string[];
    entitlements: Entitlement[];
    timestamp: string;
}

// 状态变更回调
export type AuthStateChangeCallback = (result: AuthValidationResult) => void;
export type SubscriptionChangeCallback = (status: SubscriptionStatus) => void;

