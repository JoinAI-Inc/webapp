'use client';

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, User } from "lucide-react";

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-shimmer tracking-tighter">
                    新年快乐
                </Link>
                <div className="flex items-center gap-6">
                    <Link
                        href="/studio/magic"
                        className="text-cny-ivory/60 hover:text-cny-gold transition-colors font-bold text-sm uppercase tracking-widest"
                    >
                        Magic Studio
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-cny-ivory/80 text-sm">
                                <User className="w-4 h-4" />
                                <span>{user.name}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 text-cny-ivory/60 hover:text-cny-gold transition-colors text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 bg-cny-gold/10 hover:bg-cny-gold/20 border border-cny-gold/20 rounded-lg text-cny-gold transition-all text-sm font-medium"
                        >
                            <LogIn className="w-4 h-4" />
                            登录
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

