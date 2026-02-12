import type { ProjectVisibility, ProjectRole } from '@prisma/client';
import { projectRepository } from './project.repository.js';
import { auditService } from '../audit/audit.service.js';
import { notificationService } from '../notification/notification.service.js';
import { membershipRepository } from '../membership/membership.repository.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors.js';
import { parsePagination, paginatedResponse } from '../../utils/helpers.js';
import type {
    CreateProjectInput,
    UpdateProjectInput,
    AddProjectMemberInput,
    ListProjectsQuery,
} from './project.dto.js';

export class ProjectService {
    async createProject(
        organizationId: string,
        input: CreateProjectInput,
        userId: string
    ) {
        const project = await projectRepository.create({
            organizationId,
            name: input.name,
            description: input.description,
            visibility: input.visibility as ProjectVisibility,
            createdById: userId,
        });

        await auditService.log({
            organizationId,
            userId,
            entityType: 'Project',
            entityId: project.id,
            action: 'CREATE',
            newData: { name: project.name },
        });

        return project;
    }

    async getProject(organizationId: string, projectId: string, userId: string) {
        const project = await projectRepository.findById(projectId, organizationId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        // Check access for private projects
        if (project.visibility === 'PRIVATE') {
            const isMember = project.members.some((m) => m.userId === userId);
            if (!isMember) {
                throw new ForbiddenError('You do not have access to this project');
            }
        }

        return project;
    }

    async listProjects(
        organizationId: string,
        userId: string,
        query: ListProjectsQuery
    ) {
        const { skip, take } = parsePagination(query.page, query.limit);
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '20', 10);

        const { data, total } = await projectRepository.findMany(organizationId, userId, {
            status: query.status as any,
            visibility: query.visibility as any,
            skip,
            take,
        });

        return paginatedResponse(data, total, page, limit);
    }

    async updateProject(
        organizationId: string,
        projectId: string,
        input: UpdateProjectInput,
        userId: string
    ) {
        const project = await projectRepository.findById(projectId, organizationId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        // Check if user is project lead or has manage permission
        const projectMember = project.members.find((m) => m.userId === userId);
        const isLead = projectMember?.role === 'LEAD';
        const orgMember = await membershipRepository.getMember(organizationId, userId);
        const hasOrgPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMember?.role || '');

        if (!isLead && !hasOrgPermission) {
            throw new ForbiddenError('Only project leads can update the project');
        }

        const updated = await projectRepository.update(projectId, input);

        await auditService.log({
            organizationId,
            userId,
            entityType: 'Project',
            entityId: projectId,
            action: 'UPDATE',
            previousData: { name: project.name, visibility: project.visibility },
            newData: input,
        });

        return updated;
    }

    async archiveProject(
        organizationId: string,
        projectId: string,
        userId: string
    ) {
        const project = await projectRepository.findById(projectId, organizationId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        if (project.status === 'ARCHIVED') {
            throw new ConflictError('Project is already archived');
        }

        await projectRepository.archive(projectId);

        await auditService.log({
            organizationId,
            userId,
            entityType: 'Project',
            entityId: projectId,
            action: 'ARCHIVE',
        });

        return { success: true };
    }

    async unarchiveProject(
        organizationId: string,
        projectId: string,
        userId: string
    ) {
        const project = await projectRepository.findById(projectId, organizationId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        if (project.status !== 'ARCHIVED') {
            throw new ConflictError('Project is not archived');
        }

        await projectRepository.unarchive(projectId);

        await auditService.log({
            organizationId,
            userId,
            entityType: 'Project',
            entityId: projectId,
            action: 'UNARCHIVE',
        });

        return { success: true };
    }

    async deleteProject(
        organizationId: string,
        projectId: string,
        userId: string
    ) {
        const project = await projectRepository.findById(projectId, organizationId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        await projectRepository.softDelete(projectId);

        await auditService.log({
            organizationId,
            userId,
            entityType: 'Project',
            entityId: projectId,
            action: 'DELETE',
        });

        return { success: true };
    }

    async addMember(
        organizationId: string,
        projectId: string,
        input: AddProjectMemberInput,
        _actorId: string
    ) {
        const project = await projectRepository.findById(projectId, organizationId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        // Check if user is already a member
        const existingMember = await projectRepository.getMember(projectId, input.userId);
        if (existingMember) {
            throw new ConflictError('User is already a project member');
        }

        // Verify user is an org member
        const orgMember = await membershipRepository.getMember(organizationId, input.userId);
        if (!orgMember) {
            throw new NotFoundError('User is not a member of this organization');
        }

        const member = await projectRepository.addMember(
            projectId,
            input.userId,
            input.role as ProjectRole
        );

        // Notify the new member
        await notificationService.create({
            userId: input.userId,
            organizationId,
            type: 'PROJECT_ADDED',
            title: 'Added to Project',
            message: `You have been added to project "${project.name}"`,
            data: { projectId, role: input.role },
        });

        return member;
    }

    async removeMember(
        organizationId: string,
        projectId: string,
        userId: string,
        _actorId: string
    ) {
        const project = await projectRepository.findById(projectId, organizationId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        const member = await projectRepository.getMember(projectId, userId);
        if (!member) {
            throw new NotFoundError('User is not a project member');
        }

        // Prevent removing the last lead
        if (member.role === 'LEAD') {
            const leads = project.members.filter((m) => m.role === 'LEAD');
            if (leads.length <= 1) {
                throw new ForbiddenError('Cannot remove the only project lead');
            }
        }

        await projectRepository.removeMember(projectId, userId);

        return { success: true };
    }

    async getMembers(organizationId: string, projectId: string, userId: string) {
        const project = await this.getProject(organizationId, projectId, userId);
        return projectRepository.getMembers(project.id);
    }

    async getStats(organizationId: string, projectId: string, userId: string) {
        await this.getProject(organizationId, projectId, userId); // Access check
        return projectRepository.getStats(projectId);
    }
}

export const projectService = new ProjectService();
export default projectService;
