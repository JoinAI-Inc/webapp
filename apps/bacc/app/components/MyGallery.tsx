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
import { GalleryGridSkeleton } from "./Skeletons";

interface MyGalleryProps {
    /** 外部传入新提交的 taskId，触发 brewing 状态 */
    newTaskId?: string | null;
    /** 强制显示（即使无内容），用于 studio 内 gallery tab */
    forceVisible?: boolean;
}

export function MyGallery({ newTaskId: propNewTaskId, forceVisible = false }: MyGalleryProps) {
    const { setActiveTab, latestTaskId } = useGenerateContext();
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
    }, [user]);

    // 单一轮询函数，用 ref 读取 pendingTasks 避免循环依赖
    const pollCurrentTask = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch("/api/queue/current-task");
            if (!res.ok) {
                setPendingTasks([]);
                return;
            }
            const data = await res.json();
            const taskList = Array.isArray(data.tasks) ? data.tasks : (data.taskId ? [data] : []);
            const activeTasks = taskList.filter((task: any) => task.status === "pending" || task.status === "processing");

            if (activeTasks.length === 0) {
                // 任务结束，若之前有任务则刷新历史
                if (pendingTasksRef.current.length > 0) {
                    setPendingTasks([]);
                    fetchHistory(true);
                }
                // 停止轮询
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                return;
            }

            setPendingTasks(activeTasks.map((task: any) => ({
                taskId: task.taskId,
                status: task.status,
                metadata: task.metadata || null,
                createdAt: task.createdAt || new Date().toISOString(),
            })));
        } catch {
            // ignore
        }
    }, [user, fetchHistory]); // 不依赖 pendingTasks

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
                <div className="w-[24px] h-[22px]">
                    <svg width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.0094 3.3781C19.4694 2.7541 18.7134 2.3701 17.8974 2.3221L11.5735 1.8541C10.7455 1.7941 9.95345 2.0701 9.32945 2.6101C8.70545 3.1501 8.33345 3.9061 8.27345 4.7221V4.8301L5.70545 5.0941C4.87745 5.1781 4.13345 5.5861 3.61745 6.2341C3.10145 6.8701 2.87345 7.6741 2.95745 8.4781L4.01345 18.7381C4.09745 19.5661 4.49345 20.2981 5.12945 20.8261C5.68145 21.2821 6.36545 21.5101 7.06145 21.5101C7.16945 21.5101 7.28945 21.5101 7.39745 21.4861L13.6974 20.8381C14.9454 20.7181 15.9295 19.8781 16.3014 18.7381L16.6974 18.7621C16.7694 18.7621 16.8414 18.7621 16.9135 18.7621C17.6574 18.7621 18.3654 18.4981 18.9414 18.0061C19.5654 17.4661 19.9494 16.7101 19.9974 15.8941L20.7534 5.6101C20.8134 4.7821 20.5494 3.9901 20.0094 3.3661V3.3781ZM13.5414 19.2181L7.22945 19.8661C6.83345 19.9021 6.44945 19.7941 6.14945 19.5541C5.84945 19.3021 5.65745 18.9541 5.62145 18.5581L4.56545 8.2981C4.52945 7.9141 4.63745 7.5421 4.87745 7.2421C5.12945 6.9301 5.47745 6.7381 5.87345 6.7021L8.14145 6.4741L7.51745 15.0061C7.45745 15.8341 7.72145 16.6261 8.26145 17.2501C8.80145 17.8741 9.55745 18.2581 10.3735 18.3061L14.5854 18.6181C14.3454 18.9541 13.9734 19.1821 13.5414 19.2301V19.2181ZM19.1334 5.5021L18.3774 15.7861C18.3534 16.1701 18.1734 16.5301 17.8735 16.7821C17.5735 17.0341 17.2014 17.1661 16.8054 17.1421L15.7374 17.0581C15.7374 17.0581 15.7254 17.0581 15.7134 17.0581L10.4934 16.6741C10.1094 16.6501 9.74945 16.4701 9.49745 16.1701C9.24545 15.8701 9.11345 15.4861 9.13745 15.1021L9.82145 5.6101L9.88145 4.8301C9.90545 4.4341 10.0854 4.0861 10.3854 3.8221C10.6614 3.5821 10.9974 3.4621 11.3574 3.4621C11.3934 3.4621 11.4295 3.4621 11.4535 3.4621L17.7774 3.9301C18.1734 3.9541 18.5214 4.1341 18.7854 4.4341C19.0374 4.7341 19.1694 5.1061 19.1334 5.5021Z" fill="#22252A" />
                        <path d="M17.1658 7.75804C17.1778 7.20604 16.5058 6.96604 16.1578 7.38604C15.4258 8.27404 14.6218 8.88604 13.8418 9.12604C13.4458 9.24604 13.2898 9.66604 13.5058 10.026C13.9378 10.722 14.1538 11.706 14.1298 12.858C14.1178 13.41 14.7898 13.65 15.1378 13.23C15.8698 12.342 16.6738 11.73 17.4538 11.49C17.8498 11.37 18.0058 10.95 17.7898 10.59C17.3578 9.89404 17.1418 8.91004 17.1658 7.75804Z" fill="#8640FF" />
                        <path d="M2.48969 0.592348C2.31807 0.250593 1.82894 0.321571 1.75212 0.691469C1.59198 1.47232 1.2983 2.10758 0.898696 2.50736C0.695222 2.7092 0.73591 3.01685 0.984836 3.16716C1.47491 3.4531 1.92614 3.98535 2.28495 4.69824C2.45658 5.03999 2.9457 4.96902 3.02253 4.59912C3.18266 3.81827 3.47635 3.18301 3.87595 2.78323C4.07943 2.58139 4.03874 2.27374 3.78981 2.12342C3.29974 1.83748 2.8485 1.30524 2.48969 0.592348Z" fill="#FF3F2A" />
                        <path d="M22.8226 17.3095C22.9028 17.0907 22.6673 16.9031 22.471 17.0233C22.0574 17.2778 21.6529 17.4124 21.3087 17.4017C21.1342 17.3955 21.0145 17.5419 21.0516 17.7151C21.129 18.052 21.0809 18.4743 20.9139 18.931C20.8338 19.1497 21.0693 19.3373 21.2656 19.2172C21.6791 18.9626 22.0837 18.8281 22.4279 18.8388C22.6024 18.845 22.722 18.6986 22.6849 18.5254C22.6075 18.1885 22.6557 17.7661 22.8226 17.3095Z" fill="#FFD972" />
                        <path d="M22.4938 2.36481C22.4469 2.24124 22.2762 2.24834 22.2367 2.37279C22.154 2.63558 22.0306 2.8436 21.8791 2.96691C21.802 3.0291 21.8051 3.13631 21.8853 3.1968C22.0437 3.31244 22.18 3.5114 22.2782 3.76918C22.3251 3.89275 22.4957 3.88566 22.5352 3.7612C22.6179 3.49841 22.7414 3.2904 22.8929 3.16709C22.97 3.1049 22.9669 2.99769 22.8866 2.9372C22.7283 2.82155 22.5919 2.6226 22.4938 2.36481Z" fill="#62E06E" />
                    </svg>
                </div>
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
