const INTERNAL_SECRET = process.env.WORKER_SECRET || 'dev-worker-secret-change-in-production';

/**
 * 生成内部调用所需的签名 headers（bacc → api server-to-server）
 * 使用 Web Crypto API（兼容 Edge Runtime）
 */
export async function makeInternalHeaders(userId: string): Promise<Record<string, string>> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = `${userId}:${timestamp}`;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(INTERNAL_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const signature = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return {
        'x-internal-user-id': userId,
        'x-internal-timestamp': timestamp,
        'x-internal-signature': signature,
    };
}
