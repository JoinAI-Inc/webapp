"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Wallet, Settings, LogOut, LogIn, X, ChevronRight,
    Loader2, Zap, Clock, Package
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Balance Modal ────────────────────────────────────────────────────────────

interface Balance {
    remainingCount: number;
    totalPurchased: number;
    totalUsed: number;
    feature: { featureKey: string; name: string };
}

interface UsageLog {
    id: string;
    usedCount: number;
    createdAt: string;
    feature: { name: string; featureKey: string };
    order: { orderNo: string; amount: number; currency: string } | null;
}

function BalanceModal({ onClose }: { onClose: () => void; userId?: string }) {
    const [balances, setBalances] = useState<Balance[]>([]);
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"balance" | "history">("balance");

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('/api/usage/balance').then(r => r.ok ? r.json() : []),
            fetch('/api/usage/logs?limit=30').then(r => r.ok ? r.json() : []),
        ]).then(([b, l]) => {
            setBalances(Array.isArray(b) ? b : []);
            setLogs(Array.isArray(l) ? l : []);
        }).finally(() => setLoading(false));
    }, []);

    const totalRemaining = balances.reduce((s, b) => s + b.remainingCount, 0);
    const totalUsed = balances.reduce((s, b) => s + b.totalUsed, 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col"
                style={{ fontFamily: "Manrope, sans-serif" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">My Lucky Balance</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Your AI generation counts</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-16">
                        <Loader2 size={28} className="animate-spin text-[#FF3F2A]" />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 px-7 py-5 bg-gradient-to-br from-orange-50/80 to-red-50/60">
                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={14} className="text-[#FF3F2A]" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</span>
                                </div>
                                <p className="text-2xl font-extrabold text-[#FF3F2A]">{totalRemaining}</p>
                                <p className="text-xs text-gray-400 mt-0.5">counts</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Package size={14} className="text-gray-500" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Used</span>
                                </div>
                                <p className="text-2xl font-extrabold text-gray-700">{totalUsed}</p>
                                <p className="text-xs text-gray-400 mt-0.5">all time</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock size={14} className="text-gray-500" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchased</span>
                                </div>
                                <p className="text-2xl font-extrabold text-gray-700">
                                    {balances.reduce((s, b) => s + b.totalPurchased, 0)}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">total</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 px-7 pt-4 pb-2">
                            {(["balance", "history"] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === t
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-500 hover:bg-gray-100"
                                        }`}
                                >
                                    {t === "balance" ? "Balance Details" : "Usage History"}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto px-7 py-3 pb-6">
                            {tab === "balance" ? (
                                <div className="flex flex-col gap-3">
                                    {balances.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No balance data found.</p>
                                    ) : balances.map((b, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-[#FF3F2A]/30 transition-colors">
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{b.feature.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{b.feature.featureKey}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-extrabold text-[#FF3F2A]">{b.remainingCount}</p>
                                                <p className="text-xs text-gray-400">remaining</p>
                                            </div>
                                        </div>
                                    ))}
                                    <a
                                        href="/subscribe"
                                        className="mt-2 w-full py-3 bg-[#FF3F2A] text-white text-center font-bold text-sm rounded-2xl hover:bg-[#e03520] transition-colors block"
                                    >
                                        获取更多生成次数 →
                                    </a>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {logs.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No usage history yet.</p>
                                    ) : logs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                    <Zap size={14} className="text-[#FF3F2A]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{log.feature.name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">-{log.usedCount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── User Menu Button ─────────────────────────────────────────────────────────

export function UserMenuButton() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [showBalance, setShowBalance] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const user = session?.user;
    const userId = (session as any)?.userId || user?.id;
    const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";

    // Close menu on outside click
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showMenu]);

    if (status === "loading") {
        return (
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
        );
    }

    if (!session) {
        return (
            <button
                title="Login"
                onClick={() => router.push("/login")}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
                <LogIn size={20} strokeWidth={1.8} />
            </button>
        );
    }

    return (
        <>
            <div ref={menuRef} className="relative">
                {/* Avatar button */}
                <button
                    onClick={() => setShowMenu(v => !v)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all select-none ${showMenu
                        ? "ring-2 ring-[#FF3F2A] ring-offset-1"
                        : "hover:ring-2 hover:ring-gray-200"
                        } ${user?.image ? "overflow-hidden" : "bg-gradient-to-br from-[#FF3F2A] to-[#ff7043] text-white"}`}
                    title="Account"
                >
                    {user?.image
                        ? <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                        : initial}
                </button>

                {/* Popup Menu */}
                {showMenu && (
                    <div className="absolute left-[52px] bottom-0 mb-0 ml-1 w-[200px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF3F2A] to-[#ff7043] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {initial}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">{user?.name || "User"}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1.5">
                            <button
                                onClick={() => { setShowBalance(true); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#FF3F2A] hover:bg-orange-50 transition-colors group"
                            >
                                <Wallet size={15} />
                                <span>My Lucky Balance</span>
                                <ChevronRight size={13} className="ml-auto opacity-40 group-hover:opacity-80 transition-opacity" />
                            </button>
                            <button
                                onClick={() => { router.push("/account/settings"); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Settings size={15} />
                                <span>Settings</span>
                            </button>
                        </div>

                        <div className="border-t border-gray-100 py-1.5">
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <LogOut size={15} />
                                <span>Exit</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Balance Modal */}
            {showBalance && userId && (
                <BalanceModal
                    userId={userId}
                    onClose={() => setShowBalance(false)}
                />
            )}
        </>
    );
}
