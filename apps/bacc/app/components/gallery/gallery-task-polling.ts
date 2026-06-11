export interface GalleryTaskSnapshot {
    taskId: string;
    status: string;
    result?: {
        imageUrl?: string;
    } | null;
    error?: string | null;
    metadata?: unknown;
    createdAt?: string;
}

export function decideGalleryPoll(_input: {
    previousPendingTaskIds: string[];
    tasks: GalleryTaskSnapshot[];
    watchedTaskId?: string | null;
    handledWatchedTaskIds: Set<string>;
}) {
    const activeTasks = _input.tasks.filter(
        (task) => task.status === "pending" || task.status === "processing",
    );
    const watchedTask = _input.watchedTaskId
        ? _input.tasks.find((task) => task.taskId === _input.watchedTaskId)
        : undefined;
    const watchedTaskFinished = !!(
        watchedTask &&
        (watchedTask.status === "completed" || watchedTask.status === "failed") &&
        !_input.handledWatchedTaskIds.has(watchedTask.taskId)
    );
    const previousPendingTasksFinished = (
        _input.previousPendingTaskIds.length > 0 &&
        activeTasks.length === 0
    );

    return {
        activeTasks,
        shouldRefreshHistory: (
            previousPendingTasksFinished ||
            (watchedTaskFinished && watchedTask?.status === "completed")
        ),
        watchedTaskFinished,
    };
}
