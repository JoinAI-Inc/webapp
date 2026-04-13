"use client";

import { useState } from "react";
import { SlotConfigPanel } from "./SlotConfigPanel";

interface Slot {
    id: string;
    refId: string;
    slotType: 'PERSON' | 'OOTD' | 'DECORATION';
    label: string;
    description: string | null;
}

export function GeneratePageClient({
    templateId,
    slots,
    onTaskSubmitted,
}: {
    templateId: string;
    slots: Slot[];
    onTaskSubmitted?: (taskId: string) => void;
}) {
    return (
        <SlotConfigPanel
            templateId={templateId}
            slots={slots}
            onTaskSubmitted={onTaskSubmitted}
        />
    );
}
