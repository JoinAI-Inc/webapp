import { prisma } from '@repo/database';
import { taskManager } from './task-manager.js';
import { TemplateGenerator } from '../generators/template-generator.js';

const templateGenerator = new TemplateGenerator();

const generators = {
    template: templateGenerator,
};


/**
 * 退还次数（生成永久失败时调用）
 * payload 里存有 _deductedFeatureKey，若存在则调原子退款 SQL
 */
async function refundCredit(task: any) {
    const featureKey: string | null = task.payload?._deductedFeatureKey ?? null;
    if (!featureKey) return; // 订阅用户或无需退款

    const shouldRefund = await taskManager.markRefundStarted(task.id);
    if (!shouldRefund) {
        console.log(`[Worker] Refund for task ${task.id} already started, skipping duplicate refund.`);
        return;
    }

    try {
        const feature = await prisma.feature.findUnique({ where: { featureKey } });
        if (!feature) return;

        await prisma.$executeRaw`
            UPDATE "user_feature_balances"
            SET
                remaining_count = remaining_count + 1,
                total_used      = GREATEST(total_used - 1, 0),
                updated_at      = NOW()
            WHERE
                user_id         = ${task.userId}
                AND feature_id  = ${feature.id}
        `;
        console.log(`[Worker] Refunded 1 credit to user ${task.userId} (${featureKey}) for failed task ${task.id}`);
    } catch (e: any) {
        console.error(`[Worker] Failed to refund credit for task ${task.id}:`, e.message);
    }
}

export class QueueWorker {
    private isProcessing = false;

    async processNext(): Promise<boolean> {
        const taskId = await taskManager.getNextPendingTask();
        if (!taskId) return false;

        console.log(`[Worker] Processing task ${taskId}`);
        const task = await taskManager.getTask(taskId);

        if (!task) {
            console.error(`[Worker] Task ${taskId} not found`);
            await taskManager.completeTask(taskId);
            return false;
        }

        await taskManager.updateTaskStatus(taskId, 'processing');

        try {
            const generator = generators[task.type as keyof typeof generators];
            if (!generator) throw new Error(`Unknown task type: ${task.type}`);

            const generatorPayload: any = { ...task.payload, userId: task.userId };

            const result = await generator.generate(generatorPayload);

            await taskManager.updateTaskStatus(taskId, 'completed', { result });
            await taskManager.completeTask(taskId);

            console.log(`[Worker] Task ${taskId} completed successfully`);
            return true;
        } catch (error: any) {
            console.error(`[Worker] Task ${taskId} failed:`, error.message);

            if (task.retryCount < task.maxRetries) {
                console.log(`[Worker] Requeueing task ${taskId} (retry ${task.retryCount + 1}/${task.maxRetries})`);
                await taskManager.requeueTask(taskId);
            } else {
                // 重试全部耗尽 → 永久失败，退还次数
                console.log(`[Worker] Task ${taskId} exceeded max retries, marking as failed`);
                await taskManager.updateTaskStatus(taskId, 'failed', { error: error.message });
                await taskManager.completeTask(taskId);
                await refundCredit(task); // ← 退款
            }

            return false;
        }
    }

    async processBatch(maxTasks = 5): Promise<number> {
        let processed = 0;
        for (let i = 0; i < maxTasks; i++) {
            const hasMore = await this.processNext();
            if (hasMore) {
                processed++;
            } else {
                break;
            }
        }
        console.log(`[Worker] Batch complete. Processed ${processed} tasks.`);
        return processed;
    }

    async processBatchSafe(maxTasks = 5): Promise<number> {
        if (this.isProcessing) {
            console.log('[Worker] Previous batch still running, skipping this tick.');
            return 0;
        }
        const lockToken = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const acquired = await taskManager.acquireWorkerLock(lockToken);
        if (!acquired) {
            console.log('[Worker] Another worker owns the queue lock, skipping this tick.');
            return 0;
        }

        this.isProcessing = true;
        try {
            return await this.processBatch(maxTasks);
        } finally {
            this.isProcessing = false;
            await taskManager.releaseWorkerLock(lockToken);
        }
    }
}

export const queueWorker = new QueueWorker();
