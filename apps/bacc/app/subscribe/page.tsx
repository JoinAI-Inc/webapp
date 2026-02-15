'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUsage } from '@/contexts/UsageContext';
import { Check, Crown, Calendar, Package } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { BalanceCard } from '@/components/BalanceCard';
import { useEffect } from 'react';


function SubscribePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo');
    const { user } = useAuth();
    const { plans, loading, hasAccess, entitlements, subscribe } = useSubscription();
    const { balances, loading: balanceLoading, refreshBalances } = useUsage();

    console.log('[Subscribe Page] Balances:', balances);
    console.log('[Subscribe Page] Balance loading:', balanceLoading);
    console.log('[Subscribe Page] User:', user);

    // 手动刷新余额
    useEffect(() => {
        console.log('[Subscribe Page] Manually refreshing balances');
        if (user?.id && refreshBalances) {
            refreshBalances();
        }
    }, [user?.id, refreshBalances]);

    // 如果已订阅且有重定向参数,自动跳转
    useEffect(() => {
        if (hasAccess && redirectTo && !loading) {
            router.push(redirectTo);
        }
    }, [hasAccess, redirectTo, loading, router]);

    // AuthGuard 已处理未登录情况,这里移除重复检查

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-cny-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xl text-cny-ivory/60">加载中...</p>
                </div>
            </div>
        );
    }

    // 已订阅用户：显示订阅详情 + 余额 + 次数包
    if (hasAccess) {
        const usagePlans = plans.filter(p => p.planType === 'USAGE_PACK');

        return (
            <div className="min-h-screen bg-black text-white py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 space-y-4">
                        <Crown className="w-20 h-20 text-cny-gold mx-auto" />
                        <h1 className="text-4xl font-bold text-cny-gold">感谢订阅 BACC</h1>
                        <p className="text-cny-ivory/60">您已拥有完整使用权限</p>
                    </div>

                    {/* 余额卡片 */}
                    {balances.length > 0 && (
                        <div className="mb-12">
                            <BalanceCard balances={balances} loading={balanceLoading} />
                        </div>
                    )}

                    {/* 订阅详情卡片 */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-cny-ivory mb-4">我的订阅</h2>

                        {entitlements.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <p className="text-cny-ivory/40">暂无订阅信息</p>
                            </div>
                        ) : (
                            entitlements.map((entitlement, index) => (
                                <div key={entitlement.id || index} className="glass-card p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <Package className="w-5 h-5 text-cny-gold" />
                                                <h3 className="text-xl font-bold text-cny-ivory">
                                                    BACC 订阅
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-cny-ivory/60">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-cny-gold/20 rounded text-cny-gold text-xs">
                                                        {entitlement.entitlementType === 'PERMANENT' ? '永久' : '订阅'}
                                                    </span>
                                                    <span className="px-2 py-1 bg-green-500/20 rounded text-green-400 text-xs">
                                                        生效中
                                                    </span>
                                                </div>

                                                {entitlement.expireTime && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>
                                                            到期: {new Date(entitlement.expireTime).toLocaleDateString('zh-CN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 应用范围 */}
                                            <div className="mt-3">
                                                {entitlement.apps && entitlement.apps.length > 0 ? (
                                                    <div className="text-sm text-cny-ivory/60">
                                                        <p className="mb-1">包含应用:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {entitlement.apps.map((app: any) => (
                                                                <span
                                                                    key={app.app?.id}
                                                                    className="px-2 py-1 bg-cny-ivory/10 rounded text-xs"
                                                                >
                                                                    {app.app?.name || '应用'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 次数包购买区域 */}
                    {usagePlans.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-cny-ivory mb-4">按次购买</h2>
                            <p className="text-sm text-cny-ivory/60 mb-6">
                                购买次数包作为补充，叠加使用
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {usagePlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="glass-card p-6 space-y-4 hover:border-cny-gold/50 transition-all"
                                    >
                                        <div className="space-y-2">
                                            <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full mb-2">
                                                按次购买
                                            </div>
                                            <h3 className="text-xl font-bold text-cny-ivory">{plan.name}</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-cny-gold">
                                                    ¥{plan.price}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {plan.usagePacks?.map((pack: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 text-cny-ivory/80 text-sm">
                                                    <Package className="w-4 h-4 text-purple-300 flex-shrink-0" />
                                                    <span>{pack.usageCount}次 {pack.feature.name}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => subscribe(plan.id)}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:scale-105 transition-all text-sm"
                                        >
                                            立即购买
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="mt-12 flex gap-4 justify-center">
                        {redirectTo ? (
                            <button
                                onClick={() => router.push(redirectTo)}
                                className="px-6 py-3 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-lg font-bold shadow-[0_0_30px_rgba(238,45,47,0.3)] hover:scale-105 transition-all"
                            >
                                继续访问
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-6 py-3 bg-cny-gold/10 hover:bg-cny-gold/20 border border-cny-gold/20 rounded-lg text-cny-gold transition-all"
                                >
                                    返回首页
                                </button>
                                <button
                                    onClick={() => router.push('/studio/magic')}
                                    className="px-6 py-3 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-lg font-bold shadow-[0_0_30px_rgba(238,45,47,0.3)] hover:scale-105 transition-all"
                                >
                                    开始创作
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 未订阅用户：显示订阅方案和次数包
    const subscriptionPlans = plans.filter(p => p.planType === 'SUBSCRIPTION' || p.planType === 'ONE_TIME');
    const usagePlans = plans.filter(p => p.planType === 'USAGE_PACK');

    return (
        <div className="min-h-screen bg-black text-white py-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-bold text-shimmer">选择您的方案</h1>
                    <p className="text-xl text-cny-ivory/60">
                        解锁 BACC 的全部功能
                    </p>
                </div>

                {/* 订阅方案 */}
                {subscriptionPlans.length > 0 && (
                    <>
                        <h2 className="text-3xl font-bold text-cny-ivory mb-8">订阅方案</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                            {subscriptionPlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="glass-card p-8 space-y-6 hover:border-cny-gold/50 transition-all"
                                >
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-cny-ivory">{plan.name}</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-cny-gold">
                                                ¥{plan.price}
                                            </span>
                                            {plan.billingInterval && (
                                                <span className="text-cny-ivory/40">
                                                    /{plan.billingInterval === 'MONTH' ? '月' : plan.billingInterval === 'YEAR' ? '年' : plan.billingInterval}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2 text-cny-ivory/80 text-sm">
                                            <Check className="w-5 h-5 text-cny-gold flex-shrink-0 mt-0.5" />
                                            <span>无限制使用所有功能</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-cny-ivory/80 text-sm">
                                            <Check className="w-5 h-5 text-cny-gold flex-shrink-0 mt-0.5" />
                                            <span>AI 汉服形象生成</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-cny-ivory/80 text-sm">
                                            <Check className="w-5 h-5 text-cny-gold flex-shrink-0 mt-0.5" />
                                            <span>拜年视频定制</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-cny-ivory/80 text-sm">
                                            <Check className="w-5 h-5 text-cny-gold flex-shrink-0 mt-0.5" />
                                            <span>家装过年化</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => subscribe(plan.id)}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-xl font-bold shadow-[0_0_30px_rgba(238,45,47,0.3)] hover:scale-105 transition-all"
                                    >
                                        立即订阅
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* 次数包方案 */}
                {usagePlans.length > 0 && (
                    <>
                        <h2 className="text-3xl font-bold text-cny-ivory mb-8">次数包方案</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {usagePlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="glass-card p-6 space-y-4 hover:border-cny-gold/50 transition-all"
                                >
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-cny-ivory">{plan.name}</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-cny-gold">
                                                ¥{plan.price}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {plan.usagePacks?.map((pack, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-cny-ivory/80 text-sm">
                                                <Package className="w-4 h-4 text-cny-gold flex-shrink-0" />
                                                <span>{pack.usageCount}次 {pack.feature.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => subscribe(plan.id)}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-lg font-bold shadow-[0_0_20px_rgba(238,45,47,0.2)] hover:scale-105 transition-all text-sm"
                                    >
                                        立即购买
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {plans.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-cny-ivory/40">暂无可用的方案</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// 使用 AuthGuard 保护此页面,确保用户已登录
export default function SubscribePage() {
    return (
        <AuthGuard>
            <SubscribePageContent />
        </AuthGuard>
    );
}
