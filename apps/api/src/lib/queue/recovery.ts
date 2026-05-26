/**
 * 启动恢复模块
 *
 * API 重启时执行：
 * 1. 将 Redis processingSet 中的孤儿任务（之前在处理中，但服务崩溃未完成）迁回 pendingQueue 重试
 * 2. 恢复计数：超过 maxRetries 的任务标记为 failed 并退还次数，而不是无限重试
 */

import { taskManager } from './task-manager.js';
import { prisma } from '@repo/database';

/**
 * 退还用户次数（任务恢复失败时确保不扣双倍）
 */
async function refundIfNeeded(task: any) {
    const featureKey: string | null = task.payload?._deductedFeatureKey ?? null;
    if (!featureKey) return;

    const shouldRefund = await taskManager.markRefundStarted(task.id);
    if (!shouldRefund) {
        console.log(`[Recovery] Refund for task ${task.id} already started, skipping duplicate refund.`);
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
        console.log(`[Recovery] Refunded 1 credit to user ${task.userId} (${featureKey})`);
    } catch (e: any) {
        console.warn(`[Recovery] Refund failed for user ${task.userId}:`, e.message);
    }
}

/**
 * 启动时恢复孤儿任务
 */
export async function recoverOrphanTasks(): Promise<void> {
    console.log('[Recovery] Checking for orphaned tasks in processing set...');

    try {
        // 获取所有仍在 processing 队列中的任务（服务崩溃前未完成）
        const orphanIds = await taskManager.getProcessingTaskIds();

        if (orphanIds.length === 0) {
            console.log('[Recovery] No orphaned tasks found.');
            return;
        }

        console.log(`[Recovery] Found ${orphanIds.length} orphaned task(s): ${orphanIds.join(', ')}`);

        for (const taskId of orphanIds) {
            try {
                const task = await taskManager.getTask(taskId);

                if (!task) {
                    // 任务数据已过期从 Redis 消失，清理 processing 记录
                    await taskManager.completeTask(taskId);
                    console.log(`[Recovery] Task ${taskId} data expired, removed from processing set.`);
                    continue;
                }

                const maxRetries = task.maxRetries ?? 3;
                const retryCount = task.retryCount ?? 0;

                if (retryCount >= maxRetries) {
                    // 超过最大重试次数，标记失败并退款
                    await taskManager.updateTaskStatus(taskId, 'failed', {
                        error: 'Task failed after server restart, max retries exceeded',
                    } as any);
                    await taskManager.completeTask(taskId);
                    await refundIfNeeded(task);
                    console.log(`[Recovery] Task ${taskId} exceeded max retries, marked as failed and refunded.`);
                } else {
                    // 重新入队（retryCount +1）
                    await taskManager.requeueTask(taskId);
                    console.log(`[Recovery] Task ${taskId} re-queued (retry ${retryCount + 1}/${maxRetries}).`);
                }
            } catch (e: any) {
                console.error(`[Recovery] Failed to recover task ${taskId}:`, e.message);
            }
        }

        console.log('[Recovery] Orphan task recovery complete.');
    } catch (e: any) {
        console.error('[Recovery] Recovery process failed:', e.message);
    }
}
