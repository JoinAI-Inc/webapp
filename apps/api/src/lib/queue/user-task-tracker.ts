import { getRedisClient } from './client.js';

/**
 * 用户任务跟踪器
 * 使用 Redis 存储用户当前任务状态，支持多页面/多设备同步
 */
export class UserTaskTracker {
    private redis = getRedisClient();
    private ttl: number;

    constructor() {
        // 从环境变量读取 TTL（秒），默认 1 小时
        this.ttl = parseInt(process.env.TASK_REDIS_TTL || '3600');
    }

    /**
     * 保存用户当前任务
     */
    async setCurrentTask(userId: string, taskId: string, metadata: any): Promise<void> {
        const listKey = `user:${userId}:current_tasks`;
        const itemKey = `user:${userId}:current_task:${taskId}`;

        await this.redis.hset(itemKey, {
            taskId,
            metadata: JSON.stringify(metadata),
            timestamp: Date.now().toString(),
        });
        await this.redis.expire(itemKey, this.ttl);

        await this.redis.lrem(listKey, 0, taskId);
        await this.redis.lpush(listKey, taskId);
        await this.redis.ltrim(listKey, 0, 19);
        await this.redis.expire(listKey, this.ttl);
    }

    /**
     * 获取用户当前任务
     */
    async getCurrentTask(userId: string): Promise<{
        taskId: string;
        metadata: any;
        timestamp: number;
    } | null> {
        const tasks = await this.getCurrentTasks(userId);
        if (tasks.length > 0) {
            return tasks[0];
        }

        // 兼容旧版本的单任务 key，等待其 TTL 自然过期。
        const data = await this.redis.hgetall(`user:${userId}:current_task`) as Record<string, string>;
        if (!data || !data.taskId) {
            return null;
        }

        return this.parseTaskData(data);
    }

    async getCurrentTasks(userId: string): Promise<Array<{
        taskId: string;
        metadata: any;
        timestamp: number;
    }>> {
        const listKey = `user:${userId}:current_tasks`;
        const taskIds = await this.redis.lrange<string>(listKey, 0, 19);

        if (!taskIds || taskIds.length === 0) {
            return [];
        }

        const tasks = await Promise.all(taskIds.map(async (taskId) => {
            const data = await this.redis.hgetall(`user:${userId}:current_task:${taskId}`) as Record<string, string>;
            if (!data || !data.taskId) {
                await this.redis.lrem(listKey, 0, taskId);
                return null;
            }
            return this.parseTaskData(data);
        }));

        return tasks.filter((task): task is NonNullable<typeof task> => task !== null);
    }

    private parseTaskData(data: Record<string, any>): {
        taskId: string;
        metadata: any;
        timestamp: number;
    } {
        // metadata 可能已经是对象或字符串，需要判断
        let parsedMetadata;
        try {
            parsedMetadata = typeof data.metadata === 'string'
                ? JSON.parse(data.metadata)
                : data.metadata;
        } catch (e) {
            console.error('[UserTaskTracker] Failed to parse metadata:', e);
            parsedMetadata = data.metadata;
        }

        return {
            taskId: data.taskId as string,
            metadata: parsedMetadata,
            timestamp: parseInt(data.timestamp as string),
        };
    }

    /**
     * 清除用户当前任务
     */
    async clearCurrentTask(userId: string, taskId?: string): Promise<void> {
        if (!taskId) {
            await this.redis.del(`user:${userId}:current_task`);
            await this.redis.del(`user:${userId}:current_tasks`);
            return;
        }

        await this.redis.lrem(`user:${userId}:current_tasks`, 0, taskId);
        await this.redis.del(`user:${userId}:current_task:${taskId}`);
    }
}

export const userTaskTracker = new UserTaskTracker();
