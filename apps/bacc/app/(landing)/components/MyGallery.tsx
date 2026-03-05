"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Loader2, Images, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

interface HistoryItem {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    generationType: string | null;
    promptData: any;
    createdAt: string;
}

interface PendingTask {
    taskId: string;
    status: string; // pending | processing
    metadata: {
        type: string;
        payload: {
            slots?: Array<{ slotType: string; imageSource: string }>;
            [key: string]: any;
        };
        submittedAt: string;
    } | null;
    createdAt: string;
}

// 从 promptData 或 metadata.payload 中提取用户上传的原图
function extractSlotImages(item: HistoryItem): string[] {
    try {
        const data = item.promptData;
        if (!data) return [];
        // 支持 { slots: [{imageSource, slotType}] } 结构
        if (Array.isArray(data.slots)) {
            return data.slots
                .map((s: any) => s.imageSource || s.imageUrl)
                .filter(Boolean);
        }
        // 支持顶层字段
        if (data.imageSource) return [data.imageSource];
    } catch {
        // ignore
    }
    return [];
}

function extractPendingSlotImages(task: PendingTask): string[] {
    try {
        const slots = task.metadata?.payload?.slots;
        if (!slots) return [];
        return slots.map(s => s.imageSource).filter(Boolean);
    } catch {
        return [];
    }
}

// 生成中卡片
function BrewingCard({ task }: { task: PendingTask }) {
    const slots = extractPendingSlotImages(task);
    const firstSlot = slots[0];

    return (
        <div className="flex-shrink-0 w-48 flex flex-col gap-2">
            {/* 主图 - 模糊占位 */}
            <div className="relative w-48 h-64 rounded-2xl overflow-hidden border-2 border-[#FF3F2A]/40 bg-gray-100">
                {firstSlot ? (
                    <img
                        src={firstSlot}
                        alt="Generating..."
                        className="w-full h-full object-cover blur-sm scale-110 brightness-75"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
                {/* brewing overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3">
                    <div className="bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 text-center">
                        <p className="text-white text-xs font-semibold leading-snug">✨ Your LuckyFoto is brewing!</p>
                    </div>
                    <Loader2 size={24} className="text-white animate-spin" />
                </div>
            </div>

            {/* 底部缩略图 */}
            {slots.length > 0 && (
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {slots.map((src, i) => (
                        <div key={i} className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            <img src={src} alt="input" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 历史完成卡片
function HistoryCard({ item }: { item: HistoryItem }) {
    const slotImages = extractSlotImages(item);
    const resultUrl = item.url || item.thumbnailUrl;

    return (
        <div className="flex-shrink-0 w-48 flex flex-col gap-2">
            {/* 主图 */}
            <div className="relative w-48 h-64 rounded-2xl overflow-hidden bg-gray-100 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow">
                {resultUrl ? (
                    <Image
                        src={resultUrl}
                        alt="Generated"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="192px"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Images size={32} className="text-gray-400" />
                    </div>
                )}
                {/* download on hover */}
                {resultUrl && (
                    <a
                        href={resultUrl}
                        download
                        onClick={e => e.stopPropagation()}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-medium"
                    >
                        Save
                    </a>
                )}
            </div>

            {/* 底部：用户上传的原图缩略图 */}
            {slotImages.length > 0 && (
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {slotImages.map((src, i) => (
                        <div key={i} className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            <img src={src} alt="input" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

interface MyGalleryProps {
    /** 外部传入新提交的 taskId，触发 brewing 状态 */
    newTaskId?: string | null;
    /** 强制显示（即使无内容），用于 studio 内 gallery tab */
    forceVisible?: boolean;
}

export function MyGallery({ newTaskId, forceVisible = false }: MyGalleryProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [pendingTask, setPendingTask] = useState<PendingTask | null>(null);
    const [loading, setLoading] = useState(false);
    const [reachedEnd, setReachedEnd] = useState(false);
    const pageRef = useRef(1);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    // 用 ref 持有 pendingTask，避免 useCallback 依赖导致无限循环
    const pendingTaskRef = useRef<PendingTask | null>(null);
    pendingTaskRef.current = pendingTask;

    const fetchHistory = useCallback(async (reset = false) => {
        if (sessionStatus !== "authenticated") return;
        setLoading(true);
        try {
            const page = reset ? 1 : pageRef.current;
            const res = await fetch(`/api/history?page=${page}&pageSize=20`);
            if (!res.ok) return;
            const data = await res.json();
            // 过滤掉无效 URL 的记录，避免白卡片
            const items: HistoryItem[] = (data.items || []).filter(
                (item: HistoryItem) => item.url || item.thumbnailUrl
            );
            if (reset) {
                setHistoryItems(items);
                pageRef.current = 2;
            } else {
                setHistoryItems(prev => {
                    const existingIds = new Set(prev.map(i => i.id));
                    return [...prev, ...items.filter((i: HistoryItem) => !existingIds.has(i.id))];
                });
                pageRef.current = page + 1;
            }
            setReachedEnd((data.items || []).length < 20);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [sessionStatus]);

    // 单一轮询函数，用 ref 读取 pendingTask 避免循环依赖
    const pollCurrentTask = useCallback(async () => {
        if (sessionStatus !== "authenticated") return;
        try {
            const res = await fetch("/api/queue/current-task");
            if (!res.ok) {
                setPendingTask(null);
                return;
            }
            const data = await res.json();

            if (!data.taskId || !data.status || data.status === "completed" || data.status === "failed") {
                // 任务结束，若之前有任务则刷新历史
                if (pendingTaskRef.current) {
                    setPendingTask(null);
                    fetchHistory(true);
                }
                // 停止轮询
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                return;
            }

            setPendingTask({
                taskId: data.taskId,
                status: data.status,
                metadata: data.metadata || null,
                createdAt: data.createdAt || new Date().toISOString(),
            });
        } catch {
            // ignore
        }
    }, [sessionStatus, fetchHistory]); // 不依赖 pendingTask

    // 初始加载 + 检查是否有进行中任务
    useEffect(() => {
        if (sessionStatus !== "authenticated") return;
        fetchHistory(true);
        pollCurrentTask();
    }, [sessionStatus]); // eslint-disable-line

    // pendingTask 变化时，管理 interval（启动/停止）
    useEffect(() => {
        if (pendingTask && !pollingRef.current) {
            pollingRef.current = setInterval(pollCurrentTask, 5000);
        } else if (!pendingTask && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        return () => { };
    }, [!!pendingTask]); // 只依赖 boolean，避免重复创建 interval

    // 组件卸载时清理 interval
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, []);

    // 外部新任务触发：立即启动轮询
    useEffect(() => {
        if (!newTaskId) return;
        pollCurrentTask();
        if (!pollingRef.current) {
            pollingRef.current = setInterval(pollCurrentTask, 5000);
        }
    }, [newTaskId]); // eslint-disable-line

    // 横向滚动加载更多
    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el || loading || reachedEnd) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 200) {
            fetchHistory();
        }
    };

    if (sessionStatus === "loading") return null;
    if (sessionStatus !== "authenticated") return null;

    return (
        <section id="gallery" className="mt-16 w-full scroll-mt-24">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <Images size={20} className="text-[#FF3F2A]" />
                <h2 className="text-xl font-extrabold text-gray-900">My Gallery</h2>
            </div>

            {/* Horizontal scroll */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-5 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollBehavior: "smooth" }}
            >
                {/* Brewing card first */}
                {pendingTask && <BrewingCard task={pendingTask} />}

                {/* History cards */}
                {historyItems.map(item => (
                    <HistoryCard key={item.id} item={item} />
                ))}

                {/* Load more indicator */}
                {loading && (
                    <div className="flex-shrink-0 flex items-center justify-center w-24">
                        <Loader2 size={20} className="text-gray-400 animate-spin" />
                    </div>
                )}

                {/* End of list */}
                {reachedEnd && historyItems.length > 0 && (
                    <div className="flex-shrink-0 flex items-center justify-center w-32 text-xs text-gray-400 text-center px-4">
                        You&apos;ve reached the end
                    </div>
                )}

                {/* 空态 */}
                {reachedEnd && historyItems.length === 0 && !pendingTask && !loading && (
                    <div className="flex-shrink-0 flex flex-col items-center justify-center h-64 w-full text-center text-gray-400 gap-3">
                        <Images size={40} className="text-gray-300" />
                        <p className="text-sm">No generations yet.<br />Pick a template to get started!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
