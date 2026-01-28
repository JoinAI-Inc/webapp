'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function CallbackPage() {
    const { sdk, refreshAuth } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const hasHandled = useRef(false); // 防止重复处理


    useEffect(() => {
        // 防止重复处理(严格模式下 useEffect 可能调用两次)
        if (hasHandled.current) {
            console.log('[Callback] 已处理过,跳过重复调用');
            return;
        }

        async function handleCallback() {
            hasHandled.current = true; // 标记为已处理

            try {
                console.log('开始处理 OAuth 回调...');
                const result = await sdk.auth.handleCallback();
                console.log('登录成功，用户信息:', result);

                if (!result.success) {
                    throw new Error('登录返回失败');
                }

                // 刷新认证状态，确保AuthContext中的用户信息已更新
                console.log('刷新认证状态...');
                refreshAuth();

                // 等待状态更新完成
                await new Promise(resolve => setTimeout(resolve, 200));

                // 重定向到应用主页
                console.log('准备跳转到首页...');
                router.push('/');
            } catch (error: any) {
                console.error('OAuth 回调处理出错:', error);
                console.error('错误消息:', error.message);

                // 即使有错误,也检查是否实际上已经登录成功
                // (有时后端返回错误但 token 已经保存)
                await new Promise(resolve => setTimeout(resolve, 500));

                // 刷新认证状态,检查是否实际已登录
                refreshAuth();

                // 再等待一下让状态更新
                await new Promise(resolve => setTimeout(resolve, 300));

                // 检查是否真的登录成功了
                if (sdk.auth.isAuthenticated()) {
                    console.log('虽然有错误,但实际已登录成功,跳转到首页...');
                    router.push('/');
                } else {
                    console.error('确认登录失败');
                    setError(error.message || '登录失败,请重试');

                    // 等待3秒后跳转到登录页
                    setTimeout(() => {
                        hasHandled.current = false; // 重置状态以便重试
                        router.push('/login');
                    }, 3000);
                }
            }
        }

        handleCallback();
    }, [sdk, router, refreshAuth]);

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-cny-red/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-cny-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-cny-ivory">登录失败</h2>
                    <p className="text-cny-ivory/60 text-sm">{error}</p>
                    <p className="text-cny-ivory/40 text-xs">3秒后返回登录页...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-cny-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xl text-cny-ivory/60">正在登录...</p>
            </div>
        </div>
    );
}
