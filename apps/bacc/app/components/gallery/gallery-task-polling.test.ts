import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideGalleryPoll } from "./gallery-task-polling.js";

describe("decideGalleryPoll", () => {
    it("refreshes history when the watched task is already completed on the first poll", () => {
        const decision = decideGalleryPoll({
            previousPendingTaskIds: [],
            tasks: [{
                taskId: "task-123",
                status: "completed",
                result: { imageUrl: "https://example.com/generated.png" },
            }],
            watchedTaskId: "task-123",
            handledWatchedTaskIds: new Set(),
        });

        assert.equal(decision.shouldRefreshHistory, true);
        assert.equal(decision.watchedTaskFinished, true);
        assert.deepEqual(decision.activeTasks, []);
    });

    it("keeps active tasks visible without refreshing history", () => {
        const decision = decideGalleryPoll({
            previousPendingTaskIds: [],
            tasks: [{ taskId: "task-123", status: "processing" }],
            watchedTaskId: "task-123",
            handledWatchedTaskIds: new Set(),
        });

        assert.equal(decision.shouldRefreshHistory, false);
        assert.equal(decision.watchedTaskFinished, false);
        assert.deepEqual(decision.activeTasks.map((task) => task.taskId), ["task-123"]);
    });

    it("does not refresh twice for an already handled completed task", () => {
        const decision = decideGalleryPoll({
            previousPendingTaskIds: [],
            tasks: [{ taskId: "task-123", status: "completed" }],
            watchedTaskId: "task-123",
            handledWatchedTaskIds: new Set(["task-123"]),
        });

        assert.equal(decision.shouldRefreshHistory, false);
        assert.equal(decision.watchedTaskFinished, false);
    });
});
