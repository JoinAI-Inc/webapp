"use client";

import { GeneratePageClient } from "../../../../components/GeneratePageClient";

interface Slot {
    id: string;
    refId: string;
    slotType: 'PERSON' | 'OOTD' | 'DECORATION';
    label: string;
    description: string | null;
}

export function GenerateShell({ templateId, slots }: { templateId: string; slots: Slot[] }) {
    return (
        <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-[32px] shadow-sm">
            <div className="mb-[24px]">
                <h2 className="text-2xl font-bold mb-[8px]">Replacements</h2>
                <p className="text-gray-500 text-sm">Upload images for each slot below. We support Person, Outfit and Decoration replacements.</p>
            </div>
            <GeneratePageClient templateId={templateId} slots={slots} />
        </div>
    );
}
