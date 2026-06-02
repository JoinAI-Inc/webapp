"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Wallet, Settings, LogOut, LogIn, X, ChevronRight,
    Loader2, Zap, Clock, Package
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
        <div className="fixed inset-[0px] z-[100] flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-[0px] bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-[28px] pt-[28px] pb-[16px] border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">My Lucky Balance</h2>
                        <p className="text-sm text-gray-500 mt-[2px]">Your AI generation counts</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-[36px] h-[36px] flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-[64px]">
                        <Loader2 size={28} className="animate-spin text-[#FF3F2A]" />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-[16px] px-[28px] py-[20px] bg-gradient-to-br from-orange-50/80 to-red-50/60">
                            <div className="bg-white rounded-2xl p-[16px] shadow-sm">
                                <div className="flex items-center gap-[8px] mb-[4px]">
                                    <Zap size={14} className="text-[#FF3F2A]" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</span>
                                </div>
                                <p className="text-2xl font-extrabold text-[#FF3F2A]">{totalRemaining}</p>
                                <p className="text-xs text-gray-400 mt-[2px]">counts</p>
                            </div>
                            <div className="bg-white rounded-2xl p-[16px] shadow-sm">
                                <div className="flex items-center gap-[8px] mb-[4px]">
                                    <Package size={14} className="text-gray-500" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Used</span>
                                </div>
                                <p className="text-2xl font-extrabold text-gray-700">{totalUsed}</p>
                                <p className="text-xs text-gray-400 mt-[2px]">all time</p>
                            </div>
                            <div className="bg-white rounded-2xl p-[16px] shadow-sm">
                                <div className="flex items-center gap-[8px] mb-[4px]">
                                    <Clock size={14} className="text-gray-500" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchased</span>
                                </div>
                                <p className="text-2xl font-extrabold text-gray-700">
                                    {balances.reduce((s, b) => s + b.totalPurchased, 0)}
                                </p>
                                <p className="text-xs text-gray-400 mt-[2px]">total</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-[4px] px-[28px] pt-[16px] pb-[8px]">
                            {(["balance", "history"] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`px-[16px] py-[6px] rounded-full text-sm font-semibold transition-colors ${tab === t
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-500 hover:bg-gray-100"
                                        }`}
                                >
                                    {t === "balance" ? "Balance Details" : "Usage History"}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto px-[28px] py-[12px] pb-[24px]">
                            {tab === "balance" ? (
                                <div className="flex flex-col gap-[12px]">
                                    {balances.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-[24px]">No balance data found.</p>
                                    ) : balances.map((b, i) => (
                                        <div key={i} className="flex items-center justify-between p-[16px] rounded-2xl border border-gray-100 hover:border-[#FF3F2A]/30 transition-colors">
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{b.feature.name}</p>
                                                <p className="text-xs text-gray-400 mt-[2px]">{b.feature.featureKey}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-extrabold text-[#FF3F2A]">{b.remainingCount}</p>
                                                <p className="text-xs text-gray-400">remaining</p>
                                            </div>
                                        </div>
                                    ))}
                                    <a
                                        href="/subscribe"
                                        className="mt-[8px] w-full py-[12px] bg-[#FF3F2A] text-white text-center font-bold text-sm rounded-2xl hover:bg-[#e03520] transition-colors block"
                                    >
                                        获取更多生成次数 →
                                    </a>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-[8px]">
                                    {logs.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-[24px]">No usage history yet.</p>
                                    ) : logs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-[14px] rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                            <div className="flex items-start gap-[12px]">
                                                <div className="w-[32px] h-[32px] rounded-lg bg-orange-50 flex items-center justify-center mt-[2px] flex-shrink-0">
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

export function UserMenuButton({ mobileCompact = false }: { mobileCompact?: boolean } = {}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [showBalance, setShowBalance] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const userId = user?.id;
    const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";

    useEffect(() => {
        if (!user) return;
        fetch('/api/usage/balance')
            .then(r => r.ok ? r.json() : [])
            .then(b => {
                const totalRemaining = Array.isArray(b) ? b.reduce((s: number, item: any) => s + item.remainingCount, 0) : 0;
                setBalance(totalRemaining);
            })
            .catch(console.error);
    }, [user]);

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

    if (loading) {
        return (
            <div className={`${mobileCompact ? "size-[32px]" : "w-[36px] h-[36px]"} rounded-full bg-gray-100 animate-pulse`} />
        );
    }

    if (!user) {
        return (
            <button
                title="Login"
                onClick={() => router.push("/login")}
                className={`${mobileCompact ? "size-[32px] rounded-full bg-[#445B64] text-white hover:bg-[#354952]" : "w-[36px] h-[36px] rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600"} flex items-center justify-center transition-colors`}
            >
                <LogIn size={mobileCompact ? 17 : 20} strokeWidth={1.8} />
            </button>
        );
    }

    return (
        <>
            <div className="flex items-center gap-[8px]">
                <a
                    href="/"
                    className="hidden tablet:flex items-center gap-[4px] h-[32px] px-[12px] rounded-[16px] bg-[#F2F2F3] hover:bg-[#e4e4e7] transition-colors j-t3 text-black justify-center"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.8403 6.91998L11.2003 2.68998C10.4903 2.15998 9.50032 2.15998 8.80032 2.68998L3.16032 6.91998C2.58032 7.35998 2.28032 8.06998 2.38032 8.78998L3.31032 15.71C3.44032 16.7 4.30032 17.44 5.29032 17.44H14.7003C15.7003 17.44 16.5503 16.69 16.6803 15.7L17.6103 8.77998C17.7103 8.05998 17.4103 7.34998 16.8303 6.90998L16.8403 6.91998ZM16.2803 8.60998L15.3503 15.53C15.3103 15.85 15.0303 16.1 14.7003 16.1H5.29032C4.96032 16.1 4.69032 15.86 4.64032 15.53L3.71032 8.60998C3.68032 8.37998 3.78032 8.13998 3.96032 7.99998L9.60032 3.76998C9.72032 3.67998 9.85032 3.63998 9.99032 3.63998C10.1303 3.63998 10.2703 3.67998 10.3803 3.76998L16.0203 7.99998C16.2103 8.13998 16.3103 8.37998 16.2703 8.60998H16.2803Z" fill="#0A0708" />
                        <path d="M16.8403 6.91998L11.2003 2.68998C10.4903 2.15998 9.50032 2.15998 8.80032 2.68998L3.16032 6.91998C2.58032 7.35998 2.28032 8.06998 2.38032 8.78998L3.31032 15.71C3.44032 16.7 4.30032 17.44 5.29032 17.44H14.7003C15.7003 17.44 16.5503 16.69 16.6803 15.7L17.6103 8.77998C17.7103 8.05998 17.4103 7.34998 16.8303 6.90998L16.8403 6.91998ZM16.2803 8.60998L15.3503 15.53C15.3103 15.85 15.0303 16.1 14.7003 16.1H5.29032C4.96032 16.1 4.69032 15.86 4.64032 15.53L3.71032 8.60998C3.68032 8.37998 3.78032 8.13998 3.96032 7.99998L9.60032 3.76998C9.72032 3.67998 9.85032 3.63998 9.99032 3.63998C10.1303 3.63998 10.2703 3.67998 10.3803 3.76998L16.0203 7.99998C16.2103 8.13998 16.3103 8.37998 16.2703 8.60998H16.2803Z" fill="black" fill-opacity="0.2" />
                        <path d="M12.8299 10.34C11.7099 9.87 10.8199 8.98 10.3499 7.86C10.2199 7.54 9.77992 7.54 9.63992 7.86C9.16992 8.98 8.27992 9.87 7.15992 10.34C6.83992 10.47 6.83992 10.91 7.15992 11.05C8.27992 11.52 9.16992 12.41 9.63992 13.53C9.76992 13.85 10.2099 13.85 10.3499 13.53C10.8199 12.41 11.7099 11.52 12.8299 11.05C13.1499 10.92 13.1499 10.48 12.8299 10.34Z" fill="#0A0708" />
                        <path d="M12.8299 10.34C11.7099 9.87 10.8199 8.98 10.3499 7.86C10.2199 7.54 9.77992 7.54 9.63992 7.86C9.16992 8.98 8.27992 9.87 7.15992 10.34C6.83992 10.47 6.83992 10.91 7.15992 11.05C8.27992 11.52 9.16992 12.41 9.63992 13.53C9.76992 13.85 10.2099 13.85 10.3499 13.53C10.8199 12.41 11.7099 11.52 12.8299 11.05C13.1499 10.92 13.1499 10.48 12.8299 10.34Z" fill="black" fill-opacity="0.2" />
                    </svg>


                    Visit website
                </a>

                <button
                    onClick={() => setShowBalance(true)}
                    className={mobileCompact
                        ? "flex h-[28px] items-center gap-[4px] rounded-[6px] bg-[#EC2E2E] px-[6px] py-[5px] text-[12px] font-normal leading-[1.4] tracking-[0.12px] text-white transition-colors hover:bg-[#CC2323]"
                        : "flex items-center h-[32px] tablet:pl-[8px] pl-[3px] pr-[3px] rounded-[6px] bg-[#EC2E2E] hover:bg-[#CC2323] transition-colors j-t3 text-white gap-[6px]"}
                >
                    <span className="hidden tablet:inline">Top up</span>
                    <div className={mobileCompact ? "flex items-center justify-center gap-[4px]" : "flex items-center bg-[#0F00001F] rounded-[4px] justify-center h-[24px] gap-[4px] px-[6px]"}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_374_1528)">
                                <g clip-path="url(#clip1_374_1528)">
                                    <path d="M9 0C4.032 0 0 4.032 0 9C0 13.968 4.032 18 9 18C13.968 18 18 13.968 18 9C18 4.032 13.968 0 9 0ZM9 5.724C9.864 7.029 10.971 8.145 12.285 9C10.971 9.864 9.855 10.98 9 12.285C8.145 10.98 7.029 9.864 5.715 9C7.029 8.145 8.145 7.029 9 5.724Z" fill="#930808" />
                                    <path d="M9 1C4.58222 1 1 4.58222 1 9C1 13.4178 4.58222 17 9 17C13.4178 17 17 13.4178 17 9C17 4.58222 13.4178 1 9 1ZM9 12.2444C8.15556 10.9556 7.05333 9.85333 5.75556 9C7.05333 8.15556 8.15556 7.05333 9 5.76444C9.85333 7.05333 10.9467 8.15556 12.2444 9C10.9467 9.85333 9.84444 10.9556 9 12.2444Z" fill="url(#paint0_linear_374_1528)" />
                                    <path d="M8.99956 3.51898C5.97555 3.51898 3.51855 5.97598 3.51855 8.99998C3.51855 12.024 5.97555 14.49 8.99956 14.49C12.0236 14.49 14.4806 12.033 14.4806 8.99998C14.4806 5.96698 12.0326 3.51898 8.99956 3.51898ZM12.2846 8.99998C10.9706 9.86398 9.85456 10.98 8.99956 12.285C8.14456 10.98 7.02855 9.86398 5.71455 8.99998C7.02855 8.14498 8.14456 7.02898 8.99956 5.72398C9.86355 7.02898 10.9706 8.14498 12.2846 8.99998Z" fill="url(#paint1_linear_374_1528)" />
                                    <path d="M13.7343 8.31602C12.0153 7.38002 10.6203 5.98502 9.69333 4.27502C9.55833 4.03202 9.29733 3.87002 9.00933 3.86102C8.73033 3.86102 8.46933 4.01402 8.32533 4.26602C7.38933 5.97602 5.98533 7.38002 4.26633 8.31602C4.02333 8.44202 3.86133 8.71202 3.86133 9.00002C3.86133 9.28802 4.01433 9.54902 4.26633 9.68402C5.97633 10.611 7.38033 12.015 8.32533 13.734C8.46933 13.986 8.72133 14.139 9.00933 14.139C9.29733 14.139 9.55833 13.986 9.69333 13.734C10.6203 12.024 12.0153 10.629 13.7343 9.68402C13.9863 9.54902 14.1393 9.28802 14.1393 9.00002C14.1393 8.71202 13.9863 8.44202 13.7343 8.31602ZM9.00033 12.285C8.14533 10.98 7.02933 9.86402 5.71533 9.00002C7.02933 8.14502 8.14533 7.02902 9.00033 5.72402C9.86433 7.02902 10.9713 8.14502 12.2853 9.00002C10.9713 9.86402 9.85533 10.98 9.00033 12.285Z" fill="url(#paint2_linear_374_1528)" />
                                </g>
                            </g>
                            <defs>
                                <linearGradient id="paint0_linear_374_1528" x1="15.2222" y1="15.6667" x2="2.77778" y2="3.22222" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FFD66D" />
                                    <stop offset="0.49" stop-color="#FFA703" />
                                    <stop offset="1" stop-color="#FFDA60" />
                                </linearGradient>
                                <linearGradient id="paint1_linear_374_1528" x1="8.99955" y1="3.51898" x2="8.99955" y2="14.49" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FF5A29" />
                                    <stop offset="1" stop-color="#FF8B03" />
                                </linearGradient>
                                <linearGradient id="paint2_linear_374_1528" x1="10.3503" y1="14.4" x2="8.55035" y2="4.50002" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FFC505" />
                                    <stop offset="1" stop-color="#FFF604" />
                                </linearGradient>
                                <clipPath id="clip0_374_1528">
                                    <rect width="18" height="18" fill="white" />
                                </clipPath>
                                <clipPath id="clip1_374_1528">
                                    <rect width="18" height="18" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>

                        <span className={mobileCompact ? "font-normal" : "text-[13px] font-bold pr-[4px] tablet:pr-[0px]"}>{balance !== null ? balance : "..."}</span>
                    </div>
                </button>

                <div ref={menuRef} className={mobileCompact ? "relative" : "relative ml-[8px]"}>
                    {/* Avatar button */}
                    <button
                        onClick={() => setShowMenu(v => !v)}
                        className={`w-[32px] h-[32px] rounded-[33px] flex items-center justify-center transition-all select-none ${mobileCompact ? "text-[12.25px] font-normal leading-[1.4] tracking-[0.1225px]" : "text-sm font-bold"} ${showMenu
                            ? "ring-2 ring-[#FF3F2A] ring-offset-1"
                            : "hover:ring-2 hover:ring-gray-200"
                            } ${user?.image ? "overflow-hidden" : mobileCompact ? "bg-[#445B64] text-white" : "bg-gradient-to-br from-[#FF3F2A] to-[#ff7043] text-white"}`}
                        title="Account"
                    >
                        {user.image
                            ? <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                            : initial}
                    </button>

                    {/* Popup Menu */}
                    {showMenu && (
                        <div className="absolute right-[0px] top-full z-[300] mt-[8px] w-[240px] overflow-hidden rounded-2xl border border-gray-100 bg-white py-[4px] shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* User info */}
                            <div className="px-[20px] py-[16px] flex items-center gap-[12px]">
                                <div className="w-[40px] h-[40px] rounded-full bg-[#4A646C] text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                                    {initial}
                                </div>
                                <div className="min-w-[0px]">
                                    <p className="text-[15px] font-medium text-gray-900 truncate">{user.name || "User"}</p>
                                    <p className="text-[13px] text-gray-400 truncate mt-[2px]">{user.email}</p>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 mx-[20px] my-[4px]" />

                            {/* Menu Items */}
                            <div className="py-[8px] j-t3 text-black">
                                <a
                                    href="/"
                                    onClick={() => setShowMenu(false)}
                                    className="tablet:hidden w-full text-left px-[20px] py-[10px] hover:bg-gray-50 transition-colors flex items-center"
                                >
                                    Visit website
                                </a>
                                <button
                                    onClick={() => { setShowBalance(true); setShowMenu(false); }}
                                    className="w-full text-left px-[20px] py-[10px] hover:bg-gray-50 transition-colors"
                                >
                                    My Lucky Balance
                                </button>
                                <button
                                    onClick={() => { router.push("/account/settings"); setShowMenu(false); }}
                                    className="w-full text-left px-[20px] py-[10px] hover:bg-gray-50 transition-colors"
                                >
                                    Setting
                                </button>
                            </div>

                            <div className="h-px bg-gray-100 mx-[20px] my-[4px]" />

                            <div className="py-[8px]">
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="w-full px-[20px] py-[10px] text-left text-[#EC2E2E] transition-colors hover:bg-[#fef2f2]"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
