'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useEffect, Suspense } from 'react';

function LoginContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo');

    // 如果用户已登录,根据 redirectTo 参数跳转
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // 添加短暂延迟确保状态稳定
            const timer = setTimeout(() => {
                if (redirectTo) {
                    console.log('[LoginPage] 登录成功,重定向到:', redirectTo);
                    router.push(redirectTo);
                } else {
                    console.log('[LoginPage] 登录成功,跳转到首页');
                    router.push('/');
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [status, session, redirectTo, router]);

    const handleLogin = () => {
        signIn('google', { callbackUrl: redirectTo || '/' });
    };

    // 如果已登录,显示加载状态
    if (status === 'loading' || status === 'authenticated') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-cny-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xl text-cny-ivory/60">
                        {status === 'loading' ? '加载中...' : '跳转中...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-8 text-center"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-shimmer">
                        欢迎来到 BACC
                    </h1>
                    <p className="text-cny-ivory/60">
                        登录以开始创建您的农历新年祝福
                    </p>
                </div>

                <div className="glass-card p-8 space-y-4">
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transition-all group"
                    >
                        <LogIn className="w-5 h-5" />
                        使用 Google 登录
                    </button>
                </div>

                <button
                    onClick={() => router.push('/')}
                    className="text-cny-ivory/40 hover:text-cny-ivory/60 transition-colors text-sm"
                >
                    返回首页
                </button>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-cny-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xl text-cny-ivory/60">加载中...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
