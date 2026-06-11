"use client";

import { TemplateDetailPanel } from "./TemplateDetailPanel";
import { useGenerateContext } from "./GenerateLayoutProvider";

export function TemplateDetailPageClient({ templateId }: { templateId: string }) {
    const { setLatestTaskId, startNavigation } = useGenerateContext();

    const handleBackToTemplates = () => {
        startNavigation("/generate");
    };

    return (
        <main className="w-full h-full overflow-y-auto flex justify-center bg-white">
            <div className="w-full max-w-[1280px]">
                <TemplateDetailPanel
                    templateId={templateId}
                    onBack={handleBackToTemplates}
                    onTaskSubmitted={setLatestTaskId}
                />
            </div>
        </main>
    );
}
