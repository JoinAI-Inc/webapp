'use client';

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, User } from "lucide-react";

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-[0px] left-[0px] right-[0px] z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-[24px] py-[16px] flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-shimmer tracking-tighter">
                    新年快乐
                </Link>
                <div className="flex items-center gap-[24px]">
                    <Link
                        href="/studio/magic"
                        className="text-cny-ivory/60 hover:text-cny-gold transition-colors font-bold text-sm uppercase tracking-widest"
                    >
                        Magic Studio
                    </Link>

                    {user && (
                        <Link
                            href="/history"
                            className="text-cny-ivory/60 hover:text-cny-gold transition-colors font-bold text-sm uppercase tracking-widest"
                        >
                            历史记录
                        </Link>
                    )}

                    {user ? (
                        <div className="flex items-center gap-[16px]">
                            <div className="flex items-center gap-[8px] text-cny-ivory/80 text-sm">
                                <User className="w-[16px] h-[16px]" />
                                <span>{user.name}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-[8px] px-[16px] py-[8px] text-cny-ivory/60 hover:text-cny-gold transition-colors text-sm"
                            >
                                <LogOut className="w-[16px] h-[16px]" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-[8px] px-[16px] py-[8px] bg-cny-gold/10 hover:bg-cny-gold/20 border border-cny-gold/20 rounded-lg text-cny-gold transition-all text-sm font-medium"
                        >
                            <LogIn className="w-[16px] h-[16px]" />
                            登录
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

