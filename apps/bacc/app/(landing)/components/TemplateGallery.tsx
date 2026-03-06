"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

interface Tag {
    id: string;
    name: string;
}

interface Template {
    id: string;
    name: string;
    imageUrl: string;
    resolution: string | null;
    theme: string | null;
    favoriteCount: number;
    tags: { id: string; name: string }[];
}

export function TemplateGallery({
    initialTags,
    initialTemplates,
    compact = false,
    onSelect,
}: {
    initialTags: Tag[];
    initialTemplates: Template[];
    compact?: boolean;
    onSelect?: (templateId: string) => void;
}) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleTagSelect = useCallback(async (tagId: string | null) => {
        setSelectedTag(tagId);
        setLoading(true);
        try {
            const url = tagId
                ? `/api/templates?tagIds=${tagId}&pageSize=100`
                : `/api/templates?pageSize=100`;
            const res = await fetch(url);
            const json = await res.json();
            setTemplates(Array.isArray(json) ? json : (json.data || []));
        } catch {
            // 静默失败，保留当前数据
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredTemplates = templates;

    return (
        <div>
            {/* Tag Filter */}
            <div className={`flex flex-wrap gap-2 ${compact ? 'mb-5' : 'mb-10'}`}>
                <button
                    onClick={() => handleTagSelect(null)}
                    className={`${compact ? 'px-4 py-1' : 'px-5 py-2'} rounded-full text-sm font-medium transition-colors ${selectedTag === null
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    ALL
                </button>
                {initialTags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => handleTagSelect(tag.id)}
                        className={`${compact ? 'px-4 py-1' : 'px-5 py-2'} rounded-full text-sm font-medium transition-colors ${selectedTag === tag.id
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>

            {/* Template Grid */}
            <div className={`relative ${compact
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                }`}>
                {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-lg">
                        <span className="text-sm text-gray-400">Loading...</span>
                    </div>
                )}
                {filteredTemplates.map(template => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        compact={compact}
                        onLoginRequired={() => router.push("/login")}
                        onSelect={onSelect}
                    />
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    No templates found for this category.
                </div>
            )}
        </div>
    );
}

function TemplateCard({
    template,
    onLoginRequired,
    compact = false,
    onSelect,
}: {
    template: Template;
    onLoginRequired: () => void;
    compact?: boolean;
    onSelect?: (templateId: string) => void;
}) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(template.favoriteCount);
    const [loading, setLoading] = useState(false);

    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/templates/${template.id}/favorite`, {
                method: "POST",
            });

            if (res.status === 401) {
                onLoginRequired();
                return;
            }

            if (!res.ok) return;

            const data = await res.json();
            setIsFavorited(data.isFavorited);
            setFavoriteCount(prev => data.isFavorited ? prev + 1 : Math.max(0, prev - 1));
        } catch {
            // 静默失败
        } finally {
            setLoading(false);
        }
    };

    const cardContent = (
        <div
            className="group relative flex flex-col cursor-pointer transition-transform hover:-translate-y-1"
            onClick={onSelect ? () => onSelect(template.id) : undefined}
        >
            <div className={`relative w-full aspect-[2/3] overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-lg transition-all duration-300 ${compact ? 'rounded-xl mb-0' : 'rounded-2xl mb-4'}`}>
                <Image
                    src={template.imageUrl}
                    alt={template.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Favorite Button - hidden in compact */}
                {!compact && (
                    <button
                        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-colors z-10 flex items-center justify-center pointer-events-auto ${isFavorited
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-white/20 text-white hover:bg-white/40"
                            }`}
                        onClick={handleFavorite}
                        disabled={loading}
                    >
                        <Heart
                            size={20}
                            className="drop-shadow-sm"
                            fill={isFavorited ? "currentColor" : "none"}
                        />
                    </button>
                )}

                {/* Stats overlay */}
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex justify-between items-end">
                    <span className="font-semibold px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-sm">
                        Use Template
                    </span>
                    <span className="text-sm font-medium drop-shadow-md flex items-center gap-1">
                        <Heart size={14} fill="currentColor" /> {favoriteCount}
                    </span>
                </div>
            </div>

            {/* Text info - hidden in compact */}
            {!compact && (
                <div className="px-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{template.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {template.theme && <span>{template.theme}</span>}
                        {template.theme && template.resolution && <span>•</span>}
                        {template.resolution && <span>Ratio {template.resolution}</span>}
                    </div>
                </div>
            )}
        </div>
    );

    if (onSelect) return cardContent;
    return <Link href={`/generate/${template.id}`}>{cardContent}</Link>;
}
