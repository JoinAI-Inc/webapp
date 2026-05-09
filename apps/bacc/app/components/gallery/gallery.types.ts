export interface HistoryItem {
    id: string;
    fileName?: string;
    url: string;
    thumbnailUrl: string | null;
    generationType: string | null;
    metadata?: any;
    promptData: any;
    templateId?: string | null;
    createdAt: string;
}

export interface PendingTask {
    taskId: string;
    status: string; // pending | processing
    metadata: {
        type: string;
        payload: {
            slots?: Array<{ slotType: string; imageSource: string }>;
            [key: string]: any;
        };
        submittedAt: string;
    } | null;
    createdAt: string;
}

// 从 promptData 或 metadata.payload 中提取用户上传的原图
export function extractSlotImages(item: HistoryItem): string[] {
    try {
        const data = item.promptData;
        if (!data) return [];
        // 支持 { slots: [{imageSource, slotType}] } 结构
        if (Array.isArray(data.slots)) {
            return data.slots
                .map((s: any) => s.imageSource || s.imageUrl)
                .filter(Boolean);
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
        return slots.map(s => s.imageSource).filter(Boolean);
    } catch {
        return [];
    }
}

export function formatGalleryDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

export function getGalleryMeta(item: HistoryItem) {
    const data = item.promptData || {};
    const title = data.templateName || data.gender || data.style || data.subject || data.title || "Masculine";
    const subtitle = data.makeup || data.look || data.templateName || "Makeup look";

    return {
        title: String(title),
        subtitle: String(subtitle),
    };
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
