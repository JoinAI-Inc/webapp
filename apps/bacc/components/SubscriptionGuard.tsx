'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SubscriptionGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * 订阅守卫组件
 * 保护需要订阅的路由,未登录时重定向到登录页,未订阅时重定向到订阅页
 */
export default function SubscriptionGuard({
    children,
    fallback
}: SubscriptionGuardProps) {
    const { user, loading: authLoading } = useAuth();
    const { hasAccess, loading: subscriptionLoading } = useSubscription();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // 等待认证和订阅状态都加载完成
        if (!authLoading && !subscriptionLoading) {
            if (!user) {
                // 未登录,重定向到登录页
                const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`;
                router.push(redirectUrl);
            } else if (!hasAccess) {
                // 已登录但未订阅,重定向到订阅页
                const redirectUrl = `/subscribe?redirectTo=${encodeURIComponent(pathname)}`;
                router.push(redirectUrl);
            } else {
                // 已登录且已订阅,允许访问
                setIsChecking(false);
            }
        }
    }, [user, hasAccess, authLoading, subscriptionLoading, router, pathname]);

    // 加载中或检查中
    if (authLoading || subscriptionLoading || isChecking) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-cny-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xl text-cny-ivory/60">验证订阅状态...</p>
                </div>
            </div>
        );
    }

    // 如果用户未登录或未订阅,不渲染内容(正在重定向)
    if (!user || !hasAccess) {
        return null;
    }

    // 渲染受保护的内容
    return <>{children}</>;
}
