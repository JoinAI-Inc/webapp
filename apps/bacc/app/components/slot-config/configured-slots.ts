import { Slot } from "./slot-config.types";

interface UploadValue {
    preview: string;
    base64: string;
}

interface BuildConfiguredSlotsInput {
    slots: Slot[];
    uploads: Record<string, UploadValue | null>;
    selectedAssets: Record<string, string>;
    genders: Record<string, string>;
    makeups: Record<string, string>;
}

export function buildConfiguredSlots({
    slots,
    uploads,
    selectedAssets,
    genders,
    makeups,
}: BuildConfiguredSlotsInput) {
    const configuredSlots: Array<Record<string, string>> = [];

    slots.filter((slot) => uploads[slot.id] != null).forEach((slot) => {
        configuredSlots.push({
            refId: slot.refId,
            slotType: slot.slotType,
            imageSource: uploads[slot.id]!.base64,
            gender: genders[slot.id] || "Feminine",
            makeup: makeups[slot.id] || "Need",
        });
    });

    Object.entries(selectedAssets).forEach(([slotId, assetId]) => {
        const slot = slots.find((candidate) => candidate.id === slotId);
        if (!slot) return;

        configuredSlots.push({
            refId: slot.refId,
            slotType: slot.slotType,
            assetId,
        });
    });

    return configuredSlots;
}
