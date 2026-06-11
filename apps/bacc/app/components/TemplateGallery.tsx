"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Flame } from "lucide-react";
import { resolveFavoriteState } from "./template-favorite-state";

const ICON_FAVORITE_UNLIKE = `/assets/icon-favorite-unlike.svg`;
const ICON_FAVORITE_LIKE = `/assets/icon-favorite-like.svg`;

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
    const [favoriteStatusLoading, setFavoriteStatusLoading] = useState(true);
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const isAuthenticated = sessionStatus === "authenticated";
    // 用 ref 缓存收藏 ID 集合，避免切换标签时重复请求
    const favoritedIds = useRef<Set<string>>(new Set());



    const handleFavoriteChange = useCallback((id: string, isFavorited: boolean, favoriteCount: number) => {
        const ids = new Set(favoritedIds.current);
        if (isFavorited) ids.add(id);
        else ids.delete(id);
        favoritedIds.current = ids;
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavorited, favoriteCount } : t));
    }, []);
    // 客户端挂载后同步收藏状态
    useEffect(() => {
        if (sessionStatus === "loading") {
            setFavoriteStatusLoading(true);
            return;
        }

        if (!isAuthenticated) {
            favoritedIds.current = new Set();
            setTemplates(prev => prev.map(t => ({ ...t, isFavorited: false })));
            setFavoriteStatusLoading(false);
            return;
        }

        let cancelled = false;
        setFavoriteStatusLoading(true);
        fetch("/api/templates/favorites")
            .then(r => r.ok ? r.json() : [])
            .then((data: Array<{ id: string }>) => {
                if (cancelled) return;
                const ids = Array.isArray(data) ? new Set(data.map(t => t.id)) : new Set<string>();
                favoritedIds.current = ids;
                setTemplates(prev => prev.map(t => ({ ...t, isFavorited: ids.has(t.id) })));
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) setFavoriteStatusLoading(false);
            });

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

            {/* CSS Grid Auto-fill Layout */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-[0px] bg-white/60 flex items-center justify-center z-10 rounded-lg">
                        <span className="text-sm text-gray-400">Loading...</span>
                    </div>
                )}

                <style>{`
                    .template-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }
                    @media (min-width: 735px) {
                        .template-grid { grid-template-columns: repeat(3, 1fr); gap: 4px; }
                    }
                    @media (min-width: 1032px) {
                        .template-grid { grid-template-columns: repeat(4, 1fr); }
                    }
                    @media (min-width: 1280px) {
                        .template-grid { grid-template-columns: repeat(5, 1fr); }
                    }
                    @media (min-width: 1528px) {
                        .template-grid { grid-template-columns: repeat(6, 1fr); }
                    }
                    @media (max-width: 734px) {
                        .template-favorite-button {
                            opacity: 1;
                            pointer-events: auto;
                        }
                    }
                `}</style>
                <div className="template-grid w-full">
                    {filteredTemplates.map(template => (
                        <div key={template.id} className="template-item">
                            <TemplateCard
                                template={template}
                                onLoginRequired={() => router.push("/login")}
                                isAuthenticated={isAuthenticated}
                                isAuthLoading={sessionStatus === "loading"}
                                isFavoriteStatusLoading={favoriteStatusLoading}
                                onSelect={onSelect}
                                onFavoriteChange={handleFavoriteChange}
                            />
                        </div>
                    ))}
                </div>
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
    isFavoriteStatusLoading,
}: {
    template: Template;
    onLoginRequired: () => void;
    onSelect?: (templateId: string) => void;
    onFavoriteChange: (id: string, isFavorited: boolean, count: number) => void;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    isFavoriteStatusLoading: boolean;
}) {
    const [loading, setLoading] = useState(false);
    const isFavorited = template.isFavorited ?? false;

    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAuthLoading || isFavoriteStatusLoading || loading) return;

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
            const nextState = resolveFavoriteState(
                {
                    isFavorited,
                    favoriteCount: template.favoriteCount,
                },
                !!data.isFavorited,
            );
            onFavoriteChange(template.id, nextState.isFavorited, nextState.favoriteCount);
        } catch {
            // 静默失败
        } finally {
            setLoading(false);
        }
    };

    const cardBody = (
        <>
            <div className="relative w-full overflow-hidden rounded-[4px]">
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
                <div className="pointer-events-none absolute inset-[0px] hidden rounded-[4px] bg-[rgba(0,0,0,0.44)] opacity-0 transition-opacity duration-200 tablet:block tablet:group-hover:opacity-100" />

                {/* Stats and Info overlay */}
                <div className="pointer-events-none absolute inset-x-[16px] bottom-[13px] z-10 hidden flex-col gap-[16px] text-white opacity-0 transition-opacity duration-200 tablet:flex tablet:group-hover:opacity-100">
                    <div className="flex flex-col gap-[8px] px-[4px]">
                        <h3 className="j-l1">
                            {template.name}
                        </h3>
                        <div className="flex items-center j-t3 text-white">
                            <Flame size={16} strokeWidth={2.5} />
                            <span className="flex text-center">{template.favoriteCount}</span>
                        </div>
                    </div>
                    <div className="pointer-events-auto flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[24px] bg-[#EC2E2E] hover:bg-[#CB0707] px-[16px] py-[8px] text-white active:scale-95">
                        <GatherLuckIcon />
                        <span className="j-t2 whitespace-nowrap">Gather your luck</span>
                    </div>
                </div>
            </div>

            <div className="template-mobile-info mt-[8px] flex min-w-0 items-start justify-between gap-[8px] px-[2px] pb-[4px] tablet:hidden">
                <h3 className="j-l1 min-w-0 flex-1 truncate text-[#080606]">
                    {template.name}
                </h3>
                <div className="template-mobile-favorite-count j-t3 flex h-[16px] shrink-0 items-center gap-[3px] leading-none text-[#6A696C]">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        className="shrink-0"
                    >
                        <path
                            d="M8.00001 14.072C5.57601 14.072 3.60001 12.096 3.60001 9.67199C3.60001 8.46399 4.10401 7.29599 4.98401 6.47199C5.06401 6.39999 5.15201 6.31999 5.24801 6.23999C6.00801 5.56799 7.15201 4.55999 6.94401 2.52799C6.92001 2.31999 7.02401 2.11999 7.20001 2.00799C7.37601 1.90399 7.60001 1.90399 7.77601 2.02399C9.28801 3.03199 11.048 4.42399 11.224 6.22399C11.296 6.98399 11.104 7.75199 10.624 8.54399C10.8 8.40799 11 8.23199 11.208 8.02399C11.336 7.89599 11.528 7.83999 11.712 7.87999C11.896 7.91999 12.04 8.05599 12.096 8.23199C12.232 8.61599 12.384 9.12799 12.384 9.67999C12.384 12.104 10.408 14.08 7.98401 14.08L8.00001 14.072ZM8.02401 3.51199C7.83201 5.38399 6.64801 6.43199 5.96001 7.03999C5.87201 7.11999 5.79201 7.18399 5.72001 7.25599C5.05601 7.87999 4.67201 8.75999 4.67201 9.67199C4.67201 11.504 6.16001 12.992 7.99201 12.992C9.82401 12.992 11.312 11.504 11.312 9.67199C11.312 9.57599 11.312 9.47999 11.296 9.38399C10.232 10.208 9.49601 10.208 9.02401 10.208C8.80801 10.208 8.60801 10.08 8.52801 9.87199C8.44801 9.66399 8.48801 9.43999 8.64801 9.27999C9.75201 8.17599 10.248 7.20799 10.16 6.31999C10.072 5.43199 9.40801 4.54399 8.02401 3.50399V3.51199Z"
                            fill="#9B9A9D"
                        />
                    </svg>
                    <span className="leading-none tabular-nums">{template.favoriteCount}</span>
                </div>
            </div>
        </>
    );

    return (
        <div className="group relative flex flex-col">
            {onSelect ? (
                <div
                    className="cursor-pointer"
                    onClick={() => onSelect(template.id)}
                >
                    {cardBody}
                </div>
            ) : (
                <Link href={`/generate/${template.id}`} className="block">
                    {cardBody}
                </Link>
            )}

            {/* Keep this outside the detail link so favorite clicks cannot navigate. */}
            <button
                type="button"
                className="template-favorite-button absolute right-[16px] top-[16px] z-10 flex size-[32px] cursor-pointer items-center justify-center rounded-[21px] bg-[rgba(10,7,8,0.48)] p-[4px] opacity-0 backdrop-blur-[16px] transition-[background-color,opacity,transform] duration-200 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto hover:bg-[rgba(10,7,8,0.8)] active:scale-95 disabled:cursor-default"
                onClick={handleFavorite}
                aria-label={isFavorited ? "Unfavorite template" : "Favorite template"}
                aria-pressed={isFavorited}
                disabled={isAuthLoading || isFavoriteStatusLoading || loading}
            >
                {isFavorited ? (
                    <Image src={ICON_FAVORITE_LIKE} alt="Liked" width={24} height={24} priority={false} />
                ) : (
                    <Image src={ICON_FAVORITE_UNLIKE} alt="Like" width={24} height={24} priority={false} />
                )}
            </button>
        </div>
    );
}
