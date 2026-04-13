"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Flame, Camera } from "lucide-react";

const ICON_FAVORITE_UNLIKE = '/new-home/icon-favorite-unlike.png';
const ICON_FAVORITE_UNLIKE_HOVER = '/new-home/icon-favorite-unlike-hover.png';
const ICON_FAVORITE_LIKE = '/new-home/icon-favorite-like.png';

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
    isFavorited?: boolean;
    tags: { id: string; name: string }[];
}


export function TemplateGallery({
    initialTags,
    initialTemplates,
    onSelect,
}: {
    initialTags: Tag[];
    initialTemplates: Template[];
    onSelect?: (templateId: string) => void;
}) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [loading, setLoading] = useState(false);
    const [colCount, setColCount] = useState(5);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const updateColCount = () => {
            const w = window.innerWidth;
            if (w >= 1440) setColCount(6);
            else if (w >= 1068) setColCount(5);
            else if (w >= 735) setColCount(4);
            else if (w >= 480) setColCount(3);
            else setColCount(2);
        };
        updateColCount();
        window.addEventListener('resize', updateColCount);
        return () => window.removeEventListener('resize', updateColCount);
    }, []);

    const handleFavoriteChange = useCallback((id: string, isFavorited: boolean, favoriteCount: number) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavorited, favoriteCount } : t));
    }, []);
    // 用 ref 缓存收藏 ID 集合，避免重复请求
    const favoritedIds = useRef<Set<string>>(new Set());

    // 客户端挂载后同步收藏状态
    useEffect(() => {
        fetch("/api/templates/favorites")
            .then(r => r.ok ? r.json() : [])
            .then((data: Array<{ id: string }>) => {
                if (!Array.isArray(data) || data.length === 0) return;
                const ids = new Set(data.map(t => t.id));
                favoritedIds.current = ids;
                setTemplates(prev => prev.map(t => ({ ...t, isFavorited: ids.has(t.id) })));
            })
            .catch(() => { });
    }, []);

    const handleTagSelect = useCallback(async (tagId: string | null) => {
        setSelectedTag(tagId);
        setLoading(true);
        try {
            const url = tagId
                ? `/api/templates?tagIds=${tagId}&pageSize=100`
                : `/api/templates?pageSize=100`;
            const res = await fetch(url);
            const json = await res.json();
            const list: Template[] = Array.isArray(json) ? json : (json.data || []);
            // 合并本地收藏状态
            const ids = favoritedIds.current;
            setTemplates(ids.size > 0 ? list.map(t => ({ ...t, isFavorited: ids.has(t.id) })) : list);
        } catch {
            // 静默失败，保留当前数据
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredTemplates = templates;

    const columns = useMemo(() => {
        const cols: Template[][] = Array.from({ length: colCount }, () => []);
        const colHeights = new Array(colCount).fill(0);

        filteredTemplates.forEach(template => {
            let ratio = 1;
            if (template.resolution) {
                const match = template.resolution.match(/(\d+)[xX*](\d+)/);
                if (match) {
                    const w = parseInt(match[1], 10);
                    const h = parseInt(match[2], 10);
                    if (w > 0 && h > 0) {
                        ratio = Math.max(0.5, Math.min(2.5, h / w));
                    }
                }
            }

            let minIdx = 0;
            let minH = colHeights[0];
            for (let i = 1; i < colCount; i++) {
                if (colHeights[i] < minH) {
                    minH = colHeights[i];
                    minIdx = i;
                }
            }

            cols[minIdx].push(template);
            colHeights[minIdx] += ratio + 0.04;
        });

        return cols;
    }, [filteredTemplates, colCount]);

    return (
        <div>
            {/* Tag Filter */}
            <div className="flex flex-wrap gap-[6px] tablet:gap-[8px] mb-5">
                <button
                    onClick={() => handleTagSelect(null)}
                    className={`px-[12px] tablet:px-[16px] h-[32px] rounded-[16px] j-t2 tablet:j-t3 transition-colors border ${selectedTag === null
                        ? "bg-red-50 text-red-500 border-red-200"
                        : "bg-transparent text-[#6A696C] border-transparent hover:bg-[#F2F2F3] "
                        }`}
                >
                    ALL
                </button>
                {initialTags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => handleTagSelect(tag.id)}
                        className={`px-4 py-1 rounded-full text-sm font-medium transition-colors border ${selectedTag === tag.id
                            ? "bg-red-50 text-red-500 border-red-200"
                            : "bg-transparent text-[#6A696C] border-transparent hover:bg-[#F2F2F3]"
                            }`}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>

            {/* JS Computed Masonry Layout */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-lg">
                        <span className="text-sm text-gray-400">Loading...</span>
                    </div>
                )}

                {!mounted ? (
                    <div className="w-full columns-2 mobile-l:columns-3 tablet:columns-4 desktop:columns-5 desktop-l:columns-6 gap-x-[4px]">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="break-inside-avoid mb-[8px] tablet:mb-[4px]">
                                <TemplateCard
                                    template={template}
                                    onLoginRequired={() => router.push("/login")}
                                    onSelect={onSelect}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full flex gap-[4px] items-start">
                        {columns.map((col, i) => (
                            <div key={i} className="flex flex-col gap-[8px] tablet:gap-[4px] flex-1 min-w-0">
                                {col.map(template => (
                                    <div key={template.id} className="w-full">
                                        <TemplateCard
                                            template={template}
                                            onLoginRequired={() => router.push("/login")}
                                            onSelect={onSelect}
                                            onFavoriteChange={handleFavoriteChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
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
    onSelect,
    onFavoriteChange,
}: {
    template: Template;
    onLoginRequired: () => void;
    onSelect?: (templateId: string) => void;
    onFavoriteChange?: (id: string, isFavorited: boolean, count: number) => void;
}) {
    const [isFavorited, setIsFavorited] = useState(template.isFavorited ?? false);
    const [favoriteCount, setFavoriteCount] = useState(template.favoriteCount);
    const [loading, setLoading] = useState(false);

    // 当父组件同步收藏状态时更新本地 state
    useEffect(() => {
        setIsFavorited(template.isFavorited ?? false);
    }, [template.isFavorited]);

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
            const newCount = data.isFavorited ? favoriteCount + 1 : Math.max(0, favoriteCount - 1);
            setIsFavorited(data.isFavorited);
            setFavoriteCount(newCount);
            if (onFavoriteChange) {
                onFavoriteChange(template.id, data.isFavorited, newCount);
            }
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
            <div className="relative w-full overflow-hidden shadow-sm group-hover:shadow-lg transition-all duration-300 rounded-[16px] mb-0">
                {/* 既然不依赖 resolution 字段提前算高度，就让浏览器自动通过真实图片撑开即可 */}
                <Image
                    src={template.imageUrl}
                    alt={template.name}
                    width={400}
                    height={400}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    className="transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Favorite Button */}
                <button
                    className="group/btn absolute top-3 right-3 z-10 pointer-events-auto transition-transform hover:scale-105 active:scale-95"
                    onClick={handleFavorite}
                    disabled={loading}
                >
                    {isFavorited ? (
                        <Image src={ICON_FAVORITE_LIKE} alt="Liked" width={28} height={28} priority={false} />
                    ) : (
                        <>
                            <Image src={ICON_FAVORITE_UNLIKE} alt="Like" width={28} height={28} className="group-hover/btn:hidden" priority={false} />
                            <Image src={ICON_FAVORITE_UNLIKE_HOVER} alt="Like Focus" width={28} height={28} className="hidden group-hover/btn:block" priority={false} />
                        </>
                    )}
                </button>

                {/* Stats and Info overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none flex flex-col justify-end translate-y-4 group-hover:translate-y-0 z-10">
                    <h3 className="font-semibold text-[22px] leading-tight line-clamp-2 mb-2 drop-shadow-md">
                        {template.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[15px] font-medium drop-shadow-md mb-4 text-white/90">
                        <Flame size={18} strokeWidth={2.5} /> {favoriteCount}
                    </div>
                    <div className="w-full h-[44px] bg-[#EE3F3E] text-white rounded-full flex items-center justify-center gap-2 font-medium pointer-events-auto transition-transform hover:scale-[1.02] active:scale-95 shadow-lg">
                        <Camera size={20} /> Use Template
                    </div>
                </div>
            </div>
        </div>
    );

    if (onSelect) return cardContent;
    return <Link href={`/generate/${template.id}`}>{cardContent}</Link>;
}
