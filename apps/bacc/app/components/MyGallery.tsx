"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGenerateContext } from "./GenerateLayoutProvider";
import { useAuth } from "@/contexts/AuthContext";
import { HistoryItem, PendingTask } from "./gallery/gallery.types";
import { BrewingCard, HistoryCard } from "./gallery/GalleryCards";
import { GalleryPreviewModal } from "./gallery/GalleryPreviewModal";
import { getTemplateId } from "./gallery/gallery.types";
import { decideGalleryPoll, GalleryTaskSnapshot } from "./gallery/gallery-task-polling";
import { GalleryGridSkeleton } from "./Skeletons";

interface MyGalleryProps {
    /** 外部传入新提交的 taskId，触发 brewing 状态 */
    newTaskId?: string | null;
    /** 强制显示（即使无内容），用于 studio 内 gallery tab */
    forceVisible?: boolean;
}

const GALLERY_PAGE_SIZE = 12;

export function MyGallery({ newTaskId: propNewTaskId, forceVisible = false }: MyGalleryProps) {
    const { setActiveTab, latestTaskId, setLatestTaskId } = useGenerateContext();
    const router = useRouter();
    const newTaskId = propNewTaskId || latestTaskId;
    const { user, loading: authLoading } = useAuth();
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
    const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [reachedEnd, setReachedEnd] = useState(false);
    const pageRef = useRef(1);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const handledWatchedTaskIdsRef = useRef(new Set<string>());
    // 用 ref 持有 pendingTasks，避免 useCallback 依赖导致无限循环
    const pendingTasksRef = useRef<PendingTask[]>([]);
    pendingTasksRef.current = pendingTasks;
    const hasPendingTask = pendingTasks.length > 0;

    const handleRecreate = useCallback((item: HistoryItem) => {
        const templateId = getTemplateId(item);
        if (!templateId) return;
        router.push(`/generate/${templateId}`);
    }, [router]);

    const fetchHistory = useCallback(async (reset = false) => {
        if (!user) return;
        setLoading(true);
        try {
            const page = reset ? 1 : pageRef.current;
            const res = await fetch(`/api/history?page=${page}&pageSize=${GALLERY_PAGE_SIZE}`, {
                cache: "no-store",
            });
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
            setReachedEnd((data.items || []).length < GALLERY_PAGE_SIZE);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [user]);

    // 单一轮询函数，用 ref 读取 pendingTasks 避免循环依赖
    const pollCurrentTask = useCallback(async () => {
        if (!user) return;
        try {
            const taskList: GalleryTaskSnapshot[] = [];
            const currentTaskRes = await fetch("/api/queue/current-task", {
                cache: "no-store",
            });

            if (currentTaskRes.ok) {
                const data = await currentTaskRes.json();
                const currentTasks = Array.isArray(data.tasks)
                    ? data.tasks
                    : (data.taskId ? [data] : []);
                taskList.push(...currentTasks);
            }

            if (
                newTaskId &&
                !handledWatchedTaskIdsRef.current.has(newTaskId) &&
                !taskList.some((task) => task.taskId === newTaskId)
            ) {
                const watchedTaskRes = await fetch(
                    `/api/queue/status?taskId=${encodeURIComponent(newTaskId)}`,
                    { cache: "no-store" },
                );
                if (watchedTaskRes.ok) {
                    taskList.push(await watchedTaskRes.json());
                }
            }

            const decision = decideGalleryPoll({
                previousPendingTaskIds: pendingTasksRef.current.map((task) => task.taskId),
                tasks: taskList,
                watchedTaskId: newTaskId,
                handledWatchedTaskIds: handledWatchedTaskIdsRef.current,
            });

            setPendingTasks(decision.activeTasks.map((task) => ({
                taskId: task.taskId,
                status: task.status,
                metadata: (task.metadata as PendingTask["metadata"]) || null,
                createdAt: task.createdAt || new Date().toISOString(),
            })));

            if (decision.shouldRefreshHistory) {
                void fetchHistory(true);
            }

            if (decision.watchedTaskFinished && newTaskId) {
                handledWatchedTaskIdsRef.current.add(newTaskId);
                if (latestTaskId === newTaskId) {
                    setLatestTaskId(null);
                }
            }

            if (decision.activeTasks.length === 0) {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }
        } catch {
            // ignore
        }
    }, [user, fetchHistory, newTaskId, latestTaskId, setLatestTaskId]);

    // 初始加载 + 检查是否有进行中任务
    useEffect(() => {
        if (!user) return;
        fetchHistory(true);
        pollCurrentTask();
    }, [user]); // eslint-disable-line

    // pendingTasks 变化时，管理 interval（启动/停止）
    useEffect(() => {
        if (hasPendingTask && !pollingRef.current) {
            pollingRef.current = setInterval(pollCurrentTask, 5000);
        } else if (!hasPendingTask && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        return () => { };
    }, [hasPendingTask, pollCurrentTask]);

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

    // 滚动加载更多
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && !reachedEnd) {
                    fetchHistory();
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = scrollRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [loading, reachedEnd, fetchHistory]);

    if (authLoading) return <GalleryGridSkeleton />;
    if (!user) return null;
    if (loading && historyItems.length === 0 && pendingTasks.length === 0) return <GalleryGridSkeleton />;

    return (
        <section id="gallery" className="w-full">
            {/* Header */}
            <div className="mb-[20px] flex items-center gap-[6px] pl-[2px]">
                <img src="/assets/icon-my-gallery.svg" width={24} height={22} alt="" />
                <h6 className="text-black j-h6">My Gallery</h6>
            </div>

            {/* Grid container */}
            <div className="grid grid-cols-2 gap-[4px] tablet:grid-cols-3 desktop:grid-cols-4 desktop-l:grid-cols-5 desktop-l:grid-cols-6">
                {/* Brewing card first */}
                {pendingTasks.map((task) => <BrewingCard key={task.taskId} task={task} />)}

                {/* History cards */}
                {historyItems.map(item => (
                    <HistoryCard
                        key={item.id}
                        item={item}
                        onPreview={setPreviewItem}
                        onRecreate={handleRecreate}
                    />
                ))}
            </div>

            {previewItem && (
                <GalleryPreviewModal
                    item={previewItem}
                    onClose={() => setPreviewItem(null)}
                    onRecreate={handleRecreate}
                />
            )}

            {/* Load more trigger */}
            <div ref={scrollRef} className="h-[40px] w-full mt-[16px]" />

            {/* Load more indicator */}
            {loading && (
                <div className="w-full flex items-center justify-center py-[32px]">
                    <Loader2 size={24} className="text-[#EC2E2E] animate-spin" />
                </div>
            )}

            {/* End of list */}
            {reachedEnd && historyItems.length > 0 && (
                <div className="w-full py-[48px] flex items-center justify-center text-[14px]">
                    <span className="text-[#6a696c]">All content has been displayed. </span>
                    <button
                        onClick={() => setActiveTab("idea")}
                        className="text-[#EC2E2E] underline font-medium mx-[4px] hover:text-red-600 transition-colors"
                    >
                        Proceed to Idea
                    </button>
                    <span className="text-[#6a696c]">to begin my lucky photo session.</span>
                </div>
            )}

            {/* 空态 */}
            {reachedEnd && historyItems.length === 0 && pendingTasks.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-[50vh] w-full text-center gap-[16px]">
                    <div className="relative mb-[16px]">
                        <svg width="128" height="96" viewBox="0 0 128 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="20" y="8" width="26" height="26" rx="4" fill="#F3F4F6" />
                            <rect x="51" y="8" width="26" height="26" rx="4" fill="#F3F4F6" />
                            <rect x="82" y="8" width="26" height="26" rx="4" fill="#F3F4F6" />
                            <rect x="20" y="39" width="26" height="26" rx="4" fill="#F3F4F6" />
                            <rect x="51" y="39" width="26" height="26" rx="4" fill="#F3F4F6" />
                            <rect x="82" y="39" width="26" height="26" rx="4" fill="#F3F4F6" />
                            <g transform="translate(68, 32) rotate(15)">
                                <rect x="-15" y="-20" width="30" height="40" rx="3" fill="#333333" stroke="white" strokeWidth="2" />
                                <rect x="-13" y="-18" width="26" height="24" rx="2" fill="white" />
                                <text x="0" y="14" fill="white" fontSize="5" fontWeight="bold" textAnchor="middle">Lucky</text>
                                <text x="0" y="21" fill="white" fontSize="5" fontWeight="bold" textAnchor="middle">Photo</text>
                            </g>
                            <g transform="translate(54, 40) rotate(-15)">
                                <rect x="-18" y="-24" width="36" height="46" rx="3" fill="#EC2E2E" stroke="white" strokeWidth="2" />
                                <rect x="-16" y="-22" width="32" height="30" rx="2" fill="white" />
                                <circle cx="-6" cy="14" r="3.5" fill="white" />
                                <circle cx="-6.5" cy="14" r="1.5" fill="#333333" />
                                <circle cx="6" cy="14" r="3.5" fill="white" />
                                <circle cx="5.5" cy="14" r="1.5" fill="#333333" />
                            </g>
                        </svg>
                    </div>
                    <div className="flex flex-col items-center gap-[4px]">
                        <p className="text-[15px] font-medium text-[#080606]">Your gallery is empty.</p>
                        <p className="text-[14px] text-[#6a696c]">
                            <button
                                onClick={() => setActiveTab("idea")}
                                className="text-[#EC2E2E] hover:underline transition-colors font-medium"
                            >
                                Proceed to Idea
                            </button>
                            {" "}to begin my lucky photo session.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}
