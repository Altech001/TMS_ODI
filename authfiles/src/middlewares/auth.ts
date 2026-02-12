import type { Request, Response, NextFunction } from 'express';
import type { MemberRole } from '@prisma/client';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import prisma from '../libs/prisma.js';

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
    organizationId?: string;
    memberRole?: MemberRole;
}

export async function authMiddleware(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            throw new UnauthorizedError('No token provided');
        }

        const decoded = verifyAccessToken(token);

        if (!decoded) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        if (decoded.type !== 'access') {
            throw new UnauthorizedError('Invalid token type');
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                isEmailVerified: true,
            },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

export function optionalAuthMiddleware(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
        next();
        return;
    }

    const decoded = verifyAccessToken(token);

    if (decoded && decoded.type === 'access') {
        prisma.user
            .findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    isEmailVerified: true,
                },
            })
            .then((user) => {
                if (user) {
                    req.user = user;
                }
                next();
            })
            .catch(() => {
                next();
            });
    } else {
        next();
    }
}

export function requireEmailVerification(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void {
    if (!req.user?.isEmailVerified) {
        next(new UnauthorizedError('Email not verified'));
        return;
    }
    next();
}
