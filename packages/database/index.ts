import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function isConnectionError(err: any): boolean {
    return (
        err?.code === 'P1001' ||  // Can't reach database server
        err?.code === 'P1008' ||  // Operations timed out
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes('Connection refused') ||
        err?.message?.includes('connection timeout')
    );
}

function createPrismaClient() {
    const base = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    /**
     * Query 中间件：捕获冷启动连接错误，自动 disconnect + 等待 + 重试一次。
     *
     * 原因：Supabase 挂起时强制断开 TCP，不发 FIN/RST。
     * Prisma 连接池复用死连接，每次请求均失败且不自动重建。
     * 解决：失败 → $disconnect 清空连接池 → 等待数据库激活 → 重试。
     */
    return base.$extends({
        query: {
            $allModels: {
                async $allOperations({ operation, model, args, query }) {
                    try {
                        return await query(args);
                    } catch (err: any) {
                        if (!isConnectionError(err)) throw err;

                        console.warn(`[DB] Cold-start connection error on ${model}.${operation}. Reconnecting in 3s...`);
                        await base.$disconnect().catch(() => { });
                        await new Promise((r) => setTimeout(r, 3000));

                        // 重试一次
                        return await query(args);
                    }
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
