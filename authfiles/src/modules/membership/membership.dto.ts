import { z } from 'zod';

export const updateMemberRoleSchema = z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'OWNER']),
});

export const memberIdParamSchema = z.object({
    memberId: z.string().uuid('Invalid member ID'),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
