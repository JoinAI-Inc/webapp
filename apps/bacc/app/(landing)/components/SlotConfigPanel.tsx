"use client";

import { useState } from "react";
import { Upload, X, UserSearch, Shuffle, Sparkles, Image as ImageIcon, Loader2, LogIn, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useUsage } from "@/contexts/UsageContext";

interface Slot {
    id: string;
    refId: string;
    slotType: 'PERSON' | 'OOTD' | 'DECORATION';
    label: string;
    description: string | null;
}

// 文件 → base64 data URL
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 轮询任务状态（用 taskId 精准查询，最多等待 10 分钟）
async function pollTaskStatus(taskId: string, maxAttempts = 120, intervalMs = 5000): Promise<{
    status: string;
    result?: { imageUrl?: string; fileId?: string };
    error?: string;
}> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs));
        const res = await fetch(`/api/queue/status?taskId=${taskId}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === 'completed' || data.status === 'failed') {
            return data;
        }
    }
    return { status: 'timeout', error: 'Generation timed out' };
}

// 余额不足弹窗
function NoCreditsModal({ onClose, remainingCount }: { onClose: () => void; remainingCount: number }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart size={28} className="text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {remainingCount === 0 ? "Counts Exhausted" : "Insufficient Counts"}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        You have <span className="font-bold text-orange-500">{remainingCount}</span> generation counts remaining.
                        Purchase more to continue creating stunning AI photos.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <a
                        href="/subscribe"
                        className="w-full py-3 px-6 bg-[#1a1a1a] text-white text-center rounded-full font-bold hover:bg-black transition-colors"
                    >
                        Buy Counts
                    </a>
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-6 border border-gray-200 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SlotConfigPanel({
    templateId,
    slots,
    onTaskSubmitted,
}: {
    templateId: string;
    slots: Slot[];
    onTaskSubmitted?: (taskId: string) => void;
}) {
    const [uploads, setUploads] = useState<Record<string, { preview: string; base64: string } | null>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [showNoCredits, setShowNoCredits] = useState(false);
    const [submittedTaskId, setSubmittedTaskId] = useState<string | null>(null);
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

    const getSlotIcon = (type: string) => {
        switch (type) {
            case 'PERSON': return <UserSearch size={20} className="text-blue-500" />;
            case 'OOTD': return <Shuffle size={20} className="text-purple-500" />;
            case 'DECORATION': return <Sparkles size={20} className="text-pink-500" />;
            default: return <ImageIcon size={20} className="text-gray-500" />;
        }
    };

    // 仅 PERSON 槽位为必填，OOTD / DECORATION 可选
    const personSlots = slots.filter(s => s.slotType === 'PERSON');
    const isReadyToGenerate = personSlots.length === 0 || personSlots.every(s => uploads[s.id] != null);

    const FEATURE_KEY = 'bacc_generation';
    // 找 bacc_generation 对应的余额
    const baccBalance = balances.find(b => b.feature.featureKey === FEATURE_KEY);
    const totalRemaining = baccBalance?.remainingCount ?? 0;

    const handleGenerate = async () => {
        if (!isReadyToGenerate || loading) return;

        setLoading(true);
        setError(null);
        setResultImage(null);

        // 保存上传数据快照，切换 UI 后仍可发请求
        const uploadsSnapshot = { ...uploads };

        // ✅ 立即切换到 brewing UI，不等余额检查
        setSubmittedTaskId('pending');
        setUploads({});

        try {
            // 已登录 → 检查 bacc_generation 余额
            if (session) {
                await refreshBalances();
                const access = await checkAccess(FEATURE_KEY);
                if (!access.hasAccess) {
                    setShowNoCredits(true);
                    setSubmittedTaskId(null);
                    setUploads(uploadsSnapshot);
                    setLoading(false);
                    return;
                }
            }

            const slotsPayload = slots
                .filter(slot => uploadsSnapshot[slot.id] != null)
                .map(slot => ({
                    refId: slot.refId,
                    slotType: slot.slotType,
                    imageSource: uploadsSnapshot[slot.id]!.base64,
                }));

            const submitRes = await fetch('/api/generate/template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId, slots: slotsPayload }),
            });

            if (!submitRes.ok) {
                const err = await submitRes.json();
                setSubmittedTaskId(null);
                setUploads(uploadsSnapshot);
                throw new Error(err.error || 'Failed to submit task');
            }

            const { taskId } = await submitRes.json();
            if (!taskId) throw new Error('No taskId returned from server');

            setSubmittedTaskId(taskId);
            onTaskSubmitted?.(taskId);

            // 后台轮询，完成后显示结果图
            pollTaskStatus(taskId).then(pollResult => {
                if (pollResult.status === 'completed' && pollResult.result?.imageUrl) {
                    setResultImage(pollResult.result.imageUrl);
                    setSubmittedTaskId(null);
                }
            });
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* 余额不足弹窗 */}
            {showNoCredits && (
                <NoCreditsModal
                    remainingCount={totalRemaining}
                    onClose={() => setShowNoCredits(false)}
                />
            )}

            {/* 结果图展示 */}
            {resultImage && (
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                    <p className="text-center text-sm text-gray-500 py-2">✅ Generation complete</p>
                    <div className="relative w-full aspect-[2/3]">
                        <Image src={resultImage} alt="Generated result" fill className="object-cover" />
                    </div>
                    <div className="flex gap-3 p-4">
                        <a
                            href={resultImage}
                            download
                            className="flex-1 py-2 px-4 bg-[#1a1a1a] text-white text-center rounded-full text-sm font-semibold hover:bg-black"
                        >
                            Download
                        </a>
                        <button
                            onClick={() => { setResultImage(null); setUploads({}); }}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-full text-sm font-semibold hover:bg-gray-50"
                        >
                            Generate Again
                        </button>
                    </div>
                </div>
            )}

            {/* 已提交：One More 提示卡片 */}
            {submittedTaskId && !resultImage && (
                <div className="rounded-2xl border border-[#FF3F2A]/30 bg-orange-50/50 p-6 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Loader2 size={18} className="text-[#FF3F2A] animate-spin" />
                        <p className="text-sm font-semibold text-gray-800">✨ Your LuckyFoto is brewing!</p>
                    </div>
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                        This may take 30–60 seconds and will automatically appear in your gallery below.
                        <br />Feel free to keep creating — we&apos;ll let you know when it&apos;s done.
                    </p>
                    <button
                        onClick={() => setSubmittedTaskId(null)}
                        className="mt-1 px-6 py-2.5 bg-[#1a1a1a] text-white rounded-full text-sm font-bold hover:bg-black transition-all hover:-translate-y-0.5 shadow-md"
                    >
                        One More ✨
                    </button>
                </div>
            )}

            {/* Slot 配置（未提交且无结果图时显示） */}
            {!resultImage && !submittedTaskId && (
                <>
                    {slots.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-2xl">
                            No configuration needed for this template.
                        </div>
                    ) : (
                        slots.map((slot) => (
                            <div key={slot.id} className="border border-gray-100 bg-gray-50/50 p-5 rounded-2xl flex flex-col sm:flex-row gap-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getSlotIcon(slot.slotType)}
                                        <h3 className="font-bold text-gray-900 text-lg">{slot.label}</h3>
                                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-200 text-gray-700 rounded-full tracking-wider uppercase">
                                            {slot.slotType}
                                        </span>
                                        {slot.slotType !== 'PERSON' && (
                                            <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-400 rounded-full">
                                                Optional
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4">
                                        {slot.description || `Upload an image for ${slot.label.toLowerCase()}`}
                                    </p>

                                    <div className="relative">
                                        {!uploads[slot.id] ? (
                                            <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                                    <p className="mb-2 text-sm text-gray-500">
                                                        <span className="font-semibold text-[#FF3F2A]">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-400">PNG, JPG, WebP up to 10MB</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                                    onChange={(e) => handleFileChange(slot.id, e.target.files?.[0] || null)}
                                                />
                                            </label>
                                        ) : (
                                            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
                                                <Image
                                                    src={uploads[slot.id]!.preview}
                                                    alt={slot.label}
                                                    fill
                                                    className="object-contain"
                                                />
                                                <button
                                                    onClick={() => handleFileChange(slot.id, null)}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* 错误提示 */}
                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-3 px-4">{error}</p>
                    )}

                    {/* 生成按钮区域 */}
                    {sessionStatus !== 'loading' && !session ? (
                        // 未登录：引导登录
                        <button
                            className="mt-4 w-full py-4 px-6 rounded-full text-lg font-bold transition-all flex justify-center items-center gap-2 bg-[#1a1a1a] text-white hover:bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            onClick={() => signIn('google', { callbackUrl: pathname })}
                        >
                            <LogIn size={20} />
                            Login to Generate
                        </button>
                    ) : (
                        // 已登录：正常生成（含次数检查）
                        <div className="flex flex-col gap-2">
                            {/* 余额标签 */}
                            {session && balances.length > 0 && (
                                <p className="text-center text-sm text-gray-400">
                                    {totalRemaining > 0
                                        ? <><span className="font-semibold text-gray-700">{totalRemaining}</span> counts remaining</>
                                        : <span className="text-orange-500 font-medium">No counts — <a href="/subscribe" className="underline">buy more</a></span>
                                    }
                                </p>
                            )}
                            <button
                                className={`mt-2 w-full py-4 px-6 rounded-full text-lg font-bold transition-all flex justify-center items-center gap-2 ${isReadyToGenerate && !loading
                                    ? "bg-[#1a1a1a] text-white hover:bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                disabled={!isReadyToGenerate || loading}
                                onClick={handleGenerate}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Generate Now
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {loading && (
                        <p className="text-center text-sm text-gray-400">This may take 30–60 seconds…</p>
                    )}
                </>
            )}
        </div>
    );
}
