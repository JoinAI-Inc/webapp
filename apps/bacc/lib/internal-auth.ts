import { createHmac } from 'crypto';

const INTERNAL_SECRET = process.env.WORKER_SECRET || 'dev-worker-secret-change-in-production';

/**
 * 生成内部调用所需的签名 headers（bacc → api server-to-server）
 */
export function makeInternalHeaders(userId: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = `${userId}:${timestamp}`;
    const signature = createHmac('sha256', INTERNAL_SECRET).update(payload).digest('hex');
    return {
        'x-internal-user-id': userId,
        'x-internal-timestamp': timestamp,
        'x-internal-signature': signature,
    };
}
