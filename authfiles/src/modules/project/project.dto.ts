import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(1000).optional(),
    visibility: z.enum(['PRIVATE', 'ORG_WIDE']).default('PRIVATE'),
});

export const updateProjectSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    visibility: z.enum(['PRIVATE', 'ORG_WIDE']).optional(),
});

export const projectIdParamSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
});

export const addProjectMemberSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: z.enum(['LEAD', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export const listProjectsQuerySchema = z.object({
    status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
    visibility: z.enum(['PRIVATE', 'ORG_WIDE']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
