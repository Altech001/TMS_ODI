import type { TaskStatus, TaskPriority } from '@prisma/client';
import { taskRepository } from './task.repository.js';
import { notificationService } from '../notification/notification.service.js';
import { membershipRepository } from '../membership/membership.repository.js';
import { wsManager } from '../../libs/websocket.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { parsePagination, paginatedResponse, parseBoolean } from '../../utils/helpers.js';
import type {
    CreateTaskInput,
    UpdateTaskInput,
    UpdateTaskStatusInput,
    ListTasksQuery,
} from './task.dto.js';

export class TaskService {
    async createTask(
        organizationId: string,
        input: CreateTaskInput,
        userId: string
    ) {
        // Validate parent task if provided
        if (input.parentTaskId) {
            const parentTask = await taskRepository.findById(input.parentTaskId, organizationId);
            if (!parentTask) {
                throw new NotFoundError('Parent task not found');
            }
        }

        const task = await taskRepository.create({
            organizationId,
            projectId: input.projectId,
            parentTaskId: input.parentTaskId,
            title: input.title,
            description: input.description,
            status: input.status as TaskStatus,
            priority: input.priority as TaskPriority,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            createdById: userId,
        });

        // Add assignees if provided
        if (input.assigneeIds?.length) {
            for (const assigneeId of input.assigneeIds) {
                await this.assignTask(organizationId, task.id, assigneeId, userId);
            }
        }

        await taskRepository.logActivity(task.id, 'CREATED', {
            createdBy: userId,
            title: task.title,
        });

        return task;
    }

    async getTask(organizationId: string, taskId: string) {
        const task = await taskRepository.findById(taskId, organizationId);
        if (!task) {
            throw new NotFoundError('Task not found');
        }
        return task;
    }

    async listTasks(organizationId: string, query: ListTasksQuery) {
        const { skip, take } = parsePagination(query.page, query.limit);
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '20', 10);

        const includeSubtasks = parseBoolean(query.includeSubtasks);

        const { data, total } = await taskRepository.findMany(organizationId, {
            projectId: query.projectId,
            status: query.status as TaskStatus,
            priority: query.priority as TaskPriority,
            assigneeId: query.assigneeId,
            parentTaskId: includeSubtasks ? undefined : (query.parentTaskId || null),
            skip,
            take,
        });

        return paginatedResponse(data, total, page, limit);
    }

    async updateTask(
        organizationId: string,
        taskId: string,
        input: UpdateTaskInput,
        userId: string
    ) {
        const task = await taskRepository.findById(taskId, organizationId);
        if (!task) {
            throw new NotFoundError('Task not found');
        }

        const updateData: Parameters<typeof taskRepository.update>[1] = {};
        const changes: Record<string, { from: unknown; to: unknown }> = {};

        if (input.title !== undefined && input.title !== task.title) {
            updateData.title = input.title;
            changes.title = { from: task.title, to: input.title };
        }

        if (input.description !== undefined && input.description !== task.description) {
            updateData.description = input.description;
            changes.description = { from: task.description, to: input.description };
        }

        if (input.priority !== undefined && input.priority !== task.priority) {
            updateData.priority = input.priority as TaskPriority;
            changes.priority = { from: task.priority, to: input.priority };
        }

        if (input.dueDate !== undefined) {
            const newDueDate = input.dueDate ? new Date(input.dueDate) : null;
            updateData.dueDate = newDueDate;
            changes.dueDate = { from: task.dueDate, to: newDueDate };
        }

        if (input.status !== undefined && input.status !== task.status) {
            updateData.status = input.status as TaskStatus;
            changes.status = { from: task.status, to: input.status };

            if (input.status === 'COMPLETED') {
                updateData.completedAt = new Date();
            } else if (task.status === 'COMPLETED') {
                updateData.completedAt = null;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return task;
        }

        const updated = await taskRepository.update(taskId, updateData);

        await taskRepository.logActivity(taskId, 'UPDATED', {
            updatedBy: userId,
            changes,
        });

        // Notify assignees
        for (const assignee of task.assignees) {
            if (assignee.userId !== userId) {
                await notificationService.create({
                    userId: assignee.userId,
                    organizationId,
                    type: 'TASK_UPDATED',
                    title: 'Task Updated',
                    message: `Task "${task.title}" has been updated`,
                    data: { taskId, changes: Object.keys(changes) },
                });
            }
        }

        // Broadcast via WebSocket
        await wsManager.publishToOrganization(organizationId, 'task:updated', {
            taskId,
            changes: Object.keys(changes),
        });

        return updated;
    }

    async updateTaskStatus(
        organizationId: string,
        taskId: string,
        input: UpdateTaskStatusInput,
        userId: string
    ) {
        const task = await taskRepository.findById(taskId, organizationId);
        if (!task) {
            throw new NotFoundError('Task not found');
        }

        if (task.status === input.status) {
            return task;
        }

        const previousStatus = task.status;
        const updateData: Parameters<typeof taskRepository.update>[1] = {
            status: input.status as TaskStatus,
        };

        if (input.status === 'COMPLETED') {
            updateData.completedAt = new Date();
        } else if (previousStatus === 'COMPLETED') {
            updateData.completedAt = null;
        }

        const updated = await taskRepository.update(taskId, updateData);

        await taskRepository.logActivity(taskId, 'STATUS_CHANGED', {
            changedBy: userId,
            from: previousStatus,
            to: input.status,
        });

        // Notify task creator if different from status changer
        if (task.createdBy.id !== userId) {
            await notificationService.create({
                userId: task.createdBy.id,
                organizationId,
                type: input.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
                title: input.status === 'COMPLETED' ? 'Task Completed' : 'Task Status Updated',
                message: `Task "${task.title}" status changed to ${input.status}`,
                data: { taskId, from: previousStatus, to: input.status },
            });
        }

        await wsManager.publishToOrganization(organizationId, 'task:status_changed', {
            taskId,
            from: previousStatus,
            to: input.status,
        });

        return updated;
    }

    async deleteTask(organizationId: string, taskId: string, userId: string) {
        const task = await taskRepository.findById(taskId, organizationId);
        if (!task) {
            throw new NotFoundError('Task not found');
        }

        await taskRepository.softDelete(taskId);

        await taskRepository.logActivity(taskId, 'DELETED', {
            deletedBy: userId,
        });

        return { success: true };
    }

    async assignTask(
        organizationId: string,
        taskId: string,
        assigneeId: string,
        actorId: string
    ) {
        const task = await taskRepository.findById(taskId, organizationId);
        if (!task) {
            throw new NotFoundError('Task not found');
        }

        // Verify assignee is an org member
        const orgMember = await membershipRepository.getMember(organizationId, assigneeId);
        if (!orgMember) {
            throw new BadRequestError('User is not a member of this organization');
        }

        // Check if already assigned
        const isAssigned = await taskRepository.isAssigned(taskId, assigneeId);
        if (isAssigned) {
            throw new BadRequestError('User is already assigned to this task');
        }

        const assignee = await taskRepository.addAssignee(taskId, assigneeId);

        await taskRepository.logActivity(taskId, 'ASSIGNED', {
            assignedBy: actorId,
            assigneeId,
        });

        // Notify the assignee
        if (assigneeId !== actorId) {
            await notificationService.create({
                userId: assigneeId,
                organizationId,
                type: 'TASK_ASSIGNED',
                title: 'Task Assigned',
                message: `You have been assigned to "${task.title}"`,
                data: { taskId },
            });
        }

        return assignee;
    }

    async unassignTask(
        organizationId: string,
        taskId: string,
        assigneeId: string,
        actorId: string
    ) {
        const task = await taskRepository.findById(taskId, organizationId);
        if (!task) {
            throw new NotFoundError('Task not found');
        }

        const isAssigned = await taskRepository.isAssigned(taskId, assigneeId);
        if (!isAssigned) {
            throw new NotFoundError('User is not assigned to this task');
        }

        await taskRepository.removeAssignee(taskId, assigneeId);

        await taskRepository.logActivity(taskId, 'UNASSIGNED', {
            unassignedBy: actorId,
            assigneeId,
        });

        return { success: true };
    }

    async getActivityLogs(organizationId: string, taskId: string) {
        const task = await taskRepository.findById(taskId, organizationId);
        if (!task) {
            throw new NotFoundError('Task not found');
        }

        return taskRepository.getActivityLogs(taskId);
    }
}

export const taskService = new TaskService();
export default taskService;
