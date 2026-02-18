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
        await this.redis.hset(`user:${userId}:current_task`, {
            taskId,
            metadata: JSON.stringify(metadata),
            timestamp: Date.now().toString(),
        });
        // 根据配置的 TTL 过期
        await this.redis.expire(`user:${userId}:current_task`, this.ttl);
    }

    /**
     * 获取用户当前任务
     */
    async getCurrentTask(userId: string): Promise<{
        taskId: string;
        metadata: any;
        timestamp: number;
    } | null> {
        const data = await this.redis.hgetall(`user:${userId}:current_task`) as Record<string, string>;
        if (!data || !data.taskId) {
            return null;
        }

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
    async clearCurrentTask(userId: string): Promise<void> {
        await this.redis.del(`user:${userId}:current_task`);
    }
}

export const userTaskTracker = new UserTaskTracker();
