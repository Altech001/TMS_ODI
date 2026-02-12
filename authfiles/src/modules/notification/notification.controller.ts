import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { notificationService } from './notification.service.js';
import type { ListNotificationsQuery } from './notification.dto.js';

export class NotificationController {
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            const query = req.query as ListNotificationsQuery;
            const result = await notificationService.listNotifications(req.user.id, req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            const notification = await notificationService.markAsRead(req.params.notificationId, req.user.id);
            res.json({ success: true, data: notification });
        } catch (error) { next(error); }
    }

    async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            const result = await notificationService.markAllAsRead(req.user.id, req.organizationId);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            const result = await notificationService.deleteNotification(req.params.notificationId, req.user.id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async deleteAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            const result = await notificationService.deleteAllRead(req.user.id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }
}

export const notificationController = new NotificationController();
export default notificationController;
