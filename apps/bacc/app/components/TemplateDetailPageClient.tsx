"use client";

import { useRouter } from "next/navigation";
import { TemplateDetailPanel } from "./TemplateDetailPanel";
import { useGenerateContext } from "./GenerateLayoutProvider";

export function TemplateDetailPageClient({ templateId }: { templateId: string }) {
    const router = useRouter();
    const { setLatestTaskId } = useGenerateContext();

    const handleBackToTemplates = () => {
        router.push("/generate");
    };

    return (
        <main className="w-full h-full overflow-y-auto flex justify-center bg-white">
            <div className="w-[92vw] max-w-[1280px]">
                <TemplateDetailPanel
                    templateId={templateId}
                    onBack={handleBackToTemplates}
                    onTaskSubmitted={setLatestTaskId}
                />
            </div>
        </main>
    );
}
