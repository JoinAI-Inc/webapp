"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useUsage } from "@/contexts/UsageContext";
import { Slot, fileToBase64, pollTaskStatus } from "./slot-config/slot-config.types";
import { NoCreditsModal } from "./slot-config/NoCreditsModal";
import { PremiumFeatureSubscribeBanner } from "./slot-config/PremiumBanner";
import { UploadWidget } from "./slot-config/UploadWidget";
import { AssetSelectionWidget } from "./slot-config/AssetSelectionWidget";
import { buildConfiguredSlots } from "./slot-config/configured-slots";
import { findActiveTemplateTask } from "./slot-config/task-recovery";

const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || "https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image").replace(/\/$/, "");
const actionButtonClassName = "flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[23px] px-[18px] j-t2 text-white tablet:w-auto tablet:min-w-[116px] tablet:px-[20px] max-w-[400px] self-center tablet:self-start";

export function SlotConfigPanel({
    templateId,
    generationFeatureKey: configuredTemplateFeatureKey,
    slots,
    onTaskSubmitted,
    onGeneratingChange,
    onGenerationComplete,
    onDirtyChange,
}: {
    templateId: string;
    generationFeatureKey?: string | null;
    slots: Slot[];
    onTaskSubmitted?: (taskId: string) => void;
    onGeneratingChange?: (isGenerating: boolean) => void;
    onGenerationComplete?: (imageUrl: string) => void;
    onDirtyChange?: (isDirty: boolean) => void;
}) {
    const [uploads, setUploads] = useState<Record<string, { preview: string; base64: string } | null>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNoCredits, setShowNoCredits] = useState(false);
    const [submittedTaskId, setSubmittedTaskId] = useState<string | null>(null);
    const [activeSlotId, setActiveSlotId] = useState<string | null>(slots[0]?.id || null);
    const [selectedAssets, setSelectedAssets] = useState<Record<string, string>>({});
    const [genders, setGenders] = useState<Record<string, string>>({});
    const [makeups, setMakeups] = useState<Record<string, string>>({});
    const activeTaskIdRef = useRef<string | null>(null);

    // Report dirty state: any upload present, non-default asset selected, or gender/makeup changed from defaults
    useEffect(() => {
        const hasUploads = Object.values(uploads).some(v => v != null);
        const hasSelectedAssets = Object.keys(selectedAssets).length > 0;
        const hasChangedGenders = Object.values(genders).some(v => v !== 'Feminine');
        const hasChangedMakeups = Object.values(makeups).some(v => v !== 'Need');
        onDirtyChange?.(hasUploads || hasSelectedAssets || hasChangedGenders || hasChangedMakeups);
    }, [uploads, selectedAssets, genders, makeups, onDirtyChange]);
    const submitInFlightRef = useRef(false);

    const pathname = usePathname();
    const { data: session, status: sessionStatus } = useSession();
    const { balances, checkAccess, refreshBalances } = useUsage();

    const handleFileChange = async (slotId: string, file: File | null) => {
        if (!file) {
            setUploads(prev => ({ ...prev, [slotId]: null }));
            return;
        }
        const base64 = await fileToBase64(file);
        setUploads(prev => ({ ...prev, [slotId]: { preview: base64, base64 } }));
    };

    // 仅 PERSON 槽位为必填，OOTD / DECORATION 可选
    const personSlots = slots.filter(s => s.slotType === 'PERSON');
    const isReadyToGenerate = personSlots.length === 0 || personSlots.every(s => uploads[s.id] != null);

    const generationFeatureKey = configuredTemplateFeatureKey || "";
    const generationBalance = generationFeatureKey
        ? balances.find(b => b.feature.featureKey === generationFeatureKey)
        : null;
    const totalRemaining = generationBalance?.remainingCount ?? 0;

    const ootdSlots = slots.filter(s => s.slotType === 'OOTD');
    const decorationSlots = slots.filter(s => s.slotType === 'DECORATION');
    const isBrewing = !!submittedTaskId;

    const selectedPremiumFeatures = useMemo(() => {
        const features = new Map<string, string>();

        Object.entries(selectedAssets).forEach(([slotId, assetId]) => {
            const slot = slots.find(s => s.id === slotId);
            const asset = slot?.assets?.find(a => a.id === assetId);
            if (asset?.requiredFeatureKey) {
                features.set(asset.requiredFeatureKey, asset.name);
            }
        });

        return Array.from(features.entries()).map(([featureKey, assetName]) => ({ featureKey, assetName }));
    }, [selectedAssets, slots]);

    const selectedPremiumFeatureKeys = useMemo(
        () => selectedPremiumFeatures.map(feature => feature.featureKey),
        [selectedPremiumFeatures]
    );
    const selectedPremiumFeatureSignature = selectedPremiumFeatureKeys.join("|");
    const currentUserKey = ((session as any)?.userId || session?.user?.email || "");
    const [premiumAssetAccess, setPremiumAssetAccess] = useState<Record<string, boolean>>({});
    const [checkingPremiumAssetAccess, setCheckingPremiumAssetAccess] = useState(false);

    useEffect(() => {
        let cancelled = false;

        if (selectedPremiumFeatureKeys.length === 0) {
            setPremiumAssetAccess({});
            setCheckingPremiumAssetAccess(false);
            return;
        }

        if (sessionStatus === 'loading') {
            setCheckingPremiumAssetAccess(true);
            return;
        }

        if (!session) {
            setPremiumAssetAccess(Object.fromEntries(selectedPremiumFeatureKeys.map(featureKey => [featureKey, false])));
            setCheckingPremiumAssetAccess(false);
            return;
        }

        setCheckingPremiumAssetAccess(true);
        Promise.all(
            selectedPremiumFeatureKeys.map(async (featureKey) => {
                const access = await checkAccess(featureKey);
                return [featureKey, access.hasAccess] as const;
            })
        ).then((entries) => {
            if (cancelled) return;
            setPremiumAssetAccess(Object.fromEntries(entries));
        }).finally(() => {
            if (!cancelled) setCheckingPremiumAssetAccess(false);
        });

        return () => {
            cancelled = true;
        };
    }, [selectedPremiumFeatureSignature, sessionStatus, currentUserKey, session, checkAccess, selectedPremiumFeatureKeys]);

    useEffect(() => {
        onGeneratingChange?.(isBrewing);
    }, [isBrewing, onGeneratingChange]);

    useEffect(() => {
        if (sessionStatus !== 'authenticated' || !session || activeTaskIdRef.current) return;

        let cancelled = false;

        const restoreActiveTask = async () => {
            try {
                const response = await fetch('/api/queue/current-task', { cache: 'no-store' });
                if (!response.ok) return;

                const data = await response.json();
                const task = findActiveTemplateTask(data, templateId);
                if (!task || cancelled) return;

                setSubmittedTaskId(task.taskId);
                activeTaskIdRef.current = task.taskId;
                onTaskSubmitted?.(task.taskId);

                const pollResult = await pollTaskStatus(task.taskId);
                if (cancelled || activeTaskIdRef.current !== task.taskId) return;

                setSubmittedTaskId(null);
                activeTaskIdRef.current = null;

                if (pollResult.status === 'completed' && pollResult.result?.imageUrl) {
                    onGenerationComplete?.(pollResult.result.imageUrl);
                } else {
                    setError(pollResult.error || 'Generation failed. Please try again.');
                }
                await refreshBalances();
            } catch (restoreError: any) {
                if (!cancelled) {
                    console.error('[Generation Recovery] Failed to restore active task:', restoreError);
                }
            }
        };

        void restoreActiveTask();
        return () => {
            cancelled = true;
        };
    }, [
        templateId,
        sessionStatus,
        session,
        onTaskSubmitted,
        onGenerationComplete,
        refreshBalances,
    ]);

    const unauthenticatedPremiumFeatureKey = sessionStatus !== 'loading' && !session
        ? selectedPremiumFeatures[0]?.featureKey
        : undefined;
    const lockedPremiumFeatures = selectedPremiumFeatures.filter(feature => premiumAssetAccess[feature.featureKey] === false);
    const firstLockedPremiumFeatureKey = unauthenticatedPremiumFeatureKey ?? lockedPremiumFeatures[0]?.featureKey;
    const hasLockedPremiumAsset = !!firstLockedPremiumFeatureKey;
    const canGenerate = !!generationFeatureKey && isReadyToGenerate && !loading && !checkingPremiumAssetAccess && !hasLockedPremiumAsset;

    const handleAssetSelect = (slotId: string, assetId: string, requiredFeatureKey: string | null) => {
        // Selection stays responsive; access is checked immediately after state updates.
        setError(null);
        setSelectedAssets((prev) => {
            const current = prev[slotId];
            if (current === assetId) {
                // Deselect if already selected -> goes back to 'default'
                const newState = { ...prev };
                delete newState[slotId];
                return newState;
            }
            return { ...prev, [slotId]: assetId };
        });
    };

    const handleDefaultSelect = (slotId: string) => {
        setSelectedAssets(prev => {
            const newState = { ...prev };
            delete newState[slotId];
            return newState;
        });
    };

    const handleGenerate = async () => {
        if (submitInFlightRef.current) return;
        if (!isReadyToGenerate || loading || checkingPremiumAssetAccess) return;
        if (hasLockedPremiumAsset) {
            setError('This premium feature requires top up before generating.');
            return;
        }

        submitInFlightRef.current = true;
        setLoading(true);
        setError(null);

        // 保存上传数据快照，切换 UI 后仍可发请求
        const uploadsSnapshot = { ...uploads };

        // ✅ 立即切换到 brewing UI，不等余额检查
        setSubmittedTaskId('pending');

        try {
            // 已登录 → 检查当前生成功能点余额
            if (session) {
                if (!generationFeatureKey) {
                    setError('This template is missing generation billing configuration.');
                    setSubmittedTaskId(null);
                    setUploads(uploadsSnapshot);
                    setLoading(false);
                    return;
                }
                const latestBalances = await refreshBalances();
                const latestBalance = latestBalances.find(b => b.feature.featureKey === generationFeatureKey);
                if (!latestBalance) {
                    setShowNoCredits(true);
                    setSubmittedTaskId(null);
                    setUploads(uploadsSnapshot);
                    setLoading(false);
                    return;
                }

                const access = await checkAccess(generationFeatureKey);
                if (!access.hasAccess) {
                    setShowNoCredits(true);
                    setSubmittedTaskId(null);
                    setUploads(uploadsSnapshot);
                    setLoading(false);
                    return;
                }
            }

            const configuredSlots = buildConfiguredSlots({
                slots,
                uploads: uploadsSnapshot,
                selectedAssets,
                genders,
                makeups,
            });

            const submitRes = await fetch('/api/generate/template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId, slots: configuredSlots }),
            });

            if (!submitRes.ok) {
                const err = await submitRes.json();
                setSubmittedTaskId(null);
                setUploads(uploadsSnapshot);
                throw new Error(err.error || 'Failed to submit task');
            }

            const { taskId } = await submitRes.json();
            if (!taskId) {
                setSubmittedTaskId(null);
                throw new Error('No taskId returned from server');
            }

            setSubmittedTaskId(taskId);
            activeTaskIdRef.current = taskId;
            submitInFlightRef.current = false;
            onTaskSubmitted?.(taskId);
            void refreshBalances();

            // 后台轮询，完成后显示结果图
            pollTaskStatus(taskId).then(async pollResult => {
                if (activeTaskIdRef.current !== taskId) return;

                if (pollResult.status === 'completed' && pollResult.result?.imageUrl) {
                    setSubmittedTaskId(null);
                    activeTaskIdRef.current = null;
                    onGenerationComplete?.(pollResult.result.imageUrl);
                    await refreshBalances();
                    return;
                }
                setSubmittedTaskId(null);
                activeTaskIdRef.current = null;
                setError(pollResult.error || 'Generation failed. Please try again.');
                await refreshBalances();
            }).catch(async (pollError) => {
                if (activeTaskIdRef.current !== taskId) return;
                setSubmittedTaskId(null);
                activeTaskIdRef.current = null;
                setError(pollError?.message || 'Generation failed. Please try again.');
                await refreshBalances();
            });
        } catch (err: any) {
            setSubmittedTaskId(null);
            activeTaskIdRef.current = null;
            submitInFlightRef.current = false;
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative w-full overflow-hidden bg-white flex flex-col items-center mb-0 tablet:mb-[24px]`}>
            {/* 余额不足弹窗 */}
            {showNoCredits && (
                <NoCreditsModal
                    remainingCount={totalRemaining}
                    onClose={() => setShowNoCredits(false)}
                />
            )}

            {/* Slot 配置 */}
            <div className="relative w-full overflow-hidden rounded-[8px] border-[#e8e8e8] bg-white pb-[16px] pt-[16px] tablet:border tablet:pb-[24px]">
                <div className={isBrewing ? "pointer-events-none select-none" : undefined} aria-disabled={isBrewing ? true : undefined} inert={isBrewing ? true : undefined}>
                    {slots.length === 0 ? (
                        <div className="py-[32px] text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No configuration needed for this template.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {firstLockedPremiumFeatureKey && (
                                <PremiumFeatureSubscribeBanner featureKey={firstLockedPremiumFeatureKey} />
                            )}

                            {/* Tabs Header */}
                            {personSlots.length > 0 && (
                                <div className="flex gap-[8px] overflow-x-auto scrollbar-hide px-[16px]">
                                    {personSlots.map((slot, index) => {
                                        const isActive = activeSlotId === slot.id || (activeSlotId === null && index === 0);
                                        return (
                                            <div
                                                key={slot.id}
                                                onClick={() => setActiveSlotId(slot.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setActiveSlotId(slot.id);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                className="relative shrink-0"
                                            >
                                                <UploadWidget
                                                    slot={slot}
                                                    index={index}
                                                    isActive={isActive}
                                                    upload={uploads[slot.id]}
                                                    onFileChange={handleFileChange}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Active Tab Content Area - The "Box" (For active PERSON slot) */}
                            {personSlots.length > 0 && activeSlotId && personSlots.some(s => s.id === activeSlotId) && (
                                <div className="mx-[16px] relative mt-[16px] flex min-h-[174px] flex-col rounded-[8px] border border-[#8364ff] bg-white py-[21px]">
                                    {/* The small connector arrow at the top */}
                                    <div
                                        className="hidden tablet:block absolute w-[14px] h-[14px] bg-white border-l border-t border-[#7A5AF8] transform rotate-45 transition-all duration-300 z-10"
                                        style={{
                                            top: '-8px',
                                            left: `${Math.max(0, personSlots.findIndex(s => s.id === activeSlotId)) * 146 + 62}px`
                                        }}
                                    ></div>

                                    <div className="flex-1">
                                        <div className="flex flex-col gap-[16px]">
                                            <div className="flex flex-col gap-[12px] tablet:flex-row tablet:items-center">
                                                <span className="w-[130px] shrink-0 whitespace-nowrap text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-[#39383b] px-[16px]">Protagonist gender</span>
                                                <div className="flex shrink-0 items-center gap-[8px] overflow-x-auto scrollbar-hide px-[16px]">
                                                    {['Feminine', 'Masculine', 'Furbaby'].map(opt => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setGenders(prev => ({ ...prev, [activeSlotId]: opt }))}
                                                            className={`rounded-[16px] px-[16px] py-[6px] text-[14px] leading-[1.4] tracking-[0.14px] whitespace-nowrap transition-colors ${(genders[activeSlotId] || 'Feminine') === opt
                                                                ? 'font-medium text-[#EC2E2E] bg-[#fef2f2] border border-[#fcdada]'
                                                                : 'font-normal text-[#6a696c] hover:text-[#080606] border border-transparent'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-[12px] tablet:flex-row tablet:items-center">
                                                <span className="px-[16px] w-[130px] shrink-0 whitespace-nowrap text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-[#39383b]">Makeup Look</span>
                                                <div className="flex shrink-0 items-center gap-[8px] px-[16px]">
                                                    {['Need', 'No need'].map(opt => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setMakeups(prev => ({ ...prev, [activeSlotId]: opt }))}
                                                            className={`rounded-[16px] px-[16px] py-[6px] text-[14px] leading-[1.4] tracking-[0.14px] whitespace-nowrap transition-colors ${(makeups[activeSlotId] || 'Need') === opt
                                                                ? 'font-medium text-[#EC2E2E] bg-[#fef2f2] border border-[#fcdada]'
                                                                : 'font-normal text-[#6a696c] hover:text-[#080606] border border-transparent'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-[16px] flex flex-col gap-[16px]">
                                            {(() => {
                                                const personIndex = personSlots.findIndex(s => s.id === activeSlotId);
                                                const currentOotd = ootdSlots[personIndex];
                                                if (!currentOotd) return null;
                                                return (
                                                    <div className="w-full">
                                                        <h3 className="px-[16px] pb-[6px] text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-[#39383b]">OOTD</h3>
                                                        <div>
                                                            <AssetSelectionWidget
                                                                slot={currentOotd}
                                                                showSidePadding
                                                                selectedAssets={selectedAssets}
                                                                onAssetSelect={handleAssetSelect}
                                                                onDefaultSelect={handleDefaultSelect}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fallback if no person slot but has OOTD isolated */}
                            {personSlots.length === 0 && ootdSlots.length > 0 && (
                                <div className="mt-[16px] flex flex-col gap-[24px]">
                                    {ootdSlots.map(slot => (
                                        <div key={slot.id} className="overflow-hidden">
                                            <h3 className="text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-[#39383b] pb-[6px]">{slot.label} (OOTD)</h3>
                                            <div>
                                                <AssetSelectionWidget
                                                    slot={slot}
                                                    showSidePadding={true}
                                                    selectedAssets={selectedAssets}
                                                    onAssetSelect={handleAssetSelect}
                                                    onDefaultSelect={handleDefaultSelect}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Divider & Global Decorate */}
                            {decorationSlots.length > 0 && (
                                <>
                                    <div className="my-[24px] h-px w-[calc(100%-32px)] bg-[#e8e8e8] mx-auto"></div>
                                    <div className="w-full">
                                        <h3 className="px-[16px] text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-[#39383b] pb-[6px]">Decorate</h3>
                                        <div>
                                            {decorationSlots.map(slot => (
                                                <div key={slot.id}>
                                                    <AssetSelectionWidget
                                                        slot={slot}
                                                        showSidePadding
                                                        selectedAssets={selectedAssets}
                                                        onAssetSelect={handleAssetSelect}
                                                        onDefaultSelect={handleDefaultSelect}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* 错误提示 */}
                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-[12px] px-[16px]">{error}</p>
                    )}
                </div>

                <div
                    data-slot-config-action-region
                    className="relative z-30 mt-[24px] flex w-full flex-col items-start gap-[8px] px-[16px] tablet:mt-[40px]"
                >
                    {isBrewing ? (
                        <button
                            className={`${actionButtonClassName} bg-cover bg-center transition-opacity hover:opacity-90`}
                            style={{ backgroundImage: `url("${IMAGE_URL}/assets/generation-one-more-bg.png")` }}
                            onClick={() => {
                                setSubmittedTaskId(null);
                                activeTaskIdRef.current = null;
                                setError(null);
                            }}
                        >
                            One More
                        </button>
                    ) : sessionStatus !== 'loading' && !session ? (
                        <button
                            className={`${actionButtonClassName} bg-[#EC2E2E]`}
                            onClick={() => signIn('google', { callbackUrl: pathname })}
                        >
                            <LogIn size={20} />
                            Login to Generate
                        </button>
                    ) : (
                        <>
                            {session && balances.length > 0 && (
                                <p className="text-[12px] text-[#9b9a9d]">
                                    {totalRemaining > 0
                                        ? <><span className="font-semibold text-gray-700">{totalRemaining}</span> counts remaining</>
                                        : <span className="text-[#F63E48] font-medium">No counts — <a href="/subscribe" className="underline">buy more</a></span>
                                    }
                                </p>
                            )}
                            <button
                                className={`${actionButtonClassName} ${canGenerate
                                    ? "bg-[#EC2E2E] hover:bg-[#d92727]"
                                    : "cursor-not-allowed bg-[#cccbce]"
                                    }`}
                                disabled={!canGenerate}
                                onClick={handleGenerate}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : checkingPremiumAssetAccess ? (
                                    "Checking access..."
                                ) : (
                                    "Generate"
                                )}
                            </button>
                        </>
                    )}
                </div>

                {loading && !isBrewing && (
                    <p className="text-center text-sm text-gray-400">This may take 30–60 seconds…</p>
                )}
            </div>
            {isBrewing && (
                <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]" ><div className="w-full tablet:w-[92vw] rounded-none tablet:rounded-[8px] h-full bg-[#080606]/[0.03]" /></div>
            )}
        </div>
    );
}
