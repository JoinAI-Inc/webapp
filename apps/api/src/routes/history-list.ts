export const HISTORY_LIST_SELECT = {
    id: true,
    fileName: true,
    fileType: true,
    storageUrl: true,
    thumbnailUrl: true,
    generationType: true,
    metadata: true,
    templateId: true,
    createdAt: true,
} as const;

interface HistoryListRecord {
    id: string;
    fileName: string;
    fileType: string;
    storageUrl: string;
    thumbnailUrl: string | null;
    generationType: string | null;
    metadata: any;
    templateId: string | null;
    createdAt: Date;
}

const MAX_INLINE_SLOT_IMAGE_LENGTH = 100_000;

function getSlotImages(metadata: unknown): string[] {
    if (!metadata || typeof metadata !== "object") return [];

    const slotImages = (metadata as Record<string, unknown>).slotImages;
    if (!Array.isArray(slotImages)) return [];

    return slotImages.filter((image): image is string => {
        if (typeof image !== "string") return false;
        if (image.startsWith("http://") || image.startsWith("https://")) return true;
        return image.startsWith("data:image/") && image.length <= MAX_INLINE_SLOT_IMAGE_LENGTH;
    });
}

function getGallerySubjects(metadata: unknown) {
    if (!metadata || typeof metadata !== "object") return [];

    const gallerySubjects = (metadata as Record<string, unknown>).gallerySubjects;
    if (!Array.isArray(gallerySubjects)) return [];

    return gallerySubjects
        .filter((subject) => subject && typeof subject === "object" && !Array.isArray(subject))
        .map((subject) => {
            const data = subject as Record<string, unknown>;
            return {
                refId: data.refId,
                gender: data.gender,
                makeup: data.makeup,
            };
        });
}

export function toHistoryListItem(item: HistoryListRecord) {
    return {
        id: item.id,
        fileName: item.fileName,
        fileType: item.fileType,
        url: item.storageUrl,
        thumbnailUrl: item.thumbnailUrl,
        generationType: item.generationType,
        metadata: item.metadata,
        slotImages: getSlotImages(item.metadata),
        gallerySubjects: getGallerySubjects(item.metadata),
        templateId: item.templateId,
        createdAt: item.createdAt,
    };
}
