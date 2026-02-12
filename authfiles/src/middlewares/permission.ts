import type { Response, NextFunction } from 'express';
import type { MemberRole } from '@prisma/client';
import type { AuthenticatedRequest } from './auth.js';
import { ForbiddenError } from '../utils/errors.js';

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: MemberRole[] = ['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER', 'ACCOUNTANT'];

export function getRoleWeight(role: MemberRole): number {
    return ROLE_HIERARCHY.indexOf(role);
}

export function hasMinimumRole(userRole: MemberRole, requiredRole: MemberRole): boolean {
    return getRoleWeight(userRole) >= getRoleWeight(requiredRole);
}

export type Permission =
    // Organization permissions
    | 'org:read'
    | 'org:update'
    | 'org:delete'
    | 'org:invite'
    | 'org:remove_member'
    | 'org:manage_roles'
    | 'org:transfer_ownership'
    // Project permissions
    | 'project:create'
    | 'project:read'
    | 'project:update'
    | 'project:delete'
    | 'project:archive'
    | 'project:manage_members'
    // Task permissions
    | 'task:create'
    | 'task:read'
    | 'task:update'
    | 'task:delete'
    | 'task:assign'
    | 'task:change_status'
    // Expense permissions
    | 'expense:create'
    | 'expense:read'
    | 'expense:update'
    | 'expense:delete'
    | 'expense:approve'
    | 'expense:reject'
    // Audit permissions
    | 'audit:read'
    // Org Finance permissions
    | 'org_finance:read'
    | 'org_finance:create'
    | 'org_finance:update'
    | 'org_finance:delete'
    | 'org_finance:request_delete'
    | 'org_finance:approve'
    | 'org_finance:report'
    | 'org_finance:manage_accounts';

// Permission matrix
const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
    VIEWER: [
        'org:read',
        'project:read',
        'task:read',
        'expense:read',
        'org_finance:read',
    ],
    ACCOUNTANT: [
        'org:read',
        'project:read',
        'task:read',
        'expense:read',
        'org_finance:read',
        'org_finance:create',
        'org_finance:update',
        'org_finance:delete',
        'org_finance:request_delete',
        'org_finance:approve',
        'org_finance:report',
    ],
    MEMBER: [
        'org:read',
        'project:read',
        'project:create',
        'task:read',
        'task:create',
        'task:update',
        'task:change_status',
        'expense:read',
        'expense:create',
        'expense:update',
        'org_finance:read',
    ],
    MANAGER: [
        'org:read',
        'project:read',
        'project:create',
        'project:update',
        'project:archive',
        'project:manage_members',
        'task:read',
        'task:create',
        'task:update',
        'task:delete',
        'task:assign',
        'task:change_status',
        'expense:read',
        'expense:create',
        'expense:update',
        'expense:delete',
        'expense:approve',
        'expense:reject',
        'org_finance:read',
        'org_finance:create',
        'org_finance:update',
        'org_finance:request_delete',
        'org_finance:report',
    ],
    ADMIN: [
        'org:read',
        'audit:read',
        'org:update',
        'org:invite',
        'org:remove_member',
        'org:manage_roles',
        'project:read',
        'project:create',
        'project:update',
        'project:delete',
        'project:archive',
        'project:manage_members',
        'task:read',
        'task:create',
        'task:update',
        'task:delete',
        'task:assign',
        'task:change_status',
        'expense:read',
        'expense:create',
        'expense:update',
        'expense:delete',
        'expense:approve',
        'expense:reject',
        'org_finance:read',
        'org_finance:create',
        'org_finance:update',
        'org_finance:delete',
        'org_finance:request_delete',
        'org_finance:approve',
        'org_finance:report',
        'org_finance:manage_accounts',
    ],
    OWNER: [
        'org:read',
        'audit:read',
        'org:update',
        'org:delete',
        'org:invite',
        'org:remove_member',
        'org:manage_roles',
        'org:transfer_ownership',
        'project:read',
        'project:create',
        'project:update',
        'project:delete',
        'project:archive',
        'project:manage_members',
        'task:read',
        'task:create',
        'task:update',
        'task:delete',
        'task:assign',
        'task:change_status',
        'expense:read',
        'expense:create',
        'expense:update',
        'expense:delete',
        'expense:approve',
        'expense:reject',
        'org_finance:read',
        'org_finance:create',
        'org_finance:update',
        'org_finance:delete',
        'org_finance:request_delete',
        'org_finance:approve',
        'org_finance:report',
        'org_finance:manage_accounts',
    ],
};

export function hasPermission(role: MemberRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(...permissions: Permission[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.memberRole) {
            next(new ForbiddenError('Role not determined'));
            return;
        }

        const hasAllPermissions = permissions.every((permission) =>
            hasPermission(req.memberRole!, permission)
        );

        if (!hasAllPermissions) {
            next(new ForbiddenError('Insufficient permissions'));
            return;
        }

        next();
    };
}

export function requireAnyPermission(...permissions: Permission[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.memberRole) {
            next(new ForbiddenError('Role not determined'));
            return;
        }

        const hasAnyPermission = permissions.some((permission) =>
            hasPermission(req.memberRole!, permission)
        );

        if (!hasAnyPermission) {
            next(new ForbiddenError('Insufficient permissions'));
            return;
        }

        next();
    };
}

export function requireRole(...roles: MemberRole[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.memberRole) {
            next(new ForbiddenError('Role not determined'));
            return;
        }

        if (!roles.includes(req.memberRole)) {
            next(new ForbiddenError('Insufficient role'));
            return;
        }

        next();
    };
}

export function requireMinimumRole(minimumRole: MemberRole) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.memberRole) {
            next(new ForbiddenError('Role not determined'));
            return;
        }

        if (!hasMinimumRole(req.memberRole, minimumRole)) {
            next(new ForbiddenError(`Requires at least ${minimumRole} role`));
            return;
        }

        next();
    };
}
