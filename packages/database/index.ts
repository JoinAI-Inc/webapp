import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function isConnectionError(err: any): boolean {
    return (
        err?.code === 'P1001' ||
        err?.code === 'P1008' ||
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes('Connection refused') ||
        err?.message?.includes('connection timeout')
    );
}

/**
 * Supabase 冷启动处理：
 * - 问题：Supabase 挂起时强制断开 TCP，不发 FIN/RST。Prisma 连接池复用死连接。
 * - 解决：捕获连接错误 → disconnect 清空连接池 → 指数退避等待 → 重试（最多5次）
 *
 * Supabase 冷启动通常需要 5-15 秒，所以退避策略：
 * 第1次失败后等 3s，第2次等 5s，第3次等 8s，第4次等 10s，第5次等 10s
 */
const RETRY_DELAYS = [3000, 5000, 8000, 10000, 10000];
const MAX_RETRIES = RETRY_DELAYS.length;

let baseClient: PrismaClient;

function getBaseClient(): PrismaClient {
    if (!baseClient) {
        baseClient = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });
    }
    return baseClient;
}

function createPrismaClient() {
    const base = getBaseClient();

    return base.$extends({
        query: {
            $allModels: {
                async $allOperations({ operation, model, args, query }) {
                    let lastError: any;
                    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                        try {
                            return await query(args);
                        } catch (err: any) {
                            if (!isConnectionError(err)) throw err;

                            lastError = err;
                            if (attempt < MAX_RETRIES) {
                                const delay = RETRY_DELAYS[attempt];
                                console.warn(
                                    `[DB] Cold-start connection error on ${model}.${operation} ` +
                                    `(attempt ${attempt + 1}/${MAX_RETRIES}). ` +
                                    `Reconnecting in ${delay / 1000}s...`
                                );
                                // disconnect 清空所有死连接，强制下次重建
                                await base.$disconnect().catch(() => { });
                                await new Promise((r) => setTimeout(r, delay));
                            }
                        }
                    }
                    console.error(`[DB] All ${MAX_RETRIES} reconnect attempts failed for ${model}.${operation}`);
                    throw lastError;
                },
            },
        },
    });
}

export const prisma =
    (globalForPrisma.prisma as any) ??
    createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    (globalForPrisma as any).prisma = prisma;
}

export * from '@prisma/client';
