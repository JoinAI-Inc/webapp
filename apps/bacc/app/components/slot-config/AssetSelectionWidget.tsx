import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Slot } from "./slot-config.types";
import { DefaultAssetIcon } from "./UploadWidget";

interface AssetSelectionWidgetProps {
    slot: Slot;
    selectedAssets: Record<string, string>;
    onAssetSelect: (slotId: string, assetId: string, requiredFeatureKey: string | null) => void;
    onDefaultSelect: (slotId: string) => void;
}

function HorizontalAssetScroller({
    children,
    dependencyKey,
}: {
    children: ReactNode;
    dependencyKey: string;
}) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [scrollState, setScrollState] = useState({
        canScrollLeft: false,
        canScrollRight: false,
    });

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        const hasOverflow = maxScrollLeft > 1;
        setScrollState({
            canScrollLeft: hasOverflow && el.scrollLeft > 1,
            canScrollRight: hasOverflow && el.scrollLeft < maxScrollLeft - 1,
        });
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        updateScrollState();
        const animationFrame = window.requestAnimationFrame(updateScrollState);
        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateScrollState)
            : null;
        resizeObserver?.observe(el);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
            resizeObserver?.disconnect();
        };
    }, [dependencyKey, updateScrollState]);

    const scrollByCards = (direction: -1 | 1) => {
        scrollRef.current?.scrollBy({
            left: direction * 264,
            behavior: 'smooth',
        });
    };

    return (
        <div className="relative w-full">
            <div ref={scrollRef} className="flex gap-[8px] overflow-x-auto scrollbar-hide">
                {children}
            </div>

            {scrollState.canScrollLeft && (
                <>
                    <div className="pointer-events-none absolute bottom-[0px] left-[0px] top-[0px] hidden w-[113px] bg-gradient-to-r from-white from-[31.25%] to-white/0 tablet:block" />
                    <button
                        type="button"
                        onClick={() => scrollByCards(-1)}
                        className="absolute left-[0px] top-1/2 hidden size-[32px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6a696c] shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f2f2f3] tablet:flex"
                        aria-label="Scroll asset list left"
                    >
                        <ChevronLeft size={20} strokeWidth={2} />
                    </button>
                </>
            )}

            {scrollState.canScrollRight && (
                <>
                    <div className="pointer-events-none absolute bottom-[0px] right-[0px] top-[0px] hidden w-[113px] bg-gradient-to-l from-white from-[31.25%] to-white/0 tablet:block" />
                    <button
                        type="button"
                        onClick={() => scrollByCards(1)}
                        className="absolute right-[0px] top-1/2 hidden size-[32px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6a696c] shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f2f2f3] tablet:flex"
                        aria-label="Scroll asset list right"
                    >
                        <ChevronRight size={20} strokeWidth={2} />
                    </button>
                </>
            )}
        </div>
    );
}

export function AssetSelectionWidget({
    slot,
    selectedAssets,
    onAssetSelect,
    onDefaultSelect,
}: AssetSelectionWidgetProps) {
    const assets = slot.assets || [];
    const isSelected = (assetId: string) => selectedAssets[slot.id] === assetId;
    const isDefaultSelected = !selectedAssets[slot.id];

    return (
        <HorizontalAssetScroller dependencyKey={`${slot.id}:${assets.length}`}>
            {/* Default Option (No override/Original) */}
            <button
                onClick={() => onDefaultSelect(slot.id)}
                className="relative h-[112px] w-[80px] shrink-0 overflow-hidden bg-transparent"
            >
                {isDefaultSelected && <div className="absolute inset-[0px] rounded-[4px] border border-[#EC2E2E] bg-white" />}
                <div className={`absolute rounded-[4px] border border-[#E8E8E8] bg-[#f7f7f7] ${isDefaultSelected ? 'inset-[3px]' : 'inset-0'}`} />
                <div className="absolute left-1/2 top-1/2 flex w-[41px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                    <DefaultAssetIcon type={slot.slotType} />
                    <span className="min-w-full text-[12px] font-normal leading-[1.4] tracking-[0.12px] text-[#cccbce]">
                        default
                    </span>
                </div>
            </button>

            {/* Database Assets */}
            {assets.map((asset) => {
                const active = isSelected(asset.id);
                const isPremium = !!asset.requiredFeatureKey;

                return (
                    <button
                        key={asset.id}
                        onClick={() => onAssetSelect(slot.id, asset.id, asset.requiredFeatureKey)}
                        className="group relative h-[112px] w-[80px] shrink-0 rounded-[4px] bg-white"
                    >
                        {active && <div className="absolute inset-[0px] rounded-[4px] border border-[#EC2E2E] bg-white" />}
                        <div className={`absolute overflow-hidden rounded-[4px] border border-[#e8e8e8] bg-[#f7f7f7] ${active ? 'inset-[3px]' : 'inset-0'}`}>
                            <Image
                                src={asset.thumbnailUrl}
                                alt={asset.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            {/* Premium Badge */}
                            {isPremium && (
                                <div className="absolute top-[8px] right-[8px] w-[24px] h-[24px] bg-gradient-to-tr from-yellow-500 to-yellow-300 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                    <svg className="w-[14px] h-[14px] text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </HorizontalAssetScroller>
    );
}
