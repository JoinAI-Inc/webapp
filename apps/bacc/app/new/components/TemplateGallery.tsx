"use client";

import { useState } from "react";
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
    tags: string[];
    tagIds: string[];
}

export function TemplateGallery({
    initialTags,
    initialTemplates
}: {
    initialTags: Tag[];
    initialTemplates: Template[];
}) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const router = useRouter();

    // Filter templates
    const filteredTemplates = selectedTag
        ? initialTemplates.filter(t => t.tagIds.includes(selectedTag))
        : initialTemplates;

    return (
        <div>
            {/* Tag Filter */}
            <div className="flex flex-wrap gap-3 mb-10">
                <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${selectedTag === null
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    All
                </button>
                {initialTags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => setSelectedTag(tag.id)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${selectedTag === tag.id
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredTemplates.map(template => (
                    <Link
                        href={`/new/generate/${template.id}`}
                        key={template.id}
                        className="group relative flex flex-col cursor-pointer transition-transform hover:-translate-y-1"
                    >
                        <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-300">
                            <Image
                                src={template.imageUrl}
                                alt={template.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Favorite Button Overlay */}
                            <button
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors z-10 flex items-center justify-center pointer-events-auto"
                                onClick={(e) => {
                                    e.preventDefault();
                                    router.push("/login");
                                }}
                            >
                                <Heart size={20} className="drop-shadow-sm" />
                            </button>

                            {/* Stats overlay */}
                            <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex justify-between items-end">
                                <span className="font-semibold px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-sm">
                                    Use Template
                                </span>
                                <span className="text-sm font-medium drop-shadow-md flex items-center gap-1">
                                    <Heart size={14} fill="currentColor" /> {template.favoriteCount}
                                </span>
                            </div>
                        </div>

                        <div className="px-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{template.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                {template.theme && <span>{template.theme}</span>}
                                {template.theme && template.resolution && <span>•</span>}
                                {template.resolution && <span>Ratio {template.resolution}</span>}
                            </div>
                        </div>
                    </Link>
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
