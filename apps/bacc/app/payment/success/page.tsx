'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type SyncStatus = 'syncing' | 'success' | 'error' | 'retrying';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const { sdk } = useAuth();
    const { refreshSubscription } = useSubscription();
    const [status, setStatus] = useState<SyncStatus>('syncing');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 2000; // 2 秒
        const REDIRECT_DELAY = 2000; // 成功后 2 秒跳转

        async function syncPayment(sessionId: string, attempt: number = 0): Promise<void> {
            console.log(`[支付同步] 尝试同步支付状态 (第 ${attempt + 1}/${MAX_RETRIES + 1} 次)`, { sessionId });

            try {
                // 尝试同步支付状态
                await sdk.subscription.syncPaymentStatus(sessionId);
                console.log('[支付同步] ✓ 支付状态同步成功');

                // 刷新订阅状态
                setStatus('success');
                console.log('[支付同步] 刷新订阅状态...');
                await refreshSubscription();
                console.log('[支付同步] ✓ 订阅状态已刷新');

                // 成功后跳转
                console.log(`[支付同步] ${REDIRECT_DELAY / 1000} 秒后跳转到首页...`);
                setTimeout(() => {
                    console.log('[支付同步] 正在跳转到首页...');
                    router.push('/');
                }, REDIRECT_DELAY);

            } catch (error: any) {
                console.error(`[支付同步] ✗ 同步失败 (第 ${attempt + 1} 次):`, error);

                // 如果还有重试次数，继续重试
                if (attempt < MAX_RETRIES) {
                    setStatus('retrying');
                    setRetryCount(attempt + 1);
                    console.log(`[支付同步] 将在 ${RETRY_DELAY / 1000} 秒后重试...`);

                    setTimeout(() => {
                        syncPayment(sessionId, attempt + 1);
                    }, RETRY_DELAY);
                } else {
                    // 重试次数用尽，显示错误
                    console.error('[支付同步] ✗ 同步失败，已达到最大重试次数');
                    setStatus('error');
                    setErrorMessage(
                        error?.message || '同步支付状态失败，但您的支付可能已成功。请刷新页面或联系客服。'
                    );
                }
            }
        }

        async function handleSuccess() {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');

            console.log('[支付同步] 支付成功页面加载', { sessionId });

            if (!sessionId) {
                console.error('[支付同步] ✗ 缺少 session_id 参数');
                setStatus('error');
                setErrorMessage('缺少支付会话 ID');
                return;
            }

            syncPayment(sessionId);
        }

        handleSuccess();
    }, [sdk, refreshSubscription, router]);

    // 手动跳转到首页
    const handleManualRedirect = () => {
        console.log('[支付同步] 用户手动跳转到首页');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="max-w-md text-center space-y-6">
                {/* 状态图标 */}
                <div className="w-20 h-20 bg-cny-gold/20 rounded-full flex items-center justify-center mx-auto">
                    {status === 'syncing' || status === 'retrying' ? (
                        <Loader2 className="w-10 h-10 text-cny-gold animate-spin" />
                    ) : status === 'success' ? (
                        <CheckCircle className="w-10 h-10 text-cny-gold" />
                    ) : (
                        <AlertCircle className="w-10 h-10 text-yellow-500" />
                    )}
                </div>

                {/* 标题 */}
                <h1 className="text-3xl font-bold text-cny-gold">
                    {status === 'error' ? '同步中遇到问题' : '支付成功！'}
                </h1>

                {/* 状态消息 */}
                <div className="space-y-2">
                    {status === 'syncing' && (
                        <p className="text-cny-ivory/60">正在同步支付状态...</p>
                    )}
                    {status === 'retrying' && (
                        <div className="space-y-1">
                            <p className="text-cny-ivory/60">同步中，请稍候...</p>
                            <p className="text-sm text-cny-ivory/40">（重试 {retryCount}/{5}）</p>
                        </div>
                    )}
                    {status === 'success' && (
                        <p className="text-cny-ivory/60">订阅已激活，即将跳转到首页...</p>
                    )}
                    {status === 'error' && (
                        <div className="space-y-3">
                            <p className="text-cny-ivory/60">{errorMessage}</p>
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-200/80">
                                <p>💡 支付可能已成功但状态同步延迟。请稍后在订阅页面确认。</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 操作按钮 */}
                {status === 'error' && (
                    <div className="flex flex-col gap-3 mt-6">
                        <button
                            onClick={handleManualRedirect}
                            className="px-6 py-3 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-lg font-bold shadow-[0_0_30px_rgba(238,45,47,0.3)] hover:scale-105 transition-all"
                        >
                            返回首页
                        </button>
                        <button
                            onClick={() => router.push('/subscribe')}
                            className="px-6 py-3 bg-cny-gold/10 hover:bg-cny-gold/20 border border-cny-gold/20 rounded-lg text-cny-gold transition-all"
                        >
                            查看订阅状态
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
