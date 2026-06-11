"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { SlotConfigPanel } from "./SlotConfigPanel";
import { TemplateDetailSkeleton } from "./Skeletons";
import { ProgressLostModal } from "./ProgressLostModal";

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
    favoriteCount: number;
    isFavorited?: boolean;
    generationFeatureKey?: string | null;
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
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showProgressLostModal, setShowProgressLostModal] = useState(false);
    const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);
    const originalStateRef = useRef<any>(null);
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const isAuthenticated = sessionStatus === "authenticated";

    const handleDirtyChange = useCallback((dirty: boolean) => {
        setIsDirty(dirty);
    }, []);

    const handleBackClick = () => {
        if (isDirty) {
            setPendingLeaveAction(() => onBack);
            setShowProgressLostModal(true);
        } else {
            onBack();
        }
    };

    const handleKeepEditing = () => {
        setShowProgressLostModal(false);
        setPendingLeaveAction(null);
    };

    // 浏览器级别拦截：刷新、关闭标签页、浏览器前进后退
    useEffect(() => {
        if (!isDirty) return;

        // 1. 刷新和关闭标签页拦截
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // 2. 浏览器前进后退（SPA 内部 popstate）拦截
        const originalState = window.history.state;
        originalStateRef.current = originalState;

        // 保证 originalState 有 myIndex = 1
        if (!originalState || originalState.myIndex === undefined) {
            window.history.replaceState({ ...originalState, myIndex: 1 }, "");
        }

        // push dummy state，并设置 myIndex = 2, blocked = true
        if (window.history.state?.blocked !== true) {
            window.history.pushState({ ...originalState, myIndex: 2, blocked: true }, "");
        }

        const handlePopState = () => {
            const currentState = window.history.state;
            if (!currentState || currentState.blocked !== true) {
                const isNavigatingBack = currentState && currentState.myIndex === 1;

                // 立即同步拉回位置 2，阻止 Next.js 卸载组件
                if (isNavigatingBack) {
                    window.history.go(1);
                } else {
                    window.history.go(-1);
                }

                // 被前进后退离开时，弹出我们的自定义 React 弹窗
                setPendingLeaveAction(() => {
                    return () => {
                        window.removeEventListener("beforeunload", handleBeforeUnload);
                        setIsDirty(false);
                        // 确认后，退回真实的路由页面
                        if (isNavigatingBack) {
                            window.history.go(-2);
                        } else {
                            window.history.go(1);
                        }
                    };
                });
                setShowProgressLostModal(true);
            }
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
            // 如果组件卸载或 dirty 状态重置，且仍在 dummy 拦截状态，悄悄移除它
            if (window.history.state && window.history.state.blocked === true) {
                window.history.back();
            }
        };
    }, [isDirty]);

    useEffect(() => {
        if (sessionStatus === "loading") return;

        setLoading(true);
        setTemplate(null);
        setGeneratedImageUrl(null);
        fetch(`/api/templates/${templateId}`)
            .then((r) => r.json())
            .then((data) => setTemplate({ ...data, isFavorited: isAuthenticated ? data.isFavorited : false }))
            .finally(() => setLoading(false));
    }, [templateId, isAuthenticated, sessionStatus]);

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

    const displayImageUrl = generatedImageUrl || template.imageUrl;
    const handleTaskSubmitted = (taskId: string) => {
        setGeneratedImageUrl(null);
        onTaskSubmitted?.(taskId);
    };
    const handleFavorite = async () => {
        if (sessionStatus === "loading" || favoriteLoading) return;

        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        setFavoriteLoading(true);
        try {
            const res = await fetch(`/api/templates/${template.id}/favorite`, {
                method: "POST",
            });

            if (res.status === 401) {
                router.push("/login");
                return;
            }

            if (!res.ok) return;

            const data = await res.json();
            setTemplate(prev => {
                if (!prev) return prev;
                const nextIsFavorited = !!data.isFavorited;
                return {
                    ...prev,
                    isFavorited: nextIsFavorited,
                    favoriteCount: nextIsFavorited
                        ? prev.favoriteCount + 1
                        : Math.max(0, prev.favoriteCount - 1),
                };
            });
        } catch {
            // Keep the current favorite state if the request fails.
        } finally {
            setFavoriteLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[1280px] pt-[24px] tablet:pt-[32px] flex items-center flex-col">
            {/* Header: Desktop & Tablet shows Title here. Mobile only shows Back & Stats */}
            <div className="w-[92vw] mb-[14px] max-w-[1280px] flex items-center justify-between gap-[6px] tablet:justify-start">
                <div className="flex min-w-[0px] items-center gap-[16px]">
                    <button
                        onClick={handleBackClick}
                        className="flex shrink-0 items-center gap-[4px] rounded-[16px] border border-[#f2f2f3] px-[12px] py-[6px] text-[#080606] transition-colors hover:bg-[#f8f8f8]"
                    >
                        <ArrowLeft size={16} />
                        <span className="j-t3">Back</span>
                    </button>
                    <p className="hidden truncate text-[#080606] tablet:block j-h6 text-center">
                        {template.name}
                    </p>
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
                            <span>{template.favoriteCount ?? 0}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={`flex size-[28px] cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-default ${template.isFavorited
                            ? "bg-[#fef2f2] text-[#EC2E2E] hover:bg-[#fcdada]"
                            : "bg-[#f2f2f3] text-[#6a696c] hover:bg-[#e8e8e8]"
                            }`}
                        aria-label={template.isFavorited ? "Unfavorite template" : "Favorite template"}
                        aria-pressed={template.isFavorited ? true : false}
                        disabled={sessionStatus === "loading" || favoriteLoading}
                        onClick={handleFavorite}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_273_8257)">
                                <path d="M10.0001 17.6399C9.80007 17.6399 9.60007 17.5899 9.43007 17.4899C8.63007 17.0199 1.57007 12.7699 1.57007 7.56992C1.57007 5.15992 3.31007 2.66992 6.23007 2.66992C7.71007 2.66992 9.08007 3.25992 10.0001 4.26992C10.9201 3.26992 12.2901 2.66992 13.7701 2.66992C16.6901 2.66992 18.4301 5.15992 18.4301 7.56992C18.4301 12.7799 11.3701 17.0299 10.5701 17.4899C10.4001 17.5899 10.2001 17.6399 10.0001 17.6399ZM6.23007 4.00992C4.16007 4.00992 2.92007 5.80992 2.92007 7.55992C2.92007 11.7699 9.09007 15.6899 10.0001 16.2499C10.9101 15.6899 17.0801 11.7699 17.0801 7.55992C17.0801 5.81992 15.8401 4.00992 13.7701 4.00992C12.4101 4.00992 11.1901 4.66992 10.5901 5.72992C10.3501 6.14992 9.66007 6.14992 9.42007 5.72992C8.81007 4.66992 7.60007 4.00992 6.24007 4.00992H6.23007Z" fill={template.isFavorited ? "#EC2E2E" : "#22252A"} />
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
            <div className="grid grid-cols-1 desktop:grid-cols-[calc(40%-16px)_60%] gap-[16px] items-start w-full tablet:w-[92vw] max-w-[1280px]">
                <div className="max-w-[1280px] relative left-1/2 w-[92vw] -translate-x-1/2 desktop:sticky desktop:left-auto desktop:top-[24px] desktop:w-full desktop:translate-x-[0px]">
                    <div className="flex w-full justify-center desktop:block">
                        <div className="relative inline-flex max-w-full overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-[#f2f2f3] p-[12px] tablet:flex tablet:h-[360px] tablet:w-full tablet:items-center tablet:justify-center tablet:rounded-[8px] tablet:bg-white tablet:p-[16px] desktop:block desktop:h-auto">
                            <div className="relative inline-block overflow-hidden rounded-[4px] align-top tablet:h-[328px] desktop:block desktop:h-auto desktop:w-full">
                                <Image
                                    src={displayImageUrl}
                                    alt={generatedImageUrl ? `${template.name} generated result` : template.name}
                                    width={474}
                                    height={706}
                                    className="block h-auto max-h-[296px] w-auto max-w-[calc(92vw-24px)] object-contain tablet:h-full tablet:max-h-none tablet:max-w-none desktop:h-auto desktop:w-full"
                                    priority
                                />
                                {!isGenerating && !generatedImageUrl && template.slots.filter(slot => slot.slotType === "PERSON").slice(0, 4).map((slot, index) => {
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
                                {!isGenerating && generatedImageUrl && (
                                    <>
                                        <div className="absolute left-[8px] top-[8px] flex h-[25px] items-center justify-center rounded-[4px] bg-[#080606]/70 px-[8px] text-[12px] font-normal leading-[1.4] tracking-[0.12px] text-white">
                                            Generation complete
                                        </div>
                                        <a
                                            href={generatedImageUrl}
                                            download
                                            className="absolute bottom-[8px] right-[8px] flex h-[32px] items-center justify-center rounded-[16px] bg-[#ec2e2e] px-[14px] text-[13px] font-medium leading-[1.4] tracking-[0.13px] text-white transition-opacity hover:opacity-90"
                                        >
                                            Download
                                        </a>
                                    </>
                                )}
                                {isGenerating && (
                                    <>
                                        <div className="generation-preview-visual absolute inset-0 rounded-[4px]" aria-hidden="true" />
                                        <div className="absolute inset-0 rounded-[4px] bg-[#080606]/[0.03]" aria-hidden="true" />
                                        <div className="absolute left-[4px] top-[4px] flex h-[25px] w-[104px] items-center justify-center gap-[6px] rounded-[4px] bg-[#ec2e2e] px-[8px] text-[12px] font-normal leading-[1.4] tracking-[0.12px] text-white tablet:left-[8px] tablet:top-[8px]">
                                            <span className="size-[6px] rounded-full bg-white/90 animate-pulse" aria-hidden="true" />
                                            Generating
                                        </div>
                                        <div className="absolute left-1/2 top-1/2 flex w-[75%] max-w-[354px] -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-[8px] tablet:gap-[12px]">
                                            <p className="w-full j-h7 text-white tablet:j-h6">
                                                ✨ Your LuckyFoto is brewing！
                                            </p>
                                            <div className="flex w-full flex-col gap-[4px] j-t2 text-[#f2f2f3] tablet:gap-[8px]">
                                                <p>
                                                    It&apos;ll be ready in about&nbsp;30 seconds&nbsp;and automatically saved to{" "}
                                                    <Link href="/gallery" className="j-t2 tablet:j-l1 text-[#ffc107] underline underline-offset-[2px] transition-opacity hover:opacity-80">
                                                        My Gallery
                                                    </Link>.
                                                </p>
                                                <p>Feel free to keep creating—we&apos;ll notify you when it&apos;s done.</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="tablet:hidden w-full py-[16px] text-center">
                        <p className="text-[22px] font-bold text-gray-900 leading-tight">{template.name}</p>
                    </div>
                </div>

                <SlotConfigPanel
                    templateId={template.id}
                    generationFeatureKey={template.generationFeatureKey}
                    slots={template.slots}
                    onTaskSubmitted={handleTaskSubmitted}
                    onGeneratingChange={setIsGenerating}
                    onGenerationComplete={setGeneratedImageUrl}
                    onDirtyChange={handleDirtyChange}
                />
            </div>


            {showProgressLostModal && (
                <ProgressLostModal
                    onKeepEditing={handleKeepEditing}
                    onBackToTemplates={() => {
                        setShowProgressLostModal(false);
                        if (pendingLeaveAction) {
                            pendingLeaveAction();
                            setPendingLeaveAction(null);
                        } else {
                            onBack();
                        }
                    }}
                />
            )}
        </div>
    );
}
