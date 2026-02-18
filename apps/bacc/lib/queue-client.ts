export interface TaskResult {
    imageUrl?: string;
    thumbnailUrl?: string;
    fileId?: string;
}

export interface TaskStatus {
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: TaskResult;
    error?: string;
    retryCount?: number;
    maxRetries?: number;
    createdAt?: string;
    updatedAt?: string;
    completedAt?: string;
}

/**
 * 提交生成任务到队列
 */
export async function submitGenerationTask(
    type: 'hanfu' | 'magic' | 'video' | 'decor',
    payload: any
): Promise<string> {
    const response = await fetch('/api/queue/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit task');
    }

    const { taskId } = await response.json();
    return taskId;
}

/**
 * 查询任务状态
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`/api/queue/status?taskId=${taskId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get task status');
    }

    return response.json();
}

/**
 * 轮询任务状态直到完成或失败
 */
export async function pollTaskStatus(
    taskId: string,
    options: {
        maxAttempts?: number;
        interval?: number;
        onProgress?: (status: TaskStatus) => void;
    } = {}
): Promise<TaskResult> {
    const {
        maxAttempts = 60,
        interval = 2000,
        onProgress
    } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const status = await getTaskStatus(taskId);

        if (onProgress) {
            onProgress(status);
        }

        if (status.status === 'completed') {
            if (!status.result) {
                throw new Error('Task completed but no result found');
            }
            return status.result;
        }

        if (status.status === 'failed') {
            throw new Error(status.error || 'Generation failed');
        }

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Task timeout: exceeded maximum polling attempts');
}

/**
 * 一键提交并等待结果（便捷方法）
 */
export async function submitAndWait(
    type: 'hanfu' | 'magic' | 'video' | 'decor',
    payload: any,
    options?: {
        onProgress?: (status: TaskStatus) => void;
    }
): Promise<TaskResult> {
    const taskId = await submitGenerationTask(type, payload);
    return pollTaskStatus(taskId, options);
}
