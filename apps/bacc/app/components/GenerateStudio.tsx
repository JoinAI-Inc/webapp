"use client";

import Image from "next/image";
import { TemplateGallery } from "./TemplateGallery";

const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || "https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image").replace(/\/$/, "");

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
    return (
        <main className="w-full h-full overflow-y-auto flex justify-center bg-white">
            <div className="w-[92vw] max-w-[1600px]">
                <div className="p-[0px]">
                    <div className="j-h5 text-[#080606] flex items-center gap-[6px] pt-[32px]">
                        <Image src={`${IMAGE_URL}/new-home/icon-idea.png`} alt="idea" width={28} height={28} />
                        Ideas for You
                    </div>
                    <div className="mt-[24px]">
                        <TemplateGallery
                            initialTags={tags}
                            initialTemplates={templates}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
