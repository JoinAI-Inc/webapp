"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

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
            magic: "魔法合成",
            decor: "装饰",
            hanfu: "汉服",
            video: "视频"
        };
        return labels[type] || type;
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <History className="w-8 h-8 text-cny-gold" />
                        <h1 className="text-4xl font-bold text-shimmer">生成历史</h1>
                    </div>
                    <p className="text-cny-ivory/60">查看您所有的 AI 生成作品</p>
                </motion.div>

                {/* 筛选器 */}
                <div className="flex gap-4 mb-8">
                    {["", "magic", "decor", "hanfu", "video"].map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setFilter(type);
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === type
                                    ? "bg-cny-gold text-black"
                                    : "bg-white/5 text-cny-ivory/60 hover:bg-white/10"
                                }`}
                        >
                            {type === "" ? "全部" : getTypeLabel(type)}
                        </button>
                    ))}
                </div>

                {/* 历史记录网格 */}
                {loading ? (
                    <div className="text-center py-20">
                        <p className="text-cny-ivory/40">加载中...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-cny-ivory/40 mb-4">暂无生成历史</p>
                        <Link
                            href="/studio/magic"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-xl font-bold"
                        >
                            开始创作
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {history.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="glass-card p-4 group"
                                >
                                    <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-white/5">
                                        <img
                                            src={item.thumbnailUrl || item.url}
                                            alt={item.fileName}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => window.open(item.url, "_blank")}
                                                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs px-2 py-1 bg-cny-gold/20 text-cny-gold rounded">
                                                {getTypeLabel(item.generationType)}
                                            </span>
                                            <span className="text-xs text-cny-ivory/40">
                                                {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-cny-ivory/60 truncate">{item.fileName}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 分页 */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-cny-ivory/60">
                                    第 {page} 页 / 共 {totalPages} 页
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
