import { Redis } from '@upstash/redis';

// 单例模式
let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redis) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            throw new Error('Missing Upstash Redis credentials. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
        }

        redis = new Redis({
            url,
            token,
        });

        console.log('[Redis] Client initialized');
    }

    return redis;
}
