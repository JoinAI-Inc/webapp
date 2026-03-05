"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, FolderOpen } from "lucide-react";
import { TemplateGallery } from "./TemplateGallery";
import { MyGallery } from "./MyGallery";
import { UserMenuButton } from "./UserMenu";
import { TemplateDetailPanel } from "./TemplateDetailPanel";

interface Tag { id: string; name: string; }
interface Template {
    id: string; name: string; imageUrl: string;
    resolution: string | null; theme: string | null;
    favoriteCount: number; tags: string[]; tagIds: string[];
}

type TabType = "templates" | "gallery";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

export function GenerateStudio({
    tags,
    templates,
}: {
    tags: Tag[];
    templates: Template[];
}) {
    const [activeTab, setActiveTab] = useState<TabType>("templates");
    const [latestTaskId, setLatestTaskId] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const sidebarItems: { tab: TabType; Icon: React.ElementType; label: string }[] = [
        { tab: "templates", Icon: LayoutGrid, label: "Templates" },
        { tab: "gallery", Icon: FolderOpen, label: "My Gallery" },
    ];

    return (
        <div className="flex h-screen bg-[#f8f8f8] overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-[52px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-5 z-10">
                {/* Logo */}
                <Link href="/" className="mb-3 flex items-center justify-center">
                    <Image
                        src={`${IMAGE_URL}/new-home/icon-web.png`}
                        alt="lucky-photo"
                        width={28}
                        height={28}
                        className="object-contain"
                    />
                </Link>

                {/* Nav Icons */}
                {sidebarItems.map(({ tab, Icon, label }) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            title={label}
                            onClick={() => { setActiveTab(tab); setSelectedTemplateId(null); }}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isActive
                                ? "bg-[#FF3F2A]/10 text-[#FF3F2A]"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                        </button>
                    );
                })}

                {/* Bottom: User Button */}
                <div className="mt-auto">
                    <UserMenuButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {activeTab === "templates" && !selectedTemplateId && (
                    <div className="p-8">
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                            💡 Ideas for You
                        </h1>
                        <div className="mt-5">
                            <TemplateGallery
                                initialTags={tags}
                                initialTemplates={templates}
                                compact
                                onSelect={(id) => setSelectedTemplateId(id)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "templates" && selectedTemplateId && (
                    <TemplateDetailPanel
                        templateId={selectedTemplateId}
                        onBack={() => setSelectedTemplateId(null)}
                        onTaskSubmitted={(taskId) => {
                            setLatestTaskId(taskId);
                        }}
                    />
                )}

                {activeTab === "gallery" && (
                    <div className="p-8">
                        <MyGallery newTaskId={latestTaskId} forceVisible />
                    </div>
                )}
            </main>
        </div>
    );
}
