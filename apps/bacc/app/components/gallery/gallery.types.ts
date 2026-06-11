interface GallerySlot {
    refId?: string;
    slotType?: string;
    imageSource?: string;
    imageUrl?: string;
    gender?: unknown;
    makeup?: unknown;
}

interface GallerySubject {
    refId?: unknown;
    gender?: unknown;
    makeup?: unknown;
}

interface GalleryData {
    slots?: GallerySlot[];
    slotImages?: string[];
    gallerySubjects?: GallerySubject[];
    imageSource?: string;
    templateId?: string | null;
    templateName?: unknown;
    gender?: unknown;
    style?: unknown;
    subject?: unknown;
    title?: unknown;
    makeup?: unknown;
    look?: unknown;
    [key: string]: unknown;
}

export interface HistoryItem {
    id: string;
    fileName?: string;
    url: string;
    thumbnailUrl: string | null;
    generationType: string | null;
    metadata?: GalleryData | null;
    promptData: GalleryData | null;
    slotImages?: string[];
    gallerySubjects?: GallerySubject[];
    templateId?: string | null;
    createdAt: string;
}

export interface PendingTask {
    taskId: string;
    status: string; // pending | processing
    metadata: {
        type: string;
        payload: GalleryData;
        submittedAt: string;
    } | null;
    createdAt: string;
}

// 从 promptData 或 metadata.payload 中提取用户上传的原图
export function extractSlotImages(item: HistoryItem): string[] {
    try {
        if (Array.isArray(item.slotImages) && item.slotImages.length > 0) {
            return item.slotImages.filter((source): source is string => typeof source === "string" && source.length > 0);
        }

        const data = item.promptData;
        if (!data) {
            return item.metadata?.slotImages?.filter(
                (source): source is string => typeof source === "string" && source.length > 0,
            ) || [];
        }
        // 支持 { slots: [{imageSource, slotType}] } 结构
        if (Array.isArray(data.slots)) {
            return data.slots
                .map((slot) => slot.imageSource || slot.imageUrl)
                .filter((source): source is string => Boolean(source));
        }
        // 支持顶层字段
        if (data.imageSource) return [data.imageSource];
    } catch {
        // ignore
    }
    return [];
}

export function extractPendingSlotImages(task: PendingTask): string[] {
    try {
        const slots = task.metadata?.payload?.slots;
        if (!slots) return [];
        return slots
            .map((slot) => slot.imageSource)
            .filter((source): source is string => Boolean(source));
    } catch {
        return [];
    }
}

export function formatGalleryDate(date: string) {
    const parsedDate = new Date(date);
    if (!Number.isFinite(parsedDate.getTime())) return "";

    return parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function getMeta(data?: GalleryData | null) {
    const source = data || {};
    const title = source.templateName || source.gender || source.style || source.subject || source.title || "Masculine";
    const subtitle = source.makeup || source.look || source.templateName || "Makeup look";

    return {
        title: String(title),
        subtitle: String(subtitle),
    };
}

export function getGalleryMeta(item: HistoryItem) {
    return getMeta(item.promptData || item.metadata);
}

export function getPendingGalleryMeta(task: PendingTask) {
    return getMeta(task.metadata?.payload);
}

function formatSubjectValue(value: unknown) {
    if (value === null || value === undefined) return "Data Error";
    const displayValue = String(value);
    return displayValue.trim() ? displayValue : "Data Error";
}

function formatMakeupValue(value: unknown) {
    const displayValue = formatSubjectValue(value);
    if (displayValue === "Data Error") return displayValue;

    switch (displayValue.trim().toLowerCase()) {
        case "need":
            return "Makeup Look";
        case "no need":
            return "No Makeup Look";
        default:
            return displayValue;
    }
}

function getSubjectMeta(subject?: GallerySubject) {
    return {
        title: formatSubjectValue(subject?.gender),
        subtitle: formatMakeupValue(subject?.makeup),
    };
}

export function getHistoryGalleryCardMeta(item: HistoryItem) {
    return getSubjectMeta(item.gallerySubjects?.[0] || item.metadata?.gallerySubjects?.[0]);
}

export function getPendingGalleryCardMeta(task: PendingTask) {
    const personSlot = task.metadata?.payload?.slots?.find((slot) => slot.slotType === "PERSON");
    return getSubjectMeta(personSlot);
}

export function getTemplateId(item: HistoryItem) {
    if (item.templateId || item.promptData?.templateId || item.metadata?.templateId) {
        return item.templateId || item.promptData?.templateId || item.metadata?.templateId;
    }

    const fileNameMatch = item.fileName?.match(/^template-(.+)-\d+\.[^.]+$/);
    return fileNameMatch?.[1] || null;
}

export function getResultUrl(item: HistoryItem) {
    return item.url || item.thumbnailUrl || "";
}

export function getGalleryCardUrl(item: HistoryItem) {
    return item.thumbnailUrl || item.url || "";
}
