'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { UserBalance, AccessCheckResult } from '@/types/usage';

interface UsageContextValue {
    balances: UserBalance[];
    loading: boolean;
    refreshBalances: () => Promise<UserBalance[]>;
    getBalance: (featureKey: string) => UserBalance | null;
    checkAccess: (featureKey: string) => Promise<AccessCheckResult>;
}

const UsageContext = createContext<UsageContextValue | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
    const [balances, setBalances] = useState<UserBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const loadBalancesPromiseRef = useRef<Promise<UserBalance[]> | null>(null);

    // 用户登出时清空余额，不在登录时自动加载（按需调用 refreshBalances）
    useEffect(() => {
        if (!user?.id) {
            setBalances([]);
        }
    }, [user?.id]);

    const loadBalances = async (): Promise<UserBalance[]> => {
        if (!user?.id) return [];
        if (loadBalancesPromiseRef.current) return loadBalancesPromiseRef.current;

        loadBalancesPromiseRef.current = (async () => {
            setLoading(true);
            const res = await fetch('/api/usage/balance', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setBalances(data);
                return data;
            } else {
                setBalances([]);
                return [];
            }
        })()
            .catch((error) => {
                console.error('[UsageContext] Error loading balances:', error);
                setBalances([]);
                return [];
            })
            .finally(() => {
                setLoading(false);
                loadBalancesPromiseRef.current = null;
            });

        return loadBalancesPromiseRef.current;
    };

    const getBalance = (featureKey: string): UserBalance | null => {
        return balances.find(b => b.feature.featureKey === featureKey) || null;
    };

    const checkAccess = async (featureKey: string): Promise<AccessCheckResult> => {
        if (!user?.id) {
            return { hasAccess: false, source: null };
        }

        try {
            const res = await fetch('/api/usage/check-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    featureKey
                })
            });

            if (res.ok) {
                return await res.json();
            }

            return { hasAccess: false, source: null };
        } catch (error) {
            console.error('Error checking access:', error);
            return { hasAccess: false, source: null };
        }
    };

    return (
        <UsageContext.Provider value={{
            balances,
            loading,
            refreshBalances: loadBalances,
            getBalance,
            checkAccess
        }}>
            {children}
        </UsageContext.Provider>
    );
}

export function useUsage() {
    const context = useContext(UsageContext);
    if (context === undefined) {
        throw new Error('useUsage must be used within a UsageProvider');
    }
    return context;
}
