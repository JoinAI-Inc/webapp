'use client';

import { Package } from 'lucide-react';

interface UsagePackCardProps {
    plan: any; // PricingPlan with usagePacks
    onPurchase: (planId: string) => void;
}

export function UsagePackCard({ plan, onPurchase }: UsagePackCardProps) {
    // 假设第一个usagePack（大多数情况下只有一个）
    const usagePack = plan.usagePacks?.[0];

    if (!usagePack) {
        return null;
    }

    return (
        <div className="glass-card p-[24px] hover:scale-105 transition-transform cursor-pointer group">
            <div className="mb-[16px]">
                <div className="inline-block px-[12px] py-[4px] bg-cny-gold/20 text-cny-gold text-xs rounded-full mb-[8px]">
                    按次购买
                </div>
                <h3 className="text-xl font-bold text-cny-ivory mb-[4px]">
                    {usagePack.feature?.name || plan.name}
                </h3>
                <p className="text-sm text-cny-ivory/60">{plan.description}</p>
            </div>

            <div className="text-center py-[24px] border-t border-b border-cny-ivory/10">
                <div className="flex items-center justify-center gap-[8px] mb-[8px]">
                    <Package className="w-[24px] h-[24px] text-cny-gold" />
                    <div className="text-4xl font-bold text-cny-gold">
                        {usagePack.usageCount}
                    </div>
                    <span className="text-cny-ivory/60">次</span>
                </div>
                <div className="text-2xl font-semibold text-cny-ivory mt-[12px]">
                    ¥{plan.price}
                </div>
                <div className="text-sm text-cny-ivory/50 mt-[4px]">
                    ≈ ¥{(Number(plan.price) / usagePack.usageCount).toFixed(2)}/次
                </div>
            </div>

            <button
                onClick={() => onPurchase(plan.id)}
                className="w-full mt-[24px] px-[24px] py-[12px] bg-gradient-to-r from-cny-gold to-cny-orange text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-cny-gold/50 transition-all group-hover:scale-105"
            >
                立即购买
            </button>
        </div>
    );
}
