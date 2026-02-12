import type { NotificationType, Prisma } from '@prisma/client';
import prisma from '../../libs/prisma.js';

export class NotificationRepository {
    async findById(id: string, userId: string) {
        return prisma.notification.findFirst({
            where: { id, userId },
        });
    }

    async findMany(
        userId: string,
        options: {
            organizationId?: string;
            unreadOnly?: boolean;
            skip?: number;
            take?: number;
        }
    ) {
        const where: Prisma.NotificationWhereInput = {
            userId,
            ...(options.organizationId && { organizationId: options.organizationId }),
            ...(options.unreadOnly && { readAt: null }),
        };

        const [data, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip: options.skip,
                take: options.take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId, readAt: null },
            }),
        ]);

        return { data, total, unreadCount };
    }

    async create(data: {
        userId: string;
        organizationId?: string;
        type: NotificationType;
        title: string;
        message: string;
        data?: object;
    }) {
        return prisma.notification.create({
            data: {
                userId: data.userId,
                organizationId: data.organizationId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data as Prisma.InputJsonValue,
            },
        });
    }

    async markAsRead(id: string) {
        return prisma.notification.update({
            where: { id },
            data: { readAt: new Date() },
        });
    }

    async markAllAsRead(userId: string, organizationId?: string) {
        return prisma.notification.updateMany({
            where: {
                userId,
                readAt: null,
                ...(organizationId && { organizationId }),
            },
            data: { readAt: new Date() },
        });
    }

    async delete(id: string) {
        return prisma.notification.delete({
            where: { id },
        });
    }

    async deleteAllRead(userId: string) {
        return prisma.notification.deleteMany({
            where: {
                userId,
                readAt: { not: null },
            },
        });
    }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
