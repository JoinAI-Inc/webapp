"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { GalleryGridSkeleton, HistoryPageSkeleton } from "@/app/components/Skeletons";

interface HistoryItem {
    id: string;
    fileName: string;
    url: string;
    thumbnailUrl?: string;
    generationType: string;
    promptData: any;
    createdAt: string;
}

interface HistoryResponse {
    items: HistoryItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState<string>("");
    const [isNavigatingToGallery, setIsNavigatingToGallery] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [page, filter]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                pageSize: "20"
            });
            if (filter) {
                queryParams.append("type", filter);
            }

            const response = await fetch(`/api/history?${queryParams}`);
            if (response.ok) {
                const data: HistoryResponse = await response.json();
                setHistory(data.items);
                setTotalPages(data.totalPages);
            } else {
                console.error("Failed to load history");
            }
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除这个历史记录吗？")) return;

        try {
            const response = await fetch(`/api/history/${id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                loadHistory(); // 重新加载列表
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleDownload = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading:", error);
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            template: "模板生成",
            portrait: "肖像工作室",
            magic: "肖像工作室",    // 兼容旧数据
            hanfu: "肖像工作室",    // 兼容旧数据
            decor: "装饰",
            video: "视频"
        };
        return labels[type] || type;
    };

    return (
        <main className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] font-['Inter',_sans-serif]">
            {isNavigatingToGallery && (
                <div className="fixed inset-0 z-[2000] flex justify-center overflow-y-auto bg-white" data-gallery-nav-loading="true">
                    <div className="w-[92vw] max-w-[1600px] px-0 tablet:w-full tablet:px-[24px] py-[40px]">
                        <GalleryGridSkeleton />
                    </div>
                </div>
            )}
            <Navbar />

            <div className="max-w-7xl mx-auto px-[24px] py-[96px]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-[48px]"
                >
                    <div className="flex items-center gap-[12px] mb-[16px]">
                        <History className="w-[32px] h-[32px] text-[#EC2E2E]" />
                        <h1 className="text-4xl font-bold text-[#1a1c1c] font-['Plus_Jakarta_Sans',_sans-serif]">生成历史</h1>
                    </div>
                    <p className="text-[#6a696c]">查看您所有的 AI 生成作品</p>
                </motion.div>

                {/* 筛选器 */}
                <div className="flex gap-[16px] mb-[32px]">
                    {["", "template"].map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setFilter(type);
                                setPage(1);
                            }}
                            className={`px-[16px] py-[8px] rounded-full font-medium transition-all ${filter === type
                                ? "bg-[#EC2E2E] text-white shadow-sm"
                                : "bg-white text-[#6a696c] hover:bg-[#e8e8e8] shadow-sm"
                                }`}
                        >
                            {type === "" ? "全部" : getTypeLabel(type)}
                        </button>
                    ))}
                </div>

                {/* 历史记录网格 */}
                {loading ? (
                    <HistoryPageSkeleton includeHeader={false} />
                ) : history.length === 0 ? (
                    <div className="text-center py-[80px]">
                        <p className="text-[#9b9a9d] mb-[16px]">暂无生成历史</p>
                        <Link
                            href="/gallery"
                            onClick={() => setIsNavigatingToGallery(true)}
                            className="inline-flex items-center gap-[8px] px-[24px] py-[12px] bg-gradient-to-b from-[#EC2E2E] to-[#d62626] text-white rounded-full font-bold shadow-[0_12px_40px_rgba(236,46,46,0.2)] hover:scale-105 transition-transform"
                        >
                            开始创作
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[24px] mb-[32px]">
                            {history.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[1.5rem] p-[16px] shadow-[0_12px_40px_rgba(26,28,28,0.04)] hover:shadow-[0_12px_40px_rgba(26,28,28,0.08)] group transition-shadow"
                                >
                                    <div className="relative aspect-video mb-[12px] rounded-[1rem] overflow-hidden bg-[#e8e8e8]">
                                        <img
                                            src={item.thumbnailUrl || item.url}
                                            alt={item.fileName}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-[0px] bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-[12px]">
                                            <button
                                                onClick={() => window.open(item.url, "_blank")}
                                                className="p-[8px] bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                            >
                                                <Download className="w-[20px] h-[20px]" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-[8px] bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                            >
                                                <Trash2 className="w-[20px] h-[20px]" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-[8px]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs px-[8px] py-[4px] bg-[#EC2E2E]/10 text-[#EC2E2E] rounded-md font-medium">
                                                {getTypeLabel(item.generationType)}
                                            </span>
                                            <span className="text-xs text-[#9b9a9d]">
                                                {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#1a1c1c] font-medium truncate">{item.fileName}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 分页 */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-[16px] mt-[32px]">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-[8px] rounded-full bg-white hover:bg-[#e8e8e8] shadow-sm disabled:opacity-30 disabled:cursor-not-allowed text-[#1a1c1c]"
                                >
                                    <ChevronLeft className="w-[20px] h-[20px]" />
                                </button>
                                <span className="text-sm text-[#6a696c] font-medium">
                                    第 {page} 页 / 共 {totalPages} 页
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-[8px] rounded-full bg-white hover:bg-[#e8e8e8] shadow-sm disabled:opacity-30 disabled:cursor-not-allowed text-[#1a1c1c]"
                                >
                                    <ChevronRight className="w-[20px] h-[20px]" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
