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
            <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="text-gray-400 animate-spin" />
            </div>
        );
    }

    if (sessionStatus !== "authenticated") {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                <Heart size={36} className="text-gray-300" />
                <p className="text-sm">Login to see your favorites</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-5">
                <Heart size={20} className="text-[#FF3F2A]" fill="currentColor" />
                <h2 className="text-xl font-extrabold text-gray-900">Favorites</h2>
            </div>

            {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                    <Heart size={40} className="text-gray-300" />
                    <p className="text-sm text-center">
                        No favorites yet.<br />Heart a template to save it here!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {templates.map(t => (
                        <div
                            key={t.id}
                            className="group relative cursor-pointer transition-transform hover:-translate-y-1"
                            onClick={() => onSelect(t.id)}
                        >
                            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-sm group-hover:shadow-lg transition-all duration-300">
                                <Image
                                    src={t.imageUrl}
                                    alt={t.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 768px) 50vw, 20vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-end text-white">
                                    <span className="text-xs font-semibold px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg">
                                        Use
                                    </span>
                                    <span className="text-xs flex items-center gap-0.5">
                                        <Heart size={11} fill="currentColor" /> {t.favoriteCount}
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
