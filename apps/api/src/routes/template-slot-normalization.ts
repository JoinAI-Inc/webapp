interface TemplateSlotRequest {
    refId: string;
    slotType?: string;
    imageSource?: string;
    assetId?: string;
    gender?: unknown;
    makeup?: unknown;
}

interface AssetRecord {
    payload?: unknown;
    thumbnailUrl?: string | null;
}

function getPayloadImageSource(payload: unknown): string | undefined {
    if (typeof payload === "string") return payload.trim() || undefined;
    if (!payload || typeof payload !== "object") return undefined;

    const data = payload as Record<string, unknown>;
    return [
        data.imageSource,
        data.imageUrl,
        data.url,
        data.sourceUrl,
    ].find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

export function normalizeTemplateSlots(
    slots: TemplateSlotRequest[],
    assetsMap: Record<string, AssetRecord>,
) {
    return slots.map((slot) => {
        const selectedAsset = slot.assetId ? assetsMap[slot.assetId] : null;
        const directImageSource = typeof slot.imageSource === "string"
            ? slot.imageSource.trim()
            : undefined;
        const assetImageSource = selectedAsset
            ? getPayloadImageSource(selectedAsset.payload) || selectedAsset.thumbnailUrl || undefined
            : undefined;

        return {
            refId: slot.refId,
            slotType: slot.slotType || "IMAGE",
            imageSource: directImageSource || assetImageSource,
            assetId: slot.assetId,
            assetPayload: selectedAsset?.payload ?? undefined,
            gender: slot.gender,
            makeup: slot.makeup,
        };
    });
}
