'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    fallback?: React.ReactNode;
}

/**
 * 认证守卫组件
 * 保护需要登录的路由,未登录时重定向到登录页
 */
export default function AuthGuard({
    children,
    requireAuth = true,
    fallback
}: AuthGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (requireAuth && !user) {
                // 未登录,重定向到登录页,并记录当前路径以便登录后返回
                const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`;
                router.push(redirectUrl);
            } else {
                setIsChecking(false);
            }
        }
    }, [user, loading, requireAuth, router, pathname]);

    // 加载中或检查中
    if (loading || isChecking) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-cny-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xl text-cny-ivory/60">验证中...</p>
                </div>
            </div>
        );
    }

    // 如果需要认证但用户未登录,不渲染内容(正在重定向)
    if (requireAuth && !user) {
        return null;
    }

    // 渲染受保护的内容
    return <>{children}</>;
}
