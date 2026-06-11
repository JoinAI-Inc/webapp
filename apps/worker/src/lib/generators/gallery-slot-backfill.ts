interface LegacyGalleryRecord {
    metadata: unknown;
    promptData: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

export function getMissingGallerySlotSources(record: LegacyGalleryRecord): string[] {
    const metadata = asRecord(record.metadata);
    if (Array.isArray(metadata.slotImages) && metadata.slotImages.length > 0) {
        return [];
    }

    const promptData = asRecord(record.promptData);
    if (!Array.isArray(promptData.slots)) return [];

    return promptData.slots
        .map((slot) => asRecord(slot).imageSource)
        .filter((source): source is string => typeof source === "string" && source.length > 0);
}

export function mergeGallerySlotImages(metadata: unknown, slotImages: string[]) {
    return {
        ...asRecord(metadata),
        slotImages,
    };
}
