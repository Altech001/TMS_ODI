import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { projectService } from './project.service.js';
import type {
    CreateProjectInput,
    UpdateProjectInput,
    AddProjectMemberInput,
    ListProjectsQuery,
} from './project.dto.js';

export class ProjectController {
    async create(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const input = req.body as CreateProjectInput;
            const project = await projectService.createProject(
                req.organizationId,
                input,
                req.user.id
            );

            res.status(201).json({ success: true, data: project });
        } catch (error) {
            next(error);
        }
    }

    async list(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const query = req.query as ListProjectsQuery;
            const result = await projectService.listProjects(
                req.organizationId,
                req.user.id,
                query
            );

            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async get(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const project = await projectService.getProject(
                req.organizationId,
                req.params.projectId,
                req.user.id
            );

            res.json({ success: true, data: project });
        } catch (error) {
            next(error);
        }
    }

    async update(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const input = req.body as UpdateProjectInput;
            const project = await projectService.updateProject(
                req.organizationId,
                req.params.projectId,
                input,
                req.user.id
            );

            res.json({ success: true, data: project });
        } catch (error) {
            next(error);
        }
    }

    async delete(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const result = await projectService.deleteProject(
                req.organizationId,
                req.params.projectId,
                req.user.id
            );

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async archive(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const result = await projectService.archiveProject(
                req.organizationId,
                req.params.projectId,
                req.user.id
            );

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async unarchive(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const result = await projectService.unarchiveProject(
                req.organizationId,
                req.params.projectId,
                req.user.id
            );

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async addMember(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const input = req.body as AddProjectMemberInput;
            const member = await projectService.addMember(
                req.organizationId,
                req.params.projectId,
                input,
                req.user.id
            );

            res.status(201).json({ success: true, data: member });
        } catch (error) {
            next(error);
        }
    }

    async removeMember(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const result = await projectService.removeMember(
                req.organizationId,
                req.params.projectId,
                req.params.userId,
                req.user.id
            );

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMembers(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const members = await projectService.getMembers(
                req.organizationId,
                req.params.projectId,
                req.user.id
            );

            res.json({ success: true, data: members });
        } catch (error) {
            next(error);
        }
    }

    async getStats(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Org not resolved');

            const stats = await projectService.getStats(
                req.organizationId,
                req.params.projectId,
                req.user.id
            );

            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
}

export const projectController = new ProjectController();
export default projectController;
