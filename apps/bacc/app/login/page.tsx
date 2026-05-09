'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useEffect, Suspense } from 'react';
import Image from 'next/image';
import { SocialLoginButton } from '@/components/login/SocialLoginButton';

const GoogleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const DiscordIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
);

// 橙色闪光图标 (来自 Figma _图层_1 #ff994c)
const SparkleOrange = () => (
    <svg width="20" height="33" viewBox="0 0 20 33" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2L12 10L18 8L13 14L18 20L11 17L10 25L9 17L2 20L7 14L2 8L8 10L10 2Z" fill="#ff994c" opacity="0.9" />
        <path d="M3 26L5 29L3 32" stroke="#ff994c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// 绿色光线图标 (来自 Figma _图层_1 #0ec423)
const SparkleGreen = () => (
    <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 7.5L8 4L9.5 1" stroke="#0ec423" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M1 7.5L8 11L9.5 14" stroke="#0ec423" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9.5 7.5L19 7.5" stroke="#0ec423" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

// 紫色卷须图标 (来自 Figma _图层_1 #7e43ff)  
const SwirlyPurple = () => (
    <svg width="25" height="32" viewBox="0 0 25 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4C20 4 24 10 20 16C16 22 8 20 6 26C4 32 10 32 12 28" stroke="#7e43ff" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="5" cy="5" r="2" fill="#7e43ff" opacity="0.6" />
    </svg>
);

// 火焰/春节元素
const FestiveFlame = () => (
    <span className="text-base">🔥</span>
);

function LoginContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo');

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const timer = setTimeout(() => {
                router.push(redirectTo || '/');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [status, session, redirectTo, router]);

    if (status === 'loading' || status === 'authenticated') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center font-['Inter',_sans-serif]">
                <div className="w-[40px] h-[40px] border-2 border-[#EC2E2E] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white font-['Inter',_sans-serif]">
            {/* 左侧 - 登录区域，宽度约50% */}
            <div className="w-1/2 flex flex-col px-[40px] py-[40px] bg-white">
                {/* Logo - 左上角 */}
                <div className="flex items-center gap-[10px]">
                    <div className="w-[32px] h-[32px] bg-[#EC2E2E] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">赛</span>
                    </div>
                    <span className="text-[#EC2E2E] font-bold text-base tracking-wide">赛博中国人</span>
                </div>

                {/* 居中表单区域 */}
                <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="w-[420px] space-y-[32px]">
                        {/* 标题区域 */}
                        <div className="text-center space-y-[12px]">
                            <h1 className="text-[40px] font-bold text-[#1a1c1c] leading-tight font-['Plus_Jakarta_Sans',_sans-serif]">
                                Hey Your First Lucky Shot Awaits
                            </h1>
                            {/* 副标题 + 装饰图标 */}
                            <div className="flex items-center justify-center gap-[8px]">
                                <SparkleOrange />
                                <SparkleGreen />
                                <span className="text-[#EC2E2E] text-[15px] font-medium">
                                    Sign up for free credits to get started
                                </span>
                                <FestiveFlame />
                                <SwirlyPurple />
                            </div>
                        </div>

                        {/* 登录按钮 - 只有 Google 和 Discord */}
                        <div className="space-y-[12px]">
                            <SocialLoginButton
                                icon={<GoogleIcon />}
                                label="Login from Google"
                                onClick={() => signIn('google', { callbackUrl: redirectTo || '/' })}
                            />
                            <SocialLoginButton
                                icon={<DiscordIcon />}
                                label="Login from Discord"
                                disabled
                            />
                        </div>

                        {/* 底部链接 */}
                        <div className="text-center">
                            <button
                                onClick={() => router.push('/')}
                                className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
                            >
                                返回首页
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 右侧 - 拼贴图，宽度约50% */}
            <div className="w-1/2 relative overflow-hidden bg-[url(`/bg-login.png`)">
                <Image
                    src="/login-collage.png"
                    alt="Chinese New Year photo collage"
                    fill
                    className="object-cover object-center"
                    priority
                />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center font-['Inter',_sans-serif]">
                <div className="w-[40px] h-[40px] border-2 border-[#EC2E2E] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
