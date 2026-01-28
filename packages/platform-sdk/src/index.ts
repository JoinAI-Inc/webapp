// 主SDK入口
export { AppSDK as default } from './core/AppSDK.js';
export { AppSDK } from './core/AppSDK.js';

//导出管理器
export { AuthManager } from './auth/AuthManager.js';
export { SubscriptionManager } from './subscription/SubscriptionManager.js';

// 导出类型
export type {
    SDKConfig,
    User,
    OAuthProvider,
    AuthResult,
    Plan,
    App,
    Entitlement,
    CreateCheckoutParams,
    CheckoutSessionResult,
    AuthValidationResult,
    SubscriptionStatus,
    AuthStateChangeCallback,
    SubscriptionChangeCallback,
} from './types/index.js';

