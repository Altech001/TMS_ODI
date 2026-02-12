import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
    unreadOnly: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
});

export const notificationIdParamSchema = z.object({
    notificationId: z.string().uuid('Invalid notification ID'),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
