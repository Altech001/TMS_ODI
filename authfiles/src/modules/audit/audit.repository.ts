import type { Prisma } from '@prisma/client';
import prisma from '../../libs/prisma.js';

export class AuditRepository {
    async create(data: {
        organizationId: string;
        userId: string;
        entityType: string;
        entityId: string;
        action: string;
        previousData?: object;
        newData?: object;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return prisma.auditLog.create({
            data: {
                organizationId: data.organizationId,
                userId: data.userId,
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                previousData: data.previousData as Prisma.InputJsonValue,
                newData: data.newData as Prisma.InputJsonValue,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    }

    async findMany(
        organizationId: string,
        options: {
            entityType?: string;
            entityId?: string;
            userId?: string;
            action?: string;
            startDate?: Date;
            endDate?: Date;
            skip?: number;
            take?: number;
        }
    ) {
        const where: Prisma.AuditLogWhereInput = {
            organizationId,
            ...(options.entityType && { entityType: options.entityType }),
            ...(options.entityId && { entityId: options.entityId }),
            ...(options.userId && { userId: options.userId }),
            ...(options.action && { action: options.action }),
            ...((options.startDate || options.endDate) && {
                createdAt: {
                    ...(options.startDate && { gte: options.startDate }),
                    ...(options.endDate && { lte: options.endDate }),
                },
            }),
        };

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip: options.skip,
                take: options.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, email: true, name: true } },
                },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { data, total };
    }

    async findByEntity(organizationId: string, entityType: string, entityId: string) {
        return prisma.auditLog.findMany({
            where: {
                organizationId,
                entityType,
                entityId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true } },
            },
        });
    }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
