import { createHmac } from 'crypto';

const INTERNAL_SECRET = process.env.WORKER_SECRET || 'dev-worker-secret-change-in-production';
/** 签名时间窗口（秒），防止重放攻击 */
const TIMESTAMP_TOLERANCE_S = 60;

/**
 * 生成内部调用所需的签名 headers
 * 用于 bacc → api 的 server-to-server 请求
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

/**
 * 验证内部请求签名
 * @returns userId 或 null（验证失败）
 */
export function verifyInternalRequest(
    userId: string | undefined,
    timestamp: string | undefined,
    signature: string | undefined,
): string | null {
    if (!userId || !timestamp || !signature) return null;

    // 防重放：时间差不超过容忍窗口
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(now - ts) > TIMESTAMP_TOLERANCE_S) return null;

    // 验签
    const expected = createHmac('sha256', INTERNAL_SECRET)
        .update(`${userId}:${timestamp}`)
        .digest('hex');
    if (expected !== signature) return null;

    return userId;
}
