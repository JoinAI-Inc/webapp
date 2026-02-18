import { taskManager } from './task-manager.js';
import { PortraitGenerator } from '../generators/portrait-generator.js';
import { GenerationTask } from './types.js';

const portraitGenerator = new PortraitGenerator();

const generators = {
    portrait: portraitGenerator,
    magic: portraitGenerator,
};

export class QueueWorker {
    async processNext(): Promise<boolean> {
        const taskId = await taskManager.getNextPendingTask();
        if (!taskId) {
            console.log('[Worker] No pending tasks');
            return false;
        }

        console.log(`[Worker] Processing task ${taskId}`);
        const task = await taskManager.getTask(taskId);

        if (!task) {
            console.error(`[Worker] Task ${taskId} not found`);
            await taskManager.completeTask(taskId);
            return false;
        }

        // 更新为处理中
        await taskManager.updateTaskStatus(taskId, 'processing');

        try {
            // 查找对应的生成器
            const generator = generators[task.type as keyof typeof generators];
            if (!generator) {
                throw new Error(`Unknown task type: ${task.type}`);
            }

            // 根据任务类型准备payload
            let generatorPayload: any = {
                ...task.payload,
                userId: task.userId,
            };

            // portrait/magic 都走 multi 模式
            generatorPayload.mode = 'multi';

            // 执行生成
            const result = await generator.generate(generatorPayload);

            // 标记完成
            await taskManager.updateTaskStatus(taskId, 'completed', { result });
            await taskManager.completeTask(taskId);

            console.log(`[Worker] Task ${taskId} completed successfully`);
            return true;
        } catch (error: any) {
            console.error(`[Worker] Task ${taskId} failed:`, error.message);

            // 判断是否重试
            if (task.retryCount < task.maxRetries) {
                console.log(
                    `[Worker] Requeueing task ${taskId} (retry ${task.retryCount + 1}/${task.maxRetries})`
                );
                await taskManager.requeueTask(taskId);
            } else {
                console.log(`[Worker] Task ${taskId} exceeded max retries, marking as failed`);
                await taskManager.updateTaskStatus(taskId, 'failed', {
                    error: error.message,
                });
                await taskManager.completeTask(taskId);
            }

            return false;
        }
    }

    /**
     * 批量处理（处理多个任务）
     */
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
}

export const queueWorker = new QueueWorker();
