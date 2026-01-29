'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Plan, Entitlement } from '@repo/platform-sdk';

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
    const { user, sdk } = useAuth();
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
            const access = await sdk.subscription.checkAccess(process.env.NEXT_PUBLIC_APP_ID);
            setHasAccess(access);
            return access;
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
            console.log('[SubscriptionContext] 开始刷新订阅信息...');
            console.log('[SubscriptionContext] APP_ID:', process.env.NEXT_PUBLIC_APP_ID);

            // 并发获取订阅状态、计费方案和授权信息
            console.log('[SubscriptionContext] 调用 validateSubscription...');
            const statusPromise = sdk.subscription.validateSubscription();

            console.log('[SubscriptionContext] 调用 getPlans...');
            const plansPromise = sdk.subscription.getPlans(process.env.NEXT_PUBLIC_APP_ID).catch((err) => {
                console.error('[SubscriptionContext] getPlans 失败:', err);
                return [];
            });

            console.log('[SubscriptionContext] 调用 getEntitlementsForApp...');
            const entitlementsPromise = sdk.subscription.getEntitlementsForApp(process.env.NEXT_PUBLIC_APP_ID).catch((err) => {
                console.error('[SubscriptionContext] getEntitlementsForApp 失败:', err);
                return [];
            });

            const [status, plansData, entitlementsData] = await Promise.all([
                statusPromise,
                plansPromise,
                entitlementsPromise,
            ]);

            console.log('[SubscriptionContext] 订阅状态:', status);
            console.log('[SubscriptionContext] 计费方案数量:', plansData.length);
            console.log('[SubscriptionContext] 授权数量:', status.entitlements?.length || 0);

            setHasAccess(status.isActive);
            setPlans(plansData);
            setEntitlements(status.entitlements || []);
        } catch (error) {
            console.error('[SubscriptionContext] 刷新订阅信息失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribe = async (planId: number) => {
        try {
            const checkoutUrl = await sdk.subscription.createCheckout({
                planId,
                successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
            });

            // 重定向到 Stripe 支付页面
            window.location.href = checkoutUrl;
        } catch (error) {
            console.error('创建支付会话失败:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (user) {
            refreshSubscription();

            // 监听订阅状态变更
            const unsubscribe = sdk.onSubscriptionChange((status: { isActive: boolean }) => {
                if (!status.isActive) {
                    console.log('订阅已失效');
                    setHasAccess(false);
                } else {
                    refreshSubscription();
                }
            });

            return () => unsubscribe();
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
