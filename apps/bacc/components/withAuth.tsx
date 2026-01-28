'use client';

import { ComponentType } from 'react';
import AuthGuard from './AuthGuard';
import SubscriptionGuard from './SubscriptionGuard';

/**
 * 高阶组件:要求用户登录
 * 
 * @example
 * export default withAuth(MyProtectedPage);
 */
export function withAuth<P extends object>(
    Component: ComponentType<P>,
    fallback?: React.ReactNode
) {
    return function WithAuthComponent(props: P) {
        return (
            <AuthGuard requireAuth={true} fallback={fallback}>
                <Component {...props} />
            </AuthGuard>
        );
    };
}

/**
 * 高阶组件:要求用户登录且已订阅
 * 
 * @example
 * export default withSubscription(MyPremiumPage);
 */
export function withSubscription<P extends object>(
    Component: ComponentType<P>,
    fallback?: React.ReactNode
) {
    return function WithSubscriptionComponent(props: P) {
        return (
            <SubscriptionGuard fallback={fallback}>
                <Component {...props} />
            </SubscriptionGuard>
        );
    };
}
