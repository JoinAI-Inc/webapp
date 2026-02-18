import { Router, Request, Response } from 'express';
import { taskManager } from '../lib/queue/task-manager.js';
import { queueWorker } from '../lib/queue/worker.js';
import { TaskType } from '../lib/queue/types.js';

const router = Router();

// 简单的 API key 保护
const WORKER_SECRET = process.env.WORKER_SECRET || 'change-me-in-production';

/**
 * POST /api/queue/submit
 * 提交生成任务到队列
 */
router.post('/submit', async (req: Request, res: Response) => {
    try {
        const { userId, type, payload } = req.body;

        if (!userId || !type || !payload) {
            return res.status(400).json({
                error: 'Missing required fields: userId, type, payload'
            });
        }

        // 验证任务类型
        const validTypes: TaskType[] = ['portrait', 'magic'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: `Invalid task type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const taskId = await taskManager.submitTask({
            userId: userId.toString(),
            type: type as TaskType,
            payload,
        });

        // 保存为用户当前任务，包括完整的 payload
        const { userTaskTracker } = await import('../lib/queue/user-task-tracker.js');
        await userTaskTracker.setCurrentTask(userId.toString(), taskId, {
            type,
            payload, // 保存完整的 payload（包括 base64 图片）
            submittedAt: new Date().toISOString(),
        });

        console.log(`[Queue API] Task ${taskId} submitted by user ${userId}`);

        res.json({
            taskId,
            status: 'pending',
            message: 'Task submitted successfully. Poll /api/queue/status to check progress.'
        });
    } catch (error: any) {
        console.error('[Queue API] Submit error:', error);
        res.status(500).json({
            error: error.message || 'Failed to submit task'
        });
    }
});

/**
 * GET /api/queue/status?taskId=xxx
 * 查询任务状态
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const { taskId } = req.query;

        if (!taskId || typeof taskId !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid taskId parameter' });
        }

        const task = await taskManager.getTask(taskId);

        if (!task) {
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
 * POST /api/queue/process
 * Worker 处理任务（批量）
 */
router.post('/process', async (req: Request, res: Response) => {
    try {
        // 验证调用来源（可选，用于定时任务保护）
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader !== `Bearer ${WORKER_SECRET}`) {
            return res.status(401).json({ error: 'Invalid authorization' });
        }

        console.log('[Queue API] Starting batch processing...');

        const stats = await taskManager.getQueueStats();
        console.log(`[Queue API] Queue stats - Pending: ${stats.pending}, Processing: ${stats.processing}`);

        const processed = await queueWorker.processBatch(5);

        res.json({
            success: true,
            processed,
            queueStats: stats,
        });
    } catch (error: any) {
        console.error('[Queue API] Worker error:', error);
        res.status(500).json({
            error: error.message || 'Worker failed'
        });
    }
});

/**
 * GET /api/queue/process
 * 健康检查
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
 * 获取当前用户的任务状态（需要 authentication）
 */
router.get('/current-task', async (req: Request, res: Response) => {
    try {
        // 从请求头或查询参数获取 userId
        const userId = (req as any).userId || req.query.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: userId required' });
        }

        const { userTaskTracker } = await import('../lib/queue/user-task-tracker.js');
        const currentTask = await userTaskTracker.getCurrentTask(userId.toString());

        if (!currentTask) {
            return res.json({ taskId: null, status: null });
        }

        // 获取任务详细状态
        const task = await taskManager.getTask(currentTask.taskId);

        if (!task) {
            // 任务已过期或不存在，清除记录
            await userTaskTracker.clearCurrentTask(userId.toString());
            return res.json({ taskId: null, status: null });
        }

        // 如果任务已完成或失败，清除当前任务记录
        if (task.status === 'completed' || task.status === 'failed') {
            await userTaskTracker.clearCurrentTask(userId.toString());
        }

        res.json({
            taskId: task.id,
            status: task.status,
            result: task.result,
            error: task.error,
            metadata: currentTask.metadata,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        });
    } catch (error: any) {
        console.error('[Queue API] Current task error:', error);
        res.status(500).json({
            error: error.message || 'Failed to get current task'
        });
    }
});

export default router;
