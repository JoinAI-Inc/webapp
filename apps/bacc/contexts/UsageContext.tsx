'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserBalance, AccessCheckResult } from '@/types/usage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    // 用户登出时清空余额，不在登录时自动加载（按需调用 refreshBalances）
    useEffect(() => {
        if (!user?.id) {
            setBalances([]);
        }
    }, [user?.id]);

    const loadBalances = async (): Promise<UserBalance[]> => {
        if (!user?.id) return [];

        setLoading(true);
        try {
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
        } catch (error) {
            console.error('[UsageContext] Error loading balances:', error);
            setBalances([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getBalance = (featureKey: string): UserBalance | null => {
        return balances.find(b => b.feature.featureKey === featureKey) || null;
    };

    const checkAccess = async (featureKey: string): Promise<AccessCheckResult> => {
        if (!user?.id) {
            return { hasAccess: false, source: null };
        }

        try {
            const res = await fetch(`${API_URL}/api/usage/check-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId: user.id,
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
