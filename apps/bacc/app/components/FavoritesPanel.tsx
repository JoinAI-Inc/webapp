"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface FavoriteTemplate {
    id: string;
    name: string;
    imageUrl: string;
    resolution: string | null;
    theme: string | null;
    favoriteCount: number;
}

export function FavoritesPanel({ onSelect }: { onSelect: (id: string) => void }) {
    const { status: sessionStatus } = useSession();
    const [templates, setTemplates] = useState<FavoriteTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionStatus !== "authenticated") return;
        setLoading(true);
        fetch("/api/templates/favorites")
            .then(r => r.json())
            .then(data => setTemplates(Array.isArray(data) ? data : []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [sessionStatus]);

    if (sessionStatus === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-[256px]">
                <Loader2 size={24} className="text-gray-400 animate-spin" />
            </div>
        );
    }

    if (sessionStatus !== "authenticated") {
        return (
            <div className="flex flex-col items-center justify-center h-[256px] text-gray-400 gap-[8px]">
                <Heart size={36} className="text-gray-300" />
                <p className="text-sm">Login to see your favorites</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-[12px] mb-[32px]">
                <Heart size={28} className="text-[#EC2E2E]" fill="currentColor" />
                <h2 className="text-2xl font-semibold text-[#080606] font-['Plus_Jakarta_Sans',_sans-serif]">Favorites</h2>
            </div>

            {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[256px] text-gray-400 gap-[12px]">
                    <Heart size={40} className="text-gray-300" />
                    <p className="text-sm text-center">
                        No favorites yet.<br />Heart a template to save it here!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 tablet:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5 desktop-l:grid-cols-6 gap-[12px]">
                    {templates.map(t => (
                        <div
                            key={t.id}
                            className="group relative cursor-pointer transition-transform hover:translate-y-[-4px]"
                            onClick={() => onSelect(t.id)}
                        >
                            <div className="relative w-full aspect-[2/3] rounded-[1rem] bg-[#e8e8e8] overflow-hidden shadow-[0_12px_40px_rgba(26,28,28,0.04)] group-hover:shadow-[0_12px_40px_rgba(26,28,28,0.08)] transition-all duration-300">
                                <Image
                                    src={t.imageUrl}
                                    alt={t.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 768px) 50vw, 20vw"
                                />
                                <div className="absolute inset-[0px] bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute bottom-[8px] left-[8px] right-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-end text-white">
                                    <span className="text-xs font-semibold px-[8px] py-[4px] bg-white/20 backdrop-blur-md rounded-lg">
                                        Use
                                    </span>
                                    <span className="text-xs flex items-center gap-[2px]">
                                        <Heart size={11} fill="currentColor" className="text-[#EC2E2E]" /> {t.favoriteCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
