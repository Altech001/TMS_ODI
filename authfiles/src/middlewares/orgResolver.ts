import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { BadRequestError, ForbiddenError } from '../utils/errors.js';
import prisma from '../libs/prisma.js';
import { redis } from '../libs/redis.js';

const ORG_CACHE_TTL = 300; // 5 minutes

export async function orgResolverMiddleware(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const organizationId = req.headers['x-organization-id'] as string;

        if (!organizationId) {
            throw new BadRequestError('Organization ID required in x-organization-id header');
        }

        if (!req.user) {
            throw new ForbiddenError('User not authenticated');
        }

        // Check cache first
        const cacheKey = `org:${organizationId}:member:${req.user.id}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            const memberData = JSON.parse(cached);
            req.organizationId = organizationId;
            req.memberRole = memberData.role;
            next();
            return;
        }

        // Verify organization exists and is not deleted
        const organization = await prisma.organization.findFirst({
            where: {
                id: organizationId,
                deletedAt: null,
            },
        });

        if (!organization) {
            throw new BadRequestError('Organization not found');
        }

        // Check user membership
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.id,
                    organizationId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenError('Not a member of this organization');
        }

        // Cache the membership
        await redis.setex(cacheKey, ORG_CACHE_TTL, JSON.stringify({ role: membership.role }));

        req.organizationId = organizationId;
        req.memberRole = membership.role;
        next();
    } catch (error) {
        next(error);
    }
}

export async function optionalOrgResolver(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const organizationId = req.headers['x-organization-id'] as string;

        if (!organizationId) {
            next();
            return;
        }

        if (!req.user) {
            next();
            return;
        }

        // Check cache first
        const cacheKey = `org:${organizationId}:member:${req.user.id}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            const memberData = JSON.parse(cached);
            req.organizationId = organizationId;
            req.memberRole = memberData.role;
            next();
            return;
        }

        // Verify organization exists
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.id,
                    organizationId,
                },
            },
        });

        if (membership) {
            await redis.setex(cacheKey, 300, JSON.stringify({ role: membership.role }));
            req.organizationId = organizationId;
            req.memberRole = membership.role;
        }

        next();
    } catch (error) {
        next(error);
    }
}

export function clearOrgMembershipCache(organizationId: string, userId: string): Promise<number> {
    const cacheKey = `org:${organizationId}:member:${userId}`;
    return redis.del(cacheKey);
}

export async function clearOrgCache(organizationId: string): Promise<void> {
    const keys = await redis.keys(`org:${organizationId}:*`);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
}
