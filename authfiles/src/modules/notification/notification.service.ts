import type { NotificationType } from '@prisma/client';
import { notificationRepository } from './notification.repository.js';
import { wsManager } from '../../libs/websocket.js';
import { parsePagination, paginatedResponse, parseBoolean } from '../../utils/helpers.js';
import { NotFoundError } from '../../utils/errors.js';
import type { ListNotificationsQuery } from './notification.dto.js';

export class NotificationService {
    async create(data: {
        userId: string;
        organizationId?: string;
        type: string;
        title: string;
        message: string;
        data?: object;
    }) {
        const notification = await notificationRepository.create({
            userId: data.userId,
            organizationId: data.organizationId,
            type: data.type as NotificationType,
            title: data.title,
            message: data.message,
            data: data.data,
        });

        // Send to user via WebSocket
        wsManager.broadcastToUser(data.userId, {
            type: 'notification:new',
            payload: notification,
        });

        return notification;
    }

    async listNotifications(
        userId: string,
        organizationId: string | undefined,
        query: ListNotificationsQuery
    ) {
        const { skip, take } = parsePagination(query.page, query.limit);
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '20', 10);

        const { data, total, unreadCount } = await notificationRepository.findMany(userId, {
            organizationId,
            unreadOnly: parseBoolean(query.unreadOnly),
            skip,
            take,
        });

        return {
            ...paginatedResponse(data, total, page, limit),
            unreadCount,
        };
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await notificationRepository.findById(notificationId, userId);
        if (!notification) {
            throw new NotFoundError('Notification not found');
        }

        return notificationRepository.markAsRead(notificationId);
    }

    async markAllAsRead(userId: string, organizationId?: string) {
        await notificationRepository.markAllAsRead(userId, organizationId);
        return { success: true };
    }

    async deleteNotification(notificationId: string, userId: string) {
        const notification = await notificationRepository.findById(notificationId, userId);
        if (!notification) {
            throw new NotFoundError('Notification not found');
        }

        await notificationRepository.delete(notificationId);
        return { success: true };
    }

    async deleteAllRead(userId: string) {
        await notificationRepository.deleteAllRead(userId);
        return { success: true };
    }
}

export const notificationService = new NotificationService();
export default notificationService;
