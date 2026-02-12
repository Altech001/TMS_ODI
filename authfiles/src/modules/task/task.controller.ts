import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { taskService } from './task.service.js';
import type {
    CreateTaskInput,
    UpdateTaskInput,
    UpdateTaskStatusInput,
    AssignTaskInput,
    ListTasksQuery,
} from './task.dto.js';

export class TaskController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateTaskInput;
            const task = await taskService.createTask(req.organizationId, input, req.user.id);
            res.status(201).json({ success: true, data: task });
        } catch (error) { next(error); }
    }

    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as ListTasksQuery;
            const result = await taskService.listTasks(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async get(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const task = await taskService.getTask(req.organizationId, req.params.taskId);
            res.json({ success: true, data: task });
        } catch (error) { next(error); }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdateTaskInput;
            const task = await taskService.updateTask(req.organizationId, req.params.taskId, input, req.user.id);
            res.json({ success: true, data: task });
        } catch (error) { next(error); }
    }

    async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdateTaskStatusInput;
            const task = await taskService.updateTaskStatus(req.organizationId, req.params.taskId, input, req.user.id);
            res.json({ success: true, data: task });
        } catch (error) { next(error); }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const result = await taskService.deleteTask(req.organizationId, req.params.taskId, req.user.id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async assign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as AssignTaskInput;
            const assignee = await taskService.assignTask(req.organizationId, req.params.taskId, input.userId, req.user.id);
            res.status(201).json({ success: true, data: assignee });
        } catch (error) { next(error); }
    }

    async unassign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const result = await taskService.unassignTask(req.organizationId, req.params.taskId, req.params.userId, req.user.id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async getActivityLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const logs = await taskService.getActivityLogs(req.organizationId, req.params.taskId);
            res.json({ success: true, data: logs });
        } catch (error) { next(error); }
    }
}

export const taskController = new TaskController();
export default taskController;
