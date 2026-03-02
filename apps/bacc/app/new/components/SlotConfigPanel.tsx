"use client";

import { useState } from "react";
import { Upload, X, UserSearch, Shuffle, Sparkles, Image as ImageIcon, Loader2, LogIn } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

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

// 轮询任务状态
async function pollTaskStatus(maxAttempts = 60, intervalMs = 3000): Promise<{
    status: string;
    result?: { imageUrl?: string; fileId?: string };
    error?: string;
}> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs));
        const res = await fetch('/api/queue/current-task');
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === 'completed' || data.status === 'failed') {
            return data;
        }
    }
    return { status: 'timeout', error: 'Generation timed out' };
}

export function SlotConfigPanel({ templateId, slots }: { templateId: string; slots: Slot[] }) {
    const [uploads, setUploads] = useState<Record<string, { preview: string; base64: string } | null>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status: sessionStatus } = useSession();

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

    const handleGenerate = async () => {
        if (!isReadyToGenerate || loading) return;
        setLoading(true);
        setError(null);
        setResultImage(null);

        try {
            // 构建 slots payload，仅包含已上传图片的槽位（可选槽位未上传则跳过）
            const slotsPayload = slots
                .filter(slot => uploads[slot.id] != null)
                .map(slot => ({
                    refId: slot.refId,
                    slotType: slot.slotType,
                    imageSource: uploads[slot.id]!.base64,
                }));

            // 提交任务
            const submitRes = await fetch('/api/generate/template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId, slots: slotsPayload }),
            });

            if (!submitRes.ok) {
                const err = await submitRes.json();
                throw new Error(err.error || 'Failed to submit task');
            }

            // 轮询结果
            const pollResult = await pollTaskStatus();

            if (pollResult.status === 'completed' && pollResult.result?.imageUrl) {
                setResultImage(pollResult.result.imageUrl);
            } else {
                throw new Error(pollResult.error || 'Generation failed');
            }
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full">
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

            {/* Slot 配置 */}
            {!resultImage && (
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

                    {/* 生成按钮 */}
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
                        // 已登录：正常生成
                        <button
                            className={`mt-4 w-full py-4 px-6 rounded-full text-lg font-bold transition-all flex justify-center items-center gap-2 ${isReadyToGenerate && !loading
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
                    )}

                    {loading && (
                        <p className="text-center text-sm text-gray-400">This may take 30–60 seconds…</p>
                    )}
                </>
            )}
        </div>
    );
}
