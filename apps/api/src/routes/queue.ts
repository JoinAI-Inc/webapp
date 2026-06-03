import { Router, Request, Response } from 'express';
import { taskManager, userTaskTracker } from '@repo/queue';
import type { TaskType } from '@repo/queue';
import { verifyInternalRequest } from '../lib/internal-auth.js';

const router = Router();

/**
 * POST /api/queue/submit
 * 提交生成任务到队列（仅限 bacc server-to-server，需要 x-internal-* 签名）
 */
router.post('/submit', async (req: Request, res: Response) => {
    try {
        const { type, payload } = req.body;

        // 验证内部签名，取出 userId
        const userId = verifyInternalRequest(
            req.headers['x-internal-user-id'] as string | undefined,
            req.headers['x-internal-timestamp'] as string | undefined,
            req.headers['x-internal-signature'] as string | undefined,
        );
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!type || !payload) {
            return res.status(400).json({
                error: 'Missing required fields: type, payload'
            });
        }

        // 验证任务类型
        const validTypes: TaskType[] = ['template'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: `Invalid task type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const taskId = await taskManager.submitTask({
            userId,
            type: type as TaskType,
            payload,
        });

        try {
            await userTaskTracker.setCurrentTask(userId, taskId, {
                type,
                payload,
                submittedAt: new Date().toISOString(),
            });
        } catch (trackErr: any) {
            console.warn('[Queue API] Failed to track current task (non-fatal):', trackErr.message);
        }

        console.log(`[Queue API] Task ${taskId} submitted by user ${userId}`);

        res.json({
            taskId,
            status: 'pending',
            message: 'Task submitted successfully. Poll /api/queue/status to check progress.'
        });
    } catch (error: any) {
        console.error('[Queue API] Submit error:', error);
        res.status(500).json({ error: 'Failed to submit task' });
    }
});

/**
 * GET /api/queue/status?taskId=xxx
 * 查询任务状态
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const { taskId } = req.query;
        const userId = verifyInternalRequest(
            req.headers['x-internal-user-id'] as string | undefined,
            req.headers['x-internal-timestamp'] as string | undefined,
            req.headers['x-internal-signature'] as string | undefined,
        );
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!taskId || typeof taskId !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid taskId parameter' });
        }

        const task = await taskManager.getTask(taskId);

        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            taskId: task.id,
            status: task.status,
            result: task.result,
            error: task.error,
            retryCount: task.retryCount,
            maxRetries: task.maxRetries,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            completedAt: task.completedAt,
        });
    } catch (error: any) {
        console.error('[Queue API] Status check error:', error);
        res.status(500).json({
            error: error.message || 'Failed to get task status'
        });
    }
});

/**
 * GET /api/queue/process
 * 队列健康检查。实际消费由 apps/worker 独立进程负责。
 */
router.get('/process', async (req: Request, res: Response) => {
    try {
        const stats = await taskManager.getQueueStats();
        res.json({
            healthy: true,
            queueStats: stats,
        });
    } catch (error: any) {
        res.status(500).json({
            healthy: false,
            error: error.message
        });
    }
});

/**
 * GET /api/queue/current-task
 * 获取当前用户的任务状态（需要 x-internal-* 签名）
 */
router.get('/current-task', async (req: Request, res: Response) => {
    try {
        // 使用 internal-auth 验证，取出 userId
        const userId = verifyInternalRequest(
            req.headers['x-internal-user-id'] as string | undefined,
            req.headers['x-internal-timestamp'] as string | undefined,
            req.headers['x-internal-signature'] as string | undefined,
        );

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const currentTasks = await userTaskTracker.getCurrentTasks(userId.toString());

        if (currentTasks.length === 0) {
            return res.json({ taskId: null, status: null });
        }

        const tasks = [];
        for (const currentTask of currentTasks) {
            // 获取任务详细状态
            const task = await taskManager.getTask(currentTask.taskId);

            if (!task || task.userId !== userId) {
                // 任务已过期、不存在或不属于当前用户，清除记录
                await userTaskTracker.clearCurrentTask(userId.toString(), currentTask.taskId);
                continue;
            }

            tasks.push({
                taskId: task.id,
                status: task.status,
                result: task.result,
                error: task.error,
                metadata: currentTask.metadata,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                completedAt: task.completedAt,
            });
        }

        if (tasks.length === 0) {
            return res.json({ taskId: null, status: null, tasks: [] });
        }

        const primaryTask = tasks.find((task) => task.status === 'pending' || task.status === 'processing') ?? tasks[0];

        res.json({
            ...primaryTask,
            tasks,
        });
    } catch (error: any) {
        console.error('[Queue API] Current task error:', error);
        res.status(500).json({
            error: error.message || 'Failed to get current task'
        });
    }
});

export default router;
