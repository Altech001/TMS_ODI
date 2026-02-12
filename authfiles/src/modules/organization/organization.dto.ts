import { z } from 'zod';

export const createOrganizationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const updateOrganizationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
});

export const inviteUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
});

export const acceptInviteSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export const transferOwnershipSchema = z.object({
    newOwnerId: z.string().uuid('Invalid user ID'),
});

export const organizationIdParamSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID'),
});

// NEW: Validation for public invite access
export const getInviteInfoSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;