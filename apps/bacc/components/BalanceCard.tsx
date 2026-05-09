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
            <div className="glass-card p-[24px] mb-[32px] animate-pulse">
                <div className="h-[24px] bg-cny-ivory/20 rounded w-[128px] mb-[16px]"></div>
                <div className="grid grid-cols-2 tablet:grid-cols-3 gap-[16px]">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[96px] bg-cny-ivory/10 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (balances.length === 0) {
        return null;
    }

    return (
        <div className="glass-card p-[24px] mb-[32px]">
            <div className="flex items-center gap-[8px] mb-[16px]">
                <Coins className="w-[20px] h-[20px] text-cny-gold" />
                <h2 className="text-xl font-bold text-cny-ivory">我的次数包余额</h2>
            </div>

            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[16px]">
                {balances.map(balance => (
                    <div
                        key={balance.id}
                        className="p-[16px] rounded-lg bg-gradient-to-br from-cny-gold/10 to-cny-red/10 border border-cny-gold/20"
                    >
                        <div className="font-medium text-cny-ivory mb-[8px]">
                            {balance.feature.name}
                        </div>
                        <div className="text-3xl font-bold text-cny-gold">
                            {balance.remainingCount} 次
                        </div>
                        <div className="mt-[8px] text-sm text-cny-ivory/60">
                            已购 {balance.totalPurchased} · 已用 {balance.totalUsed}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
