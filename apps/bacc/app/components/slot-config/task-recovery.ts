export interface RecoverableTask {
    taskId: string;
    status: string;
    metadata?: {
        payload?: {
            templateId?: string;
        };
    } | null;
}

export function findActiveTemplateTask(
    data: { tasks?: RecoverableTask[]; taskId?: string; status?: string; metadata?: RecoverableTask['metadata'] },
    templateId: string,
): RecoverableTask | null {
    const tasks = Array.isArray(data.tasks)
        ? data.tasks
        : data.taskId
            ? [{ taskId: data.taskId, status: data.status || '', metadata: data.metadata }]
            : [];

    return tasks.find((task) =>
        (task.status === 'pending' || task.status === 'processing') &&
        task.metadata?.payload?.templateId === templateId
    ) || null;
}
