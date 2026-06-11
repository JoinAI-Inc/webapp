import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findActiveTemplateTask } from './task-recovery.js';

describe('findActiveTemplateTask', () => {
    it('finds the active task for the current template after a page refresh', () => {
        const task = findActiveTemplateTask({
            tasks: [
                {
                    taskId: 'other-task',
                    status: 'processing',
                    metadata: { payload: { templateId: 'other-template' } },
                },
                {
                    taskId: 'current-task',
                    status: 'pending',
                    metadata: { payload: { templateId: 'template-123' } },
                },
            ],
        }, 'template-123');

        assert.equal(task?.taskId, 'current-task');
    });

    it('ignores completed tasks', () => {
        const task = findActiveTemplateTask({
            tasks: [{
                taskId: 'completed-task',
                status: 'completed',
                metadata: { payload: { templateId: 'template-123' } },
            }],
        }, 'template-123');

        assert.equal(task, null);
    });
});
