export type TaskType = 'portrait' | 'magic';


export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationTask {
    id: string;
    userId: string;
    type: TaskType;
    status: TaskStatus;
    payload: any;
    result?: {
        imageUrl?: string;
        thumbnailUrl?: string;
        fileId?: string;
    };
    error?: string;
    retryCount: number;
    maxRetries: number;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

export interface SubmitTaskParams {
    userId: string;
    type: TaskType;
    payload: any;
    maxRetries?: number;
}
