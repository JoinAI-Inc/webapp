export interface Asset {
    id: string;
    assetType: 'OOTD' | 'DECORATION';
    name: string;
    thumbnailUrl: string;
    requiredFeatureKey: string | null;
    sortOrder: number;
}

export interface Slot {
    id: string;
    refId: string;
    slotType: 'PERSON' | 'OOTD' | 'DECORATION';
    label: string;
    description: string | null;
    assets?: Asset[];
}

// 文件 → base64 data URL
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 轮询任务状态（用 taskId 精准查询，最多等待 10 分钟）
export async function pollTaskStatus(taskId: string, maxAttempts = 120, intervalMs = 5000): Promise<{
    status: string;
    result?: { imageUrl?: string; fileId?: string };
    error?: string;
}> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs));
        const res = await fetch(`/api/queue/status?taskId=${taskId}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === 'completed' || data.status === 'failed') {
            return data;
        }
    }
    return { status: 'timeout', error: 'Generation timed out' };
}
