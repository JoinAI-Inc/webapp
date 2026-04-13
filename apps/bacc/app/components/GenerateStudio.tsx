"use client";

import Image from "next/image";
import { TemplateGallery } from "./TemplateGallery";
import { MyGallery } from "./MyGallery";
import { FavoritesPanel } from "./FavoritesPanel";
import { TemplateDetailPanel } from "./TemplateDetailPanel";
import { useGenerateContext } from "./GenerateLayoutProvider";

interface Tag { id: string; name: string; }
interface Template {
    id: string; name: string; imageUrl: string;
    resolution: string | null; theme: string | null;
    favoriteCount: number; tags: { id: string; name: string }[];
}

export function GenerateStudio({
    tags,
    templates,
}: {
    tags: Tag[];
    templates: Template[];
}) {
    const {
        activeTab, setActiveTab,
        latestTaskId, setLatestTaskId,
        selectedTemplateId, setSelectedTemplateId
    } = useGenerateContext();

    return (
        <main className="w-full h-full overflow-y-auto flex justify-center">
            <div className="w-[92vw] max-w-[92vw] desktop:max-w-[1600px] py-[20px]">
                {activeTab === "idea" && !selectedTemplateId && (
                    <div className="p-0">
                        <div className="j-h5 text-gray-900 mb-1 flex items-center gap-2">
                            <Image src="/new-home/icon-idea.png" alt="idea" width={24} height={24} />
                            Ideas for You
                        </div>
                        <div className="mt-5">
                            <TemplateGallery
                                initialTags={tags}
                                initialTemplates={templates}
                                onSelect={(id) => setSelectedTemplateId(id)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "idea" && selectedTemplateId && (
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

                {activeTab === "favorites" && (
                    <div className="p-8">
                        <FavoritesPanel onSelect={(id) => { setActiveTab("idea"); setSelectedTemplateId(id); }} />
                    </div>
                )}
            </div>

        </main>
    );
}
