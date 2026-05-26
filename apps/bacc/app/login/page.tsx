'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import clsx from 'clsx';
import { LoginPageSkeleton } from '@/app/components/Skeletons';

type AuthProvider = 'google' | 'discord' | 'x' | 'apple';

interface AuthProviderConfig {
    label: string;
    icon: string;
    enabled: boolean;
    message?: string;
}

const AUTH_PROVIDERS: Record<AuthProvider, AuthProviderConfig> = {
    google: {
        label: 'Google',
        icon: '/login-design/lucky-photo-icon-google.svg',
        enabled: true,
    },
    discord: {
        label: 'Discord',
        icon: '/login-design/lucky-photo-icon-discord.svg',
        enabled: false,
        message: 'Discord login is coming soon.',
    },
    x: {
        label: 'X',
        icon: '/login-design/lucky-photo-icon-x.svg',
        enabled: false,
        message: 'X login is coming soon.',
    },
    apple: {
        label: 'Apple',
        icon: '/login-design/lucky-photo-icon-apple.svg',
        enabled: false,
        message: 'Apple login is coming soon.',
    },
};

function LoginContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/';
    const [activeProvider, setActiveProvider] = useState<AuthProvider | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const timer = setTimeout(() => {
                router.push(redirectTo);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [status, session, redirectTo, router]);

    const handleProviderClick = (provider: AuthProvider) => {
        const config = AUTH_PROVIDERS[provider];

        if (!config.enabled) {
            setFeedback(config.message || `${config.label} login is currently unavailable.`);
            return;
        }

        setFeedback(null);
        setActiveProvider(provider);
        signIn(provider, { callbackUrl: redirectTo });
    };

    if (status === 'loading' || status === 'authenticated') {
        return <LoginPageSkeleton />;
    }

    return (
        <div className="h-screen max-h-screen min-h-screen h-[100svh] max-h-[100svh] min-h-[100svh] overflow-hidden bg-white text-[#0a0708] [font-family:'PingFang_SC',Inter,'Source_Han_Sans',sans-serif]">
            <main className="relative flex h-full min-h-full flex-col overflow-hidden desktop:flex-row desktop:justify-between">
                <section className="relative z-[1] flex min-h-full min-w-[0px] flex-1 flex-col px-[20px] py-[28px] tablet:px-[36px] tablet:py-[40px] desktop:px-[48px] desktop:py-[44px]">
                    <Image
                        className="login-fade-in block h-[32px] w-[146px] shrink-0 select-none object-contain [-webkit-user-drag:none] [animation-delay:120ms]"
                        src="/login-design/lucky-photo-logo.svg"
                        alt="Lucky Photo"
                        width={146}
                        height={32}
                        priority
                        draggable={false}
                    />

                    <div className="grid w-full max-w-[368px] flex-1 translate-y-[-32px] content-center justify-items-center self-center desktop:translate-y-[0px]">
                        <div className="grid w-full max-w-[368px] justify-items-center gap-[12px]">
                            <h1 className="login-fade-in m-[0px] text-center text-[21px] font-medium leading-[1.4] tracking-[0.01em] text-[#0a0708] tablet:text-[24px] desktop:text-[28px] [animation-delay:240ms]">
                                Hey! Your First Lucky
                                <span className="block">Shot Awaits!</span>
                            </h1>
                            <div className="login-fade-in relative inline-flex w-full justify-center [animation-delay:380ms]">
                                <div
                                    className="pointer-events-none absolute bottom-[8px] left-1/2 z-[2] h-[62px] w-[274px] -translate-x-1/2 bg-[url('/login-design/lucky-photo-title-accent.svg')] bg-center bg-no-repeat [background-size:274px_auto] desktop:bottom-[16px] desktop:w-[min(100%,330px)] desktop:[background-size:330px_auto]"
                                    aria-hidden="true"
                                />
                                <div
                                    className="relative z-[1] mx-auto inline-flex min-h-[30px] w-fit items-center justify-center rounded-full bg-[#ec2e2e] px-[10px] text-white desktop:min-h-[36px] desktop:px-[12px]"
                                    aria-label="Sign up for free credits to get started"
                                >
                                    <span className="size-[4px] shrink-0 rounded-full bg-current desktop:size-[6px]" aria-hidden="true" />
                                    <p className="mx-[4px] translate-y-px text-center text-[12px] font-normal leading-[1.4] tracking-[0.01em] text-inherit desktop:mx-[8px] desktop:translate-y-[0px] desktop:text-[14px]">
                                        Sign up for free credits to get started
                                    </p>
                                    <span className="size-[4px] shrink-0 rounded-full bg-current desktop:size-[6px]" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-[28px] grid w-[87.5vw] max-w-[320px] gap-[16px] tablet:w-[368px] tablet:max-w-[368px]">
                            {(Object.entries(AUTH_PROVIDERS) as Array<[AuthProvider, typeof AUTH_PROVIDERS[AuthProvider]]>).map(([provider, config], index) => {
                                const isLoading = activeProvider === provider;

                                return (
                                    <button
                                        key={provider}
                                        type="button"
                                        className={clsx(
                                            "login-fade-in inline-flex min-h-[40px] w-full cursor-pointer items-center justify-start rounded-full border px-[16px] text-left text-[14px] font-normal leading-[1.4] tracking-[0.01em] transition-colors duration-150 tablet:min-h-[48px]",
                                            "hover:border-[rgba(236,46,46,0.16)] hover:bg-[rgba(236,46,46,0.04)] hover:text-[#0a0708] focus-visible:border-[rgba(236,46,46,0.16)] focus-visible:bg-[rgba(236,46,46,0.04)] focus-visible:text-[#0a0708] focus-visible:outline-none",
                                            isLoading
                                                ? "cursor-progress border-[#e8e8e8] bg-[#f2f2f3] text-[#39383b]"
                                                : config.enabled
                                                    ? "border-[#e8e8e8] bg-white text-[#39383b]"
                                                    : "border-[#eeeeef] bg-[#fafafb] text-[#b6b5ba] opacity-60"
                                        )}
                                        style={{ animationDelay: `${520 + index * 100}ms` }}
                                        aria-label={`Login from ${config.label}`}
                                        onClick={() => handleProviderClick(provider)}
                                    >
                                        <span className="inline-flex size-[20px] shrink-0 items-center justify-center tablet:size-[24px]" aria-hidden="true">
                                            <Image className="block size-[20px] object-contain [-webkit-user-drag:none] tablet:size-[24px]" src={config.icon} alt="" width={24} height={24} draggable={false} />
                                        </span>
                                        <span className="min-w-[0px] flex-1 text-center">
                                            Login from {config.label}
                                            {isLoading ? ' ...' : ''}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {feedback && (
                            <div className="login-fade-in mt-[16px] inline-flex w-[87.5vw] max-w-[320px] items-start gap-[8px] rounded-[16px] border border-[rgba(236,46,46,0.16)] bg-[rgba(236,46,46,0.04)] px-[12px] py-[10px] tablet:w-[368px] tablet:max-w-[368px] [animation-delay:860ms]" role="status" aria-live="polite">
                                <span className="mt-[0.45em] size-[6px] shrink-0 rounded-full bg-[#ec2e2e]" aria-hidden="true" />
                                <p className="m-[0px] text-[12px] font-normal leading-[1.4] tracking-[0.01em] text-[#39383b]">{feedback}</p>
                            </div>
                        )}

                        <p className="login-fade-in mt-[16px] w-[87.5vw] max-w-[320px] text-center text-[12px] font-normal leading-[1.4] tracking-[0.01em] text-[#9b9a9d] tablet:w-[368px] tablet:max-w-[368px] [animation-delay:940ms]">
                            By continuing, you agree to our{' '}
                            <a href="#" className="text-inherit underline underline-offset-[0.12em] hover:text-[#6a696c]">
                                Terms
                            </a>{' '}
                            and{' '}
                            <span className="inline-block">
                                <a href="#" className="text-inherit underline underline-offset-[0.12em] hover:text-[#6a696c]">
                                    Privacy Policy
                                </a>
                                .
                            </span>
                        </p>
                    </div>
                </section>

                <aside
                    className="login-visual-fade absolute inset-x-[0px] bottom-[0px] block h-[60vh] max-h-[620px] w-full select-none overflow-hidden bg-[url('/login-design/lucky-photo-mobile-collage.png')] bg-cover bg-center bg-bottom [-webkit-user-drag:none] desktop:relative desktop:inset-auto desktop:h-[100vh] desktop:h-[100svh] desktop:max-h-none desktop:w-[40vw] desktop:min-w-[320px] desktop:max-w-[760px] desktop:shrink-0 desktop:basis-[40vw] desktop:bg-[url('/login-design/lucky-photo-login-collage.png')] desktop:bg-center"
                    aria-label="Promotional image"
                />
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginPageSkeleton />}>
            <LoginContent />
        </Suspense>
    );
}
