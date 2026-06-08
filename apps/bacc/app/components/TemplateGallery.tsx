"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Flame } from "lucide-react";

const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || "https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image").replace(/\/$/, "");
const ICON_FAVORITE_UNLIKE = `${IMAGE_URL}/new-home/icon-favorite-unlike.png`;
const ICON_FAVORITE_UNLIKE_HOVER = `${IMAGE_URL}/new-home/icon-favorite-unlike-hover.png`;
const ICON_FAVORITE_LIKE = `${IMAGE_URL}/new-home/icon-favorite-like.png`;

function GatherLuckIcon() {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="size-[24px] shrink-0"
        >
            <path d="M21.408 11.064V15.528C21.408 18.072 19.344 20.148 16.8 20.148H7.20004C4.65604 20.148 2.59204 18.072 2.59204 15.528V9.49196C2.59204 6.94796 4.65604 4.88396 7.20004 4.88396H8.62804L8.91604 3.74396C9.00004 3.38396 9.32404 3.13196 9.69604 3.13196H14.304C14.676 3.13196 15 3.38396 15.084 3.74396L15.18 4.15196C14.784 4.31996 14.436 4.57196 14.172 4.88396C13.812 5.29196 13.572 5.81996 13.524 6.38396C13.512 6.41996 13.512 6.45596 13.512 6.50396H7.20004C5.55604 6.50396 4.21204 7.84796 4.21204 9.49196V15.528C4.21204 17.184 5.55604 18.528 7.20004 18.528H16.8C18.444 18.528 19.788 17.184 19.788 15.528V12.216C20.46 12.06 21.048 11.64 21.408 11.064Z" fill="white" />
            <path d="M12.0001 7.91992C9.46805 7.91992 7.40405 9.98392 7.40405 12.5159C7.40405 15.0479 9.46805 17.1119 12.0001 17.1119C14.5321 17.1119 16.5961 15.0479 16.5961 12.5159C16.5961 11.2079 16.0441 10.0319 15.1681 9.17992C14.8801 8.90392 14.5441 8.66392 14.1841 8.47192H14.1721C13.5241 8.12392 12.7801 7.91992 12.0001 7.91992ZM14.9761 12.5159C14.9761 14.1599 13.6441 15.4919 12.0001 15.4919C10.3561 15.4919 9.02405 14.1599 9.02405 12.5159C9.02405 10.8719 10.3561 9.53992 12.0001 9.53992C13.6441 9.53992 14.9761 10.8719 14.9761 12.5159Z" fill="white" />
            <path d="M22.3921 5.61594C21.3721 5.23194 20.5681 4.42794 20.1841 3.39594C20.0161 2.95194 19.6081 2.66394 19.1281 2.66394C18.6481 2.66394 18.2521 2.95194 18.0841 3.39594C17.8561 3.98394 17.4961 4.49994 17.0401 4.89594C16.7041 5.20794 16.3081 5.44794 15.8641 5.61594C15.6961 5.67594 15.5521 5.77194 15.4441 5.89194C15.4441 5.89194 15.4441 5.89594 15.4441 5.90394C15.3601 5.98794 15.3001 6.07194 15.2521 6.17994C15.1921 6.27594 15.1681 6.38394 15.1441 6.50394C15.1321 6.55194 15.1321 6.61194 15.1321 6.67194C15.1321 7.13994 15.4201 7.55994 15.8761 7.72794C16.8961 8.11194 17.7001 8.91594 18.0961 9.94794C18.2641 10.3919 18.6721 10.6799 19.1401 10.6799C19.3801 10.6799 19.6081 10.6079 19.8001 10.4639C19.9801 10.3439 20.1121 10.1639 20.1961 9.94794C20.4241 9.33594 20.7961 8.79594 21.2881 8.39994C21.6121 8.09994 21.9961 7.87194 22.4041 7.71594C22.8481 7.55994 23.1361 7.13994 23.1361 6.67194C23.1361 6.20394 22.8481 5.78394 22.4041 5.61594H22.3921ZM19.4041 8.02794C19.3081 8.15994 19.2121 8.29194 19.1281 8.42394C18.6841 7.71594 18.0841 7.11594 17.3761 6.67194C17.4121 6.64794 17.4601 6.62394 17.4961 6.58794C18.0001 6.25194 18.4561 5.84394 18.8161 5.35194C18.9241 5.20794 19.0321 5.06394 19.1281 4.90794C19.5721 5.62794 20.1721 6.22794 20.8801 6.67194C20.7841 6.73194 20.6881 6.80394 20.5921 6.87594C20.1361 7.18794 19.7401 7.58394 19.4041 8.02794Z" fill="white" />
        </svg>
    );
}

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
    const { status: sessionStatus } = useSession();
    const isAuthenticated = sessionStatus === "authenticated";
    // 用 ref 缓存收藏 ID 集合，避免切换标签时重复请求
    const favoritedIds = useRef<Set<string>>(new Set());

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
        const ids = new Set(favoritedIds.current);
        if (isFavorited) ids.add(id);
        else ids.delete(id);
        favoritedIds.current = ids;
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavorited, favoriteCount } : t));
    }, []);
    // 客户端挂载后同步收藏状态
    useEffect(() => {
        if (sessionStatus === "loading") return;

        if (!isAuthenticated) {
            favoritedIds.current = new Set();
            setTemplates(prev => prev.map(t => ({ ...t, isFavorited: false })));
            return;
        }

        let cancelled = false;
        fetch("/api/templates/favorites")
            .then(r => r.ok ? r.json() : [])
            .then((data: Array<{ id: string }>) => {
                if (cancelled) return;
                const ids = Array.isArray(data) ? new Set(data.map(t => t.id)) : new Set<string>();
                favoritedIds.current = ids;
                setTemplates(prev => prev.map(t => ({ ...t, isFavorited: ids.has(t.id) })));
            })
            .catch(() => { });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, sessionStatus]);

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
            setTemplates(list.map(t => ({ ...t, isFavorited: isAuthenticated && ids.has(t.id) })));
        } catch {
            // 静默失败，保留当前数据
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

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
            <div className="flex flex-wrap gap-[6px] tablet:gap-[8px] mb-[20px]">
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
                        className={`px-[16px] py-[4px] rounded-full text-sm font-medium transition-colors border ${selectedTag === tag.id
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
                    <div className="absolute inset-[0px] bg-white/60 flex items-center justify-center z-10 rounded-lg">
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
                                    isAuthenticated={isAuthenticated}
                                    isAuthLoading={sessionStatus === "loading"}
                                    onSelect={onSelect}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full flex gap-[4px] items-start">
                        {columns.map((col, i) => (
                            <div key={i} className="flex flex-col gap-[8px] tablet:gap-[4px] flex-1 min-w-[0px]">
                                {col.map(template => (
                                    <div key={template.id} className="w-full">
                                        <TemplateCard
                                            template={template}
                                            onLoginRequired={() => router.push("/login")}
                                            isAuthenticated={isAuthenticated}
                                            isAuthLoading={sessionStatus === "loading"}
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
                <div className="text-center py-[80px] text-gray-500">
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
    isAuthenticated,
    isAuthLoading,
}: {
    template: Template;
    onLoginRequired: () => void;
    onSelect?: (templateId: string) => void;
    onFavoriteChange?: (id: string, isFavorited: boolean, count: number) => void;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
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
        if (isAuthLoading || loading) return;

        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

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
            className="group relative flex flex-col cursor-pointer"
            onClick={onSelect ? () => onSelect(template.id) : undefined}
        >
            <div className="relative w-full overflow-hidden rounded-[4px] mb-[0px]">
                {/* 既然不依赖 resolution 字段提前算高度，就让浏览器自动通过真实图片撑开即可 */}
                <Image
                    src={template.imageUrl}
                    alt={template.name}
                    width={400}
                    height={400}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    className="rounded-[4px]"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-[0px] rounded-[4px] bg-[rgba(0,0,0,0.44)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />

                {/* Favorite Button */}
                <button
                    className="group/btn absolute right-[16px] top-[16px] z-10 flex size-[32px] cursor-pointer items-center justify-center rounded-[21px] bg-[rgba(10,7,8,0.48)] p-[4px] opacity-0 backdrop-blur-[16px] transition-[opacity,transform] duration-200 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto active:scale-95 disabled:cursor-default"
                    onClick={handleFavorite}
                    disabled={isAuthLoading || loading}
                >
                    {isFavorited ? (
                        <Image src={ICON_FAVORITE_LIKE} alt="Liked" width={24} height={24} priority={false} />
                    ) : (
                        <>
                            <Image src={ICON_FAVORITE_UNLIKE} alt="Like" width={24} height={24} className="group-hover/btn:hidden" priority={false} />
                            <Image src={ICON_FAVORITE_UNLIKE_HOVER} alt="Like Focus" width={24} height={24} className="hidden group-hover/btn:block" priority={false} />
                        </>
                    )}
                </button>

                {/* Stats and Info overlay */}
                <div className="absolute inset-x-[16px] bottom-[13px] z-10 flex flex-col gap-[16px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
                    <div className="flex flex-col gap-[8px] px-[4px]">
                        <h3 className="font-medium text-[17px] leading-[1.4] tracking-[0.17px] line-clamp-2">
                            {template.name}
                        </h3>
                        <div className="flex items-center text-[14px] font-normal leading-[1.4] tracking-[0.14px] text-white">
                            <Flame size={18} strokeWidth={2.5} /> {favoriteCount}
                        </div>
                    </div>
                    <div className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[24px] bg-[#EC2E2E] px-[16px] py-[8px] text-white pointer-events-auto active:scale-95">
                        <GatherLuckIcon />
                        <span className="j-t2 whitespace-nowrap">Gather your luck</span>
                    </div>
                </div>
            </div>
        </div>
    );

    if (onSelect) return cardContent;
    return <Link href={`/generate/${template.id}`}>{cardContent}</Link>;
}
