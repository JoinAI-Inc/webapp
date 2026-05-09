"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Zap, ArrowRight } from "lucide-react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");

    const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
    const [addedCredits, setAddedCredits] = useState<number | null>(null);

    useEffect(() => {
        if (!sessionId) { setStatus("error"); return; }

        fetch('/api/payment/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setStatus("success");
                    // 尝试从返回数据里读取次数（未来可扩展）
                    setAddedCredits(data.usageCount || null);
                } else {
                    setStatus("error");
                }
            })
            .catch(() => setStatus("error"));
    }, [sessionId]);

    return (
        <main
            className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center px-[24px]"
            style={{ fontFamily: "Manrope, sans-serif" }}
        >
            <div className="bg-white rounded-3xl shadow-xl p-[40px] flex flex-col items-center text-center max-w-md w-full">
                {status === "syncing" && (
                    <>
                        <Loader2 size={48} className="animate-spin text-[#FF3F2A] mb-[20px]" />
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-[8px]">正在确认支付...</h1>
                        <p className="text-gray-500 text-sm">请稍候，我们正在处理您的订单</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-[80px] h-[80px] rounded-full bg-green-50 flex items-center justify-center mb-[20px]">
                            <CheckCircle2 size={44} className="text-green-500" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-[8px]">购买成功！🎉</h1>
                        <p className="text-gray-500 text-sm mb-[16px]">
                            {addedCredits
                                ? `${addedCredits} 次生成次数已到账`
                                : '您的生成次数已成功到账，可立即使用'}
                        </p>

                        <div className="flex items-center gap-[8px] px-[20px] py-[12px] bg-[#FF3F2A]/10 rounded-2xl mb-[28px]">
                            <Zap size={18} className="text-[#FF3F2A]" />
                            <span className="text-sm font-semibold text-[#FF3F2A]">余额已更新，开始创作吧！</span>
                        </div>

                        <button
                            onClick={() => router.push('/generate')}
                            className="w-full py-[14px] bg-[#FF3F2A] text-white font-bold rounded-2xl hover:bg-[#e03520] transition-colors flex items-center justify-center gap-[8px]"
                        >
                            开始生成 <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={() => router.push('/subscribe')}
                            className="mt-[12px] w-full py-[12px] text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        >
                            购买更多次数
                        </button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-[80px] h-[80px] rounded-full bg-orange-50 flex items-center justify-center mb-[20px]">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-[8px]">同步异常</h1>
                        <p className="text-gray-500 text-sm mb-[24px]">
                            支付可能已成功，但次数同步出现问题。次数将在数分钟内自动到账，您也可以联系支持。
                        </p>
                        <button
                            onClick={() => router.push('/generate')}
                            className="w-full py-[14px] bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
                        >
                            返回生成页
                        </button>
                    </>
                )}
            </div>
        </main>
    );
}

export default function SubscribeSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#FF3F2A]" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
