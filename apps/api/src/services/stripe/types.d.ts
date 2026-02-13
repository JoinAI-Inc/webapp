// Stripe类型扩展
// 解决Stripe SDK类型定义不完整的问题

// 注意：这个文件不需要导入Stripe，直接扩展全局类型
declare module 'stripe' {
    namespace Stripe {
        // 这些属性在实际Stripe API中存在，但类型定义可能不完整
        // 使用declare来声明，而不是extend
    }
}

// 辅助类型，用于访问Stripe对象的实际属性
export type StripeSubscriptionWithPeriod = {
    current_period_end: number;
    cancel_at_period_end: boolean;
};

export { };
