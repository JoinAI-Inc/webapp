'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type SyncStatus = 'syncing' | 'success' | 'error' | 'retrying';

export default function PaymentSuccessPage() {
    const router = useRouter();
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
                // 直接调用 API，不使用 SDK
                const response = await fetch('/api/payment/sync-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sessionId }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '同步支付状态失败');
                }

                const result = await response.json();
                console.log('[支付同步] ✓ 支付状态同步成功', result);

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
    }, [refreshSubscription, router]);

    // 手动跳转到首页
    const handleManualRedirect = () => {
        console.log('[支付同步] 用户手动跳转到首页');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex items-center justify-center px-[24px] font-['Inter',_sans-serif]">
            <div className="max-w-md text-center space-y-[24px] bg-white p-[32px] rounded-[2rem] shadow-[0_12px_40px_rgba(26,28,28,0.04)]">
                {/* 状态图标 */}
                <div className="w-[80px] h-[80px] bg-[#EC2E2E]/10 rounded-full flex items-center justify-center mx-auto">
                    {status === 'syncing' || status === 'retrying' ? (
                        <Loader2 className="w-[40px] h-[40px] text-[#EC2E2E] animate-spin" />
                    ) : status === 'success' ? (
                        <CheckCircle className="w-[40px] h-[40px] text-[#0ec423]" />
                    ) : (
                        <AlertCircle className="w-[40px] h-[40px] text-yellow-500" />
                    )}
                </div>

                {/* 标题 */}
                <h1 className="text-3xl font-bold text-[#1a1c1c] font-['Plus_Jakarta_Sans',_sans-serif]">
                    {status === 'error' ? '同步中遇到问题' : '支付成功！'}
                </h1>

                {/* 状态消息 */}
                <div className="space-y-[8px]">
                    {status === 'syncing' && (
                        <p className="text-[#6a696c]">正在同步支付状态...</p>
                    )}
                    {status === 'retrying' && (
                        <div className="space-y-[4px]">
                            <p className="text-[#6a696c]">同步中，请稍候...</p>
                            <p className="text-sm text-[#9b9a9d]">（重试 {retryCount}/{5}）</p>
                        </div>
                    )}
                    {status === 'success' && (
                        <p className="text-[#6a696c]">订阅已激活，即将跳转到首页...</p>
                    )}
                    {status === 'error' && (
                        <div className="space-y-[12px]">
                            <p className="text-[#6a696c]">{errorMessage}</p>
                            <div className="p-[16px] bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                                <p>💡 支付可能已成功但状态同步延迟。请稍后在订阅页面确认。</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 操作按钮 */}
                {status === 'error' && (
                    <div className="flex flex-col gap-[12px] mt-[24px]">
                        <button
                            onClick={handleManualRedirect}
                            className="px-[24px] py-[12px] bg-gradient-to-b from-[#EC2E2E] to-[#d62626] text-white rounded-full font-bold shadow-[0_12px_40px_rgba(236,46,46,0.2)] hover:scale-[1.02] transition-transform"
                        >
                            返回首页
                        </button>
                        <button
                            onClick={() => router.push('/subscribe')}
                            className="px-[24px] py-[12px] bg-white hover:bg-[#f3f3f3] shadow-sm rounded-full text-[#1a1c1c] font-medium transition-colors border border-[#e8e8e8]"
                        >
                            查看订阅状态
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
