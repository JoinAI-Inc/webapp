'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserBalance, AccessCheckResult } from '@/types/usage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UsageContextValue {
    balances: UserBalance[];
    loading: boolean;
    refreshBalances: () => Promise<void>;
    getBalance: (featureKey: string) => UserBalance | null;
    checkAccess: (featureKey: string) => Promise<AccessCheckResult>;
}

const UsageContext = createContext<UsageContextValue | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
    const [balances, setBalances] = useState<UserBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // 初始化加载余额
    useEffect(() => {
        if (user?.id) {
            loadBalances();
        } else {
            setBalances([]);
        }
    }, [user?.id]);

    const loadBalances = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/usage/balance/${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setBalances(data);
            } else {
                console.error('Failed to load balances:', await res.text());
                setBalances([]);
            }
        } catch (error) {
            console.error('Error loading balances:', error);
            setBalances([]);
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
