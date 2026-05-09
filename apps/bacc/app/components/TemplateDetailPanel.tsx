"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SlotConfigPanel } from "./SlotConfigPanel";
import { TemplateDetailSkeleton } from "./Skeletons";

interface Slot {
    id: string;
    refId: string;
    slotType: "PERSON" | "OOTD" | "DECORATION";
    label: string;
    description: string | null;
}

interface TemplateDetail {
    id: string;
    name: string;
    imageUrl: string;
    slots: Slot[];
}

export function TemplateDetailPanel({
    templateId,
    onBack,
    onTaskSubmitted,
}: {
    templateId: string;
    onBack: () => void;
    onTaskSubmitted?: (taskId: string) => void;
}) {
    const [template, setTemplate] = useState<TemplateDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setTemplate(null);
        fetch(`/api/templates/${templateId}`)
            .then((r) => r.json())
            .then((data) => setTemplate(data))
            .finally(() => setLoading(false));
    }, [templateId]);

    if (loading) {
        return <TemplateDetailSkeleton showBackButton onBack={onBack} />;
    }

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Template not found</p>
                <button onClick={onBack} className="mt-[16px] text-sm underline">Go back</button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1280px] px-[16px] tablet:px-[24px] py-[24px] tablet:py-[32px] mx-auto">
            {/* Header: Desktop & Tablet shows Title here. Mobile only shows Back & Stats */}
            <div className="mb-[14px] flex items-center justify-between gap-[6px] tablet:justify-start">
                <div className="flex min-w-[0px] items-center gap-[16px]">
                    <button
                        onClick={onBack}
                        className="flex shrink-0 items-center gap-[4px] rounded-[16px] border border-[#f2f2f3] px-[12px] py-[6px] text-[#080606] transition-colors hover:bg-[#f8f8f8]"
                    >
                        <ArrowLeft size={16} />
                        <span className="j-t3">Back</span>
                    </button>
                    <h1 className="hidden truncate text-[#080606] tablet:block j-h6 text-center">
                        {template.name}
                    </h1>
                </div>

                <div className="flex shrink-0 items-center gap-[10px] tablet:gap-[6px]">
                    <div className="flex shrink-0 items-center gap-[6px] text-[#6a696c] j-t3">
                        <div className="hidden tablet:block">
                            ·
                        </div>
                        <div className="flex items-center j-t3 text-[#EC2E2E]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M5.5 15.1751C2.47 15.1751 0 12.7051 0 9.67513C0 8.16513 0.63 6.70513 1.73 5.67513C1.83 5.58513 1.94 5.48513 2.06 5.38513C3.01 4.54513 4.44 3.28513 4.18 0.745134C4.15 0.485134 4.28 0.235134 4.5 0.095134C4.72 -0.0348659 5 -0.034866 5.22 0.115134C7.11 1.37513 9.31 3.11513 9.53 5.36513C9.62 6.31513 9.38 7.27514 8.78 8.26513C9 8.09513 9.25 7.87513 9.51 7.61513C9.67 7.45513 9.91 7.38513 10.14 7.43513C10.37 7.48513 10.55 7.65513 10.62 7.87513C10.79 8.35513 10.98 8.99514 10.98 9.68513C10.98 12.7151 8.51 15.1851 5.48 15.1851L5.5 15.1751ZM5.53 1.97513C5.29 4.31513 3.81 5.62513 2.95 6.38513C2.84 6.48513 2.74 6.56513 2.65 6.65513C1.82 7.43513 1.34 8.53513 1.34 9.67513C1.34 11.9651 3.2 13.8251 5.49 13.8251C7.78 13.8251 9.64 11.9651 9.64 9.67513C9.64 9.55513 9.64 9.43513 9.62 9.31513C8.29 10.3451 7.37 10.3451 6.78 10.3451C6.51 10.3451 6.26 10.1851 6.16 9.92513C6.06 9.66513 6.11 9.38513 6.31 9.18513C7.69 7.80513 8.31 6.59513 8.2 5.48513C8.09 4.37513 7.26 3.26513 5.53 1.96513V1.97513Z" fill="#EC2E2E" />
                            </svg>
                            <span>123</span>
                        </div>
                    </div>

                    <button className="flex size-[28px] items-center justify-center rounded-full bg-[#f2f2f3] text-[#6a696c] transition-colors hover:bg-[#e8e8e8]" aria-label="Favorite template">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_273_8257)">
                                <path d="M10.0001 17.6399C9.80007 17.6399 9.60007 17.5899 9.43007 17.4899C8.63007 17.0199 1.57007 12.7699 1.57007 7.56992C1.57007 5.15992 3.31007 2.66992 6.23007 2.66992C7.71007 2.66992 9.08007 3.25992 10.0001 4.26992C10.9201 3.26992 12.2901 2.66992 13.7701 2.66992C16.6901 2.66992 18.4301 5.15992 18.4301 7.56992C18.4301 12.7799 11.3701 17.0299 10.5701 17.4899C10.4001 17.5899 10.2001 17.6399 10.0001 17.6399ZM6.23007 4.00992C4.16007 4.00992 2.92007 5.80992 2.92007 7.55992C2.92007 11.7699 9.09007 15.6899 10.0001 16.2499C10.9101 15.6899 17.0801 11.7699 17.0801 7.55992C17.0801 5.81992 15.8401 4.00992 13.7701 4.00992C12.4101 4.00992 11.1901 4.66992 10.5901 5.72992C10.3501 6.14992 9.66007 6.14992 9.42007 5.72992C8.81007 4.66992 7.60007 4.00992 6.24007 4.00992H6.23007Z" fill="#22252A" />
                            </g>
                            <defs>
                                <clipPath id="clip0_273_8257">
                                    <rect width="20" height="20" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>

                    </button>
                </div>
            </div>

            {/* Content Structure */}
            <div className="grid grid-cols-1 desktop:grid-cols-[506px_minmax(0,758px)] gap-[16px] items-start bg-black">
                <div className="relative left-1/2 w-[92vw] -translate-x-1/2 desktop:sticky desktop:left-auto desktop:top-[24px] desktop:w-full desktop:translate-x-[0px]">
                    <div className="flex w-full justify-center desktop:block">
                        <div className="relative inline-flex max-w-full overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-[#f2f2f3] p-[12px] tablet:flex tablet:h-[360px] tablet:w-full tablet:items-center tablet:justify-center tablet:rounded-[8px] tablet:bg-white tablet:p-[16px] desktop:block desktop:h-auto">
                            <div className="relative inline-block overflow-hidden rounded-[4px] align-top tablet:h-[328px] desktop:block desktop:h-auto desktop:w-full">
                                <Image
                                    src={template.imageUrl}
                                    alt={template.name}
                                    width={474}
                                    height={706}
                                    className="block h-auto max-h-[296px] w-auto max-w-[calc(92vw-24px)] object-contain tablet:h-full tablet:max-h-none tablet:max-w-none desktop:h-auto desktop:w-full"
                                    priority
                                />
                                {template.slots.filter(slot => slot.slotType === "PERSON").slice(0, 4).map((slot, index) => {
                                    const markerPositions = [
                                        "left-[28%] top-[25%]",
                                        "left-[73%] top-[24%]",
                                        "left-[66%] top-[44%]",
                                        "left-[52%] top-[72%]",
                                    ];
                                    const markerColors = ["#8364ff", "#ff50f7", "#ff7843", "#26c436"];
                                    return (
                                        <div
                                            key={slot.id}
                                            className={`absolute flex size-[28px] items-center justify-center rounded-full border-2 border-white text-center text-[17px] font-medium leading-[1.4] tracking-[0.17px] text-white ${markerPositions[index]}`}
                                            style={{ backgroundColor: markerColors[index] }}
                                        >
                                            {index + 1}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="tablet:hidden w-full mt-[20px] mb-[8px]">
                        <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{template.name}</h1>
                    </div>
                </div>

                <div className="w-full">
                    <SlotConfigPanel
                        templateId={template.id}
                        slots={template.slots}
                        onTaskSubmitted={onTaskSubmitted}
                    />
                </div>
            </div>
        </div>
    );
}
