import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { prisma } from '@repo/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const WORKER_INTERVAL_MS = parseInt(process.env.QUEUE_WORKER_INTERVAL_MS || '30000', 10);
const WORKER_BATCH_SIZE = parseInt(process.env.QUEUE_WORKER_BATCH_SIZE || '5', 10);

let shuttingDown = false;

async function processQueue(queueWorker: { processBatchSafe: (maxTasks: number) => Promise<number> }) {
    if (shuttingDown) return;
    try {
        await queueWorker.processBatchSafe(WORKER_BATCH_SIZE);
    } catch (error) {
        console.error('[Worker] Error:', error);
    }
}

async function start() {
    const missingEnv = [
        'DATABASE_URL',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
        'NANO_BANANA_API_KEY',
        'NANO_BANANA_TEMPLATE_MODELS',
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_DOMAIN',
    ].filter((key) => !process.env[key]);

    if (missingEnv.length > 0) {
        throw new Error(`Missing worker environment variables: ${missingEnv.join(', ')}`);
    }

    const { queueWorker } = await import('./lib/queue/worker.js');
    const { recoverOrphanTasks } = await import('./lib/queue/recovery.js');

    console.log('[Worker] Starting queue worker...');
    console.log(`[Worker] interval=${WORKER_INTERVAL_MS}ms batchSize=${WORKER_BATCH_SIZE}`);

    await recoverOrphanTasks().catch((error) => {
        console.error('[Recovery] Startup recovery failed:', error);
    });

    await processQueue(queueWorker);
    const interval = setInterval(() => void processQueue(queueWorker), WORKER_INTERVAL_MS);

    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`[Worker] Received ${signal}, shutting down...`);
        clearInterval(interval);
        await prisma.$disconnect();
        process.exit(0);
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch(async (error) => {
    console.error('[Worker] Fatal startup error:', error);
    await prisma.$disconnect();
    process.exit(1);
});
