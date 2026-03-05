'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface SubscriptionGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * 登录守卫组件
 * 只检查登录状态，未登录时重定向到登录页
 * 权限/次数检查移至生成时按需校验
 */
export default function SubscriptionGuard({
    children,
    fallback
}: SubscriptionGuardProps) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
            } else {
                setIsChecking(false);
            }
        }
    }, [user, authLoading, router, pathname]);

    if (authLoading || isChecking) {
        return fallback ? <>{fallback}</> : <LoadingSpinner message="验证登录状态..." />;
    }

    if (!user) return null;

    return <>{children}</>;
}
