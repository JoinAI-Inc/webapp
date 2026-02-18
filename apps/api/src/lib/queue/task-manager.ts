import { nanoid } from 'nanoid';
import { getRedisClient } from './client.js';
import { GenerationTask, SubmitTaskParams, TaskStatus } from './types.js';

const KEYS = {
    task: (id: string) => `task:${id}`,
    pendingQueue: 'queue:pending',
    processingSet: 'queue:processing',
    userTasks: (userId: string) => `user:${userId}:tasks`,
};

export class TaskManager {
    private redis = getRedisClient();

    /**
     * 提交新任务到队列
     */
    async submitTask(params: SubmitTaskParams): Promise<string> {
        const taskId = nanoid();
        const task: GenerationTask = {
            id: taskId,
            userId: params.userId,
            type: params.type,
            status: 'pending',
            payload: params.payload,
            retryCount: 0,
            maxRetries: params.maxRetries ?? parseInt(process.env.QUEUE_MAX_RETRIES || '3'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // 保存任务详情
        await this.redis.hset(KEYS.task(taskId), task as any);

        // 设置任务过期时间（默认 24 小时）
        const taskTTL = parseInt(process.env.TASK_REDIS_TTL || '86400');
        await this.redis.expire(KEYS.task(taskId), taskTTL);

        // 添加到待处理队列
        await this.redis.lpush(KEYS.pendingQueue, taskId);

        // 关联到用户，并续期（保留最近 7 天的任务记录）
        await this.redis.sadd(KEYS.userTasks(params.userId), taskId);
        await this.redis.expire(KEYS.userTasks(params.userId), 7 * 24 * 3600);

        console.log(`[TaskManager] Task ${taskId} submitted (type: ${params.type}, user: ${params.userId})`);
        return taskId;
    }

    /**
     * 获取任务详情
     */
    async getTask(taskId: string): Promise<GenerationTask | null> {
        const task = await this.redis.hgetall(KEYS.task(taskId));
        if (!task || Object.keys(task).length === 0) {
            return null;
        }

        // 解析嵌套对象
        const parsedTask = task as any;
        if (typeof parsedTask.payload === 'string') {
            try {
                parsedTask.payload = JSON.parse(parsedTask.payload);
            } catch (e) {
                // Keep as is if not JSON
            }
        }
        if (typeof parsedTask.result === 'string') {
            try {
                parsedTask.result = JSON.parse(parsedTask.result);
            } catch (e) {
                // Keep as is if not JSON
            }
        }

        return parsedTask as GenerationTask;
    }

    /**
     * 更新任务状态
     */
    async updateTaskStatus(
        taskId: string,
        status: TaskStatus,
        updates: Partial<GenerationTask> = {}
    ): Promise<void> {
        const updateData: any = {
            status,
            updatedAt: new Date().toISOString(),
            ...updates,
        };

        if (status === 'completed' || status === 'failed') {
            updateData.completedAt = new Date().toISOString();
        }

        // 序列化嵌套对象
        if (updateData.result) {
            updateData.result = JSON.stringify(updateData.result);
        }
        if (updateData.payload) {
            updateData.payload = JSON.stringify(updateData.payload);
        }

        await this.redis.hset(KEYS.task(taskId), updateData);
        console.log(`[TaskManager] Task ${taskId} updated to ${status}`);
    }

    /**
     * 获取下一个待处理任务
     */
    async getNextPendingTask(): Promise<string | null> {
        const taskId = await this.redis.rpop(KEYS.pendingQueue);
        if (!taskId) return null;

        // 移到处理中集合
        await this.redis.sadd(KEYS.processingSet, taskId);
        return taskId as string;
    }

    /**
     * 任务处理完成（从处理中移除）
     */
    async completeTask(taskId: string): Promise<void> {
        await this.redis.srem(KEYS.processingSet, taskId);
    }

    /**
     * 任务重新入队（重试）
     */
    async requeueTask(taskId: string): Promise<void> {
        await this.redis.srem(KEYS.processingSet, taskId);
        await this.redis.lpush(KEYS.pendingQueue, taskId);

        const task = await this.getTask(taskId);
        if (task) {
            await this.updateTaskStatus(taskId, 'pending', {
                retryCount: task.retryCount + 1,
            });
        }
    }

    /**
     * 获取队列统计信息（用于监控）
     */
    async getQueueStats() {
        const pendingCount = await this.redis.llen(KEYS.pendingQueue);
        const processingCount = await this.redis.scard(KEYS.processingSet);

        return {
            pending: pendingCount,
            processing: processingCount,
        };
    }
}

export const taskManager = new TaskManager();
