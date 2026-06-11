"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function ProgressLostModal({
    onKeepEditing,
    onBackToTemplates,
}: {
    onKeepEditing: () => void;
    onBackToTemplates: () => void;
}) {
    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-white/30 backdrop-blur-sm"
            onClick={onKeepEditing}
        >
            <div
                className="relative mx-[16px] flex w-full max-w-[87.5vw] flex-col items-center rounded-[16px] border border-[#E8E8E8] bg-white px-[24px] pb-[24px] pt-[32px] shadow-[0_10px_16px_0_rgba(0,0,0,0.08)] tablet:max-w-[420px] tablet:px-[32px] tablet:pb-[32px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onKeepEditing}
                    className="absolute right-[16px] top-[16px] flex size-[32px] items-center justify-center rounded-full transition-colors hover:bg-[#f2f2f3] tablet:size-[40px]"
                    aria-label="Close"
                >
                    <X color="black" size={24} className="tablet:hidden" />
                    <X color="black" size={28} className="hidden tablet:block" />
                </button>

                {/* Illustration */}
                <div className="relative w-[143px] h-[120px] tablet:h-[156px] tablet:w-[186px]">
                    <Image
                        src="/assets/progress-lost.png"
                        alt="Progress will be lost"
                        fill
                        className="object-contain"
                    />
                </div>

                {/* Title */}
                <h2 className="pt-[16px] text-center j-h7 font-semibold text-[#080606] tablet:pt-[24px]">
                    Your progress will be lost
                </h2>

                {/* Description */}
                <p className="mt-[4px] max-w-[288px] text-center text-[#6a696c] j-t3 tablet:max-w-[312px]">
                    You&apos;ve already uploaded a photo and set your preferences. Going back to templates will clear them.
                </p>

                {/* Buttons - desktop: side by side, mobile: stacked (Keep editing first) */}
                <div className="mt-[24px] flex w-full flex-col-reverse gap-[8px] tablet:flex-row tablet:justify-center items-center">
                    <button
                        onClick={onBackToTemplates}
                        className="flex h-[44px] w-[262px] tablet:w-[180px] items-center justify-center rounded-[23px] border border-[#e8e8e8] bg-white text-[#080606] transition-colors hover:bg-[#f8f8f8] j-t2 font-medium tablet:w-[180px]"
                    >
                        Back to templates
                    </button>
                    <button
                        onClick={onKeepEditing}
                        className="flex h-[44px] w-[262px] tablet:w-[180px] items-center justify-center rounded-[23px] bg-[#EC2E2E] text-white transition-colors hover:bg-[#d92727] j-t2 font-medium tablet:w-[180px]"
                    >
                        Keep editing
                    </button>
                </div>
            </div>
        </div>
    );
}
