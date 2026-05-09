"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, CheckCircle2, Loader2, Sparkles, Unlock } from "lucide-react";

interface PlanFeature {
    featureId: string;
    usageCount: number | null;
    feature: { name: string; featureKey: string; chargingType?: string };
}

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    planType: string;
    planFeatures?: PlanFeature[];   // 新结构
    usagePacks?: PlanFeature[];     // 旧结构兼容
    stripePriceId: string | null;
}

const CURRENCY_SYMBOL: Record<string, string> = {
    USD: '$', CNY: '¥', EUR: '€', GBP: '£',
};

// 从 plan 中读取功能点信息（优先新结构）
function getPlanFeatureInfo(plan: Plan) {
    const pfs = plan.planFeatures?.length ? plan.planFeatures : plan.usagePacks || [];
    if (pfs.length === 0) return null;
    const pf = pfs[0];
    return {
        chargingType: pf.feature?.chargingType || (pf.usageCount ? 'COUNT' : 'TOGGLE'),
        count: pf.usageCount ?? 0,
        featureName: pf.feature?.name || '',
    };
}

function getPlanHighlight(plan: Plan): { badge: string; color: string } {
    const info = getPlanFeatureInfo(plan);
    if (plan.planType === 'ONE_TIME') return { badge: "Unlock", color: "bg-purple-600 text-white" };
    const count = info?.count || 0;
    if (count >= 30) return { badge: "Best Value", color: "bg-[#EC2E2E] text-white" };
    if (count >= 10) return { badge: "Popular", color: "bg-purple-600 text-white" };
    return { badge: "Starter", color: "bg-[#1a1c1c] text-white" };
}

export default function SubscribePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/plans')
            .then(async r => {
                const data = await r.json().catch(() => null);
                if (!r.ok) throw new Error(data?.message || data?.error || 'Failed to load plans');
                return data;
            })
            .then(data => {
                setPlans(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch((err: any) => {
                setPlans([]);
                setError(err.message || 'Failed to load plans');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleBuy = async (plan: Plan) => {
        if (!session) { router.push('/login'); return; }
        if (!plan.stripePriceId) {
            setError('This plan is not available for purchase yet (no Stripe Price ID).');
            return;
        }

        setPurchasing(plan.id);
        setError(null);

        try {
            const res = await fetch('/api/payment/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pricingPlanId: plan.id,
                    successUrl: `${window.location.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/subscribe`,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create checkout');
            if (data.url) window.location.href = data.url;
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setPurchasing(null);
        }
    };

    const sortedPlans = [...plans].sort((a, b) => {
        const aInfo = getPlanFeatureInfo(a);
        const bInfo = getPlanFeatureInfo(b);
        return (aInfo?.count || 0) - (bInfo?.count || 0);
    });

    return (
        <main
            className="min-h-screen bg-[#f9f9f9] flex flex-col items-center px-[24px] py-[64px] font-['Inter',_sans-serif]"
        >
            {/* Header */}
            <div className="text-center mb-[48px] max-w-xl">
                <div className="inline-flex items-center gap-[8px] px-[16px] py-[6px] bg-[#EC2E2E]/10 text-[#EC2E2E] rounded-full text-sm font-semibold mb-[16px]">
                    <Sparkles size={14} />
                    Generation Credits
                </div>
                <h1 className="text-4xl font-extrabold text-[#1a1c1c] mb-[12px] font-['Plus_Jakarta_Sans',_sans-serif]">获取更多生成次数</h1>
                <p className="text-[#6a696c] text-lg">
                    购买次数包，立即解锁更多 AI 生成机会。次数永不过期，用完再买。
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-[24px] px-[20px] py-[12px] bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm max-w-lg w-full text-center">
                    {error}
                </div>
            )}

            {/* Plans Grid */}
            {loading ? (
                <div className="flex items-center gap-[12px] text-gray-400 py-[80px]">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Loading plans...</span>
                </div>
            ) : sortedPlans.length === 0 ? (
                <div className="text-center py-[80px] text-gray-400">
                    <p className="text-lg font-medium">暂无可用套餐</p>
                    <p className="text-sm mt-[4px]">请联系管理员配置次数包</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[24px] w-full max-w-4xl">
                    {sortedPlans.map(plan => {
                        const info = getPlanFeatureInfo(plan);
                        const isToggle = plan.planType === 'ONE_TIME' || info?.chargingType === 'TOGGLE';
                        const count = info?.count || 0;
                        const symbol = CURRENCY_SYMBOL[plan.currency] || plan.currency;
                        const { badge, color } = getPlanHighlight(plan);
                        const pricePerUse = (!isToggle && count > 0) ? (plan.price / count).toFixed(2) : null;
                        const isBuying = purchasing === plan.id;
                        const isBestValue = !isToggle && count >= 30;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-[1.5rem] p-[28px] flex flex-col shadow-[0_12px_40px_rgba(26,28,28,0.04)] hover:shadow-[0_12px_40px_rgba(26,28,28,0.08)] hover:translate-y-[-4px] transition-all duration-300 ${isBestValue ? 'ring-2 ring-[#EC2E2E]/30 bg-[#fbfbfb]' : isToggle ? 'ring-1 ring-purple-100/50' : ''}`}
                            >
                                {/* Badge */}
                                <span className={`absolute top-[-12px] left-[24px] px-[12px] py-[4px] rounded-full text-xs font-bold ${color}`}>
                                    {badge}
                                </span>

                                {/* Icon + Main info */}
                                <div className="flex items-center gap-[12px] mb-[20px] mt-[8px]">
                                    <div className={`w-[44px] h-[44px] rounded-2xl flex items-center justify-center ${isBestValue ? 'bg-[#EC2E2E]/10' : isToggle ? 'bg-purple-100' : 'bg-[#f3f3f3]'}`}>
                                        {isToggle
                                            ? <Unlock size={20} className="text-purple-600" />
                                            : <Zap size={20} className={isBestValue ? 'text-[#EC2E2E]' : 'text-[#6a696c]'} />
                                        }
                                    </div>
                                    <div>
                                        {isToggle ? (
                                            <>
                                                <p className="text-lg font-extrabold text-gray-900">永久解锁</p>
                                                <p className="text-sm text-gray-500">{info?.featureName || '功能点'}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-3xl font-extrabold text-gray-900">{count}</p>
                                                <p className="text-sm text-gray-500">次生成</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Plan name */}
                                <h3 className="text-base font-bold text-[#1a1c1c] mb-[4px] font-['Plus_Jakarta_Sans',_sans-serif]">{plan.name}</h3>

                                {/* Features */}
                                <ul className="flex flex-col gap-[6px] mb-[24px] flex-1">
                                    <li className="flex items-center gap-[8px] text-sm text-gray-600">
                                        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                                        AI 高质量写真生成
                                    </li>
                                    <li className="flex items-center gap-[8px] text-sm text-gray-600">
                                        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                                        {isToggle ? '一次付费永久生效' : '次数永不过期'}
                                    </li>
                                    {pricePerUse && (
                                        <li className="flex items-center gap-[8px] text-sm text-gray-600">
                                            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                                            每次约 {symbol}{pricePerUse}
                                        </li>
                                    )}
                                </ul>

                                {/* Price + Buy */}
                                <div>
                                    <div className="flex items-baseline gap-[4px] mb-[12px]">
                                        <span className="text-4xl font-extrabold text-[#1a1c1c] font-['Plus_Jakarta_Sans',_sans-serif]">{symbol}{plan.price}</span>
                                        <span className="text-sm text-gray-400">{plan.currency}</span>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(plan)}
                                        disabled={isBuying || status === 'loading'}
                                        className={`w-full py-[12px] rounded-full font-bold text-sm transition-all flex items-center justify-center gap-[8px] ${isBestValue
                                            ? 'bg-gradient-to-b from-[#EC2E2E] to-[#d62626] text-white hover:scale-[1.02] shadow-[0_12px_40px_rgba(236,46,46,0.2)]'
                                            : isToggle
                                                ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white hover:scale-[1.02]'
                                                : 'bg-[#1a1c1c] text-white hover:scale-[1.02]'
                                            } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                                    >
                                        {isBuying ? (
                                            <><Loader2 size={15} className="animate-spin" /> 跳转中...</>
                                        ) : session ? (
                                            isToggle ? '立即解锁' : '立即购买'
                                        ) : (
                                            '登录后购买'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer note */}
            <p className="mt-[48px] text-xs text-gray-400 text-center max-w-md">
                购买即表示您同意我们的服务条款。支付通过 Stripe 安全处理。次数包购买后即时到账，不支持退款。
            </p>
        </main>
    );
}
