'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';


// 本地类型定义
interface Plan {
    id: number;
    name: string;
    planType: 'SUBSCRIPTION' | 'ONE_TIME' | 'USAGE_PACK';
    price: string;
    currency: string;
    billingInterval?: 'MONTH' | 'QUARTER' | 'YEAR';
    usagePacks?: Array<{
        featureId: string;
        usageCount: number;
        feature: {
            featureKey: string;
            name: string;
        };
    }>;
}

interface Entitlement {
    id: number;
    entitlementType: 'SUBSCRIPTION' | 'PERMANENT';
    status: string;
    apps?: Array<{ app: { id: string } }>;
    expireTime?: string;
}

interface SubscriptionContextType {
    hasAccess: boolean;
    loading: boolean;
    plans: Plan[];
    entitlements: Entitlement[];
    checkAccess: () => Promise<boolean>;
    subscribe: (planId: number) => Promise<void>;
    refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [entitlements, setEntitlements] = useState<Entitlement[]>([]);

    const checkAccess = async () => {
        if (!user) {
            setHasAccess(false);
            return false;
        }

        try {
            const response = await fetch(`/api/store/entitlements?appId=${process.env.NEXT_PUBLIC_APP_ID}`);
            if (!response.ok) {
                throw new Error('Failed to check access');
            }
            const data = await response.json();
            logger.debug('SubscriptionContext checkAccess - API 返回数据', data);
            logger.debug('SubscriptionContext checkAccess - 当前 appId', {
                appId: process.env.NEXT_PUBLIC_APP_ID
            });

            // 兼容处理:API 可能直接返回数组,或返回 {entitlements: []}
            const entitlementsList = Array.isArray(data) ? data : (data.entitlements || []);
            logger.debug('SubscriptionContext checkAccess - 处理后的 entitlements', {
                count: entitlementsList.length
            });

            // 检查是否有活跃且包含当前app的entitlement
            const hasActiveEntitlement = entitlementsList.some((e: any) => {
                logger.debug('SubscriptionContext 检查 entitlement', {
                    id: e.id,
                    status: e.status,
                    appKeys: e.apps?.map((a: any) => a.app?.appKey)
                });
                if (e.status !== 'ACTIVE') {
                    logger.debug('SubscriptionContext entitlement 不是 ACTIVE 状态');
                    return false;
                }
                // 检查apps关联中是否包含当前appKey (不是 id!)
                const hasApp = e.apps?.some((appRel: any) =>
                    appRel.app?.appKey === process.env.NEXT_PUBLIC_APP_ID
                );
                logger.debug('SubscriptionContext apps 包含当前 appKey', { hasApp });
                return hasApp;
            }) || false;

            logger.debug('SubscriptionContext checkAccess - 最终结果', { hasActiveEntitlement });
            setHasAccess(hasActiveEntitlement);
            return hasActiveEntitlement;
        } catch (error) {
            console.error('检查访问权限失败:', error);
            setHasAccess(false);
            return false;
        }
    };

    const refreshSubscription = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // 直接调用 API
            const [entitlementsRes, plansRes] = await Promise.all([
                fetch(`/api/store/entitlements?appId=${process.env.NEXT_PUBLIC_APP_ID}`).catch(() => null),
                fetch(`/api/store/apps/${process.env.NEXT_PUBLIC_APP_ID}`).catch(() => null),
            ]);

            let hasActiveSubscription = false;
            let entitlementsData: Entitlement[] = [];

            if (entitlementsRes && entitlementsRes.ok) {
                const result = await entitlementsRes.json();
                // 兼容处理:API 可能直接返回数组,或返回 {entitlements: []}
                entitlementsData = Array.isArray(result) ? result : (result.entitlements || []);
                logger.debug('SubscriptionContext refreshSubscription - 返回的 entitlements', {
                    count: entitlementsData.length,
                    appId: process.env.NEXT_PUBLIC_APP_ID
                });

                // 检查是否有活跃且包含当前app的entitlement
                hasActiveSubscription = entitlementsData.some((e: any) => {
                    logger.debug('SubscriptionContext refreshSubscription - 检查 entitlement', {
                        id: e.id,
                        status: e.status,
                        appKeys: e.apps?.map((a: any) => a.app?.appKey)
                    });
                    if (e.status !== 'ACTIVE') return false;
                    // 检查apps关联中是否包含当前appKey (不是 id!)
                    const hasApp = e.apps?.some((appRel: any) =>
                        appRel.app?.appKey === process.env.NEXT_PUBLIC_APP_ID
                    );
                    logger.debug('SubscriptionContext refreshSubscription - apps 包含当前 appKey', { hasApp });
                    return hasApp;
                }) || false;

                logger.debug('SubscriptionContext refreshSubscription - 最终 hasActiveSubscription', {
                    hasActiveSubscription
                });
            }

            let plansData: Plan[] = [];
            if (plansRes && plansRes.ok) {
                const appData = await plansRes.json();
                plansData = appData.plans || [];
            }

            setHasAccess(hasActiveSubscription);
            setPlans(plansData);
            setEntitlements(entitlementsData);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const subscribe = async (planId: number) => {
        if (!user) {
            throw new Error('请先登录');
        }

        try {
            // 直接调用 API
            const response = await fetch('/api/payment/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pricingPlanId: planId,
                    successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/payment/cancel`,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '创建支付会话失败');
            }

            const data = await response.json();

            // 重定向到 Stripe 支付页面
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('未获取到支付链接');
            }
        } catch (error: any) {
            console.error('[SubscriptionContext] 订阅失败:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (user) {
            refreshSubscription();
        } else {
            setHasAccess(false);
            setPlans([]);
            setEntitlements([]);
            setLoading(false);
        }
    }, [user]);

    return (
        <SubscriptionContext.Provider
            value={{
                hasAccess,
                loading,
                plans,
                entitlements,
                checkAccess,
                subscribe,
                refreshSubscription
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
