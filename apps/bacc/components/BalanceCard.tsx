'use client';

import { UserBalance } from '@/types/usage';
import { Coins } from 'lucide-react';

interface BalanceCardProps {
    balances: UserBalance[];
    loading?: boolean;
}

export function BalanceCard({ balances, loading }: BalanceCardProps) {
    if (loading) {
        return (
            <div className="glass-card p-6 mb-8 animate-pulse">
                <div className="h-6 bg-cny-ivory/20 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-cny-ivory/10 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (balances.length === 0) {
        return null;
    }

    return (
        <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-cny-gold" />
                <h2 className="text-xl font-bold text-cny-ivory">我的次数包余额</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {balances.map(balance => (
                    <div
                        key={balance.id}
                        className="p-4 rounded-lg bg-gradient-to-br from-cny-gold/10 to-cny-red/10 border border-cny-gold/20"
                    >
                        <div className="font-medium text-cny-ivory mb-2">
                            {balance.feature.name}
                        </div>
                        <div className="text-3xl font-bold text-cny-gold">
                            {balance.remainingCount} 次
                        </div>
                        <div className="mt-2 text-sm text-cny-ivory/60">
                            已购 {balance.totalPurchased} · 已用 {balance.totalUsed}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
