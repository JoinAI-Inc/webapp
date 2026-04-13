"use client";

import { GeneratePageClient } from "../../../components/GeneratePageClient";

interface Slot {
    id: string;
    refId: string;
    slotType: 'PERSON' | 'OOTD' | 'DECORATION';
    label: string;
    description: string | null;
}

export function GenerateShell({ templateId, slots }: { templateId: string; slots: Slot[] }) {
    return (
        <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Replacements</h2>
                <p className="text-gray-500 text-sm">Upload images for each slot below. We support Person, Outfit and Decoration replacements.</p>
            </div>
            <GeneratePageClient templateId={templateId} slots={slots} />
        </div>
    );
}
