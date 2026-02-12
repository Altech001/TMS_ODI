import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import { notificationRepository } from '../modules/notification/notification.repository.js';
import { wsManager } from '../libs/websocket.js';
import type { NotificationType } from '@prisma/client';
import logger from '../libs/logger.js';

const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

interface CreateNotificationJob {
    userId: string;
    organizationId?: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: object;
}

interface BroadcastNotificationJob {
    organizationId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: object;
    excludeUserIds?: string[];
}

type NotificationJobData = CreateNotificationJob | BroadcastNotificationJob;

export const notificationWorker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
        const { name, data } = job;

        try {
            switch (name) {
                case 'create':
                    const createData = data as CreateNotificationJob;
                    const notification = await notificationRepository.create({
                        userId: createData.userId,
                        organizationId: createData.organizationId,
                        type: createData.type,
                        title: createData.title,
                        message: createData.message,
                        data: createData.data,
                    });

                    // Send via WebSocket
                    wsManager.broadcastToUser(createData.userId, {
                        type: 'notification:new',
                        payload: notification,
                    });
                    logger.info(`Notification created for user ${createData.userId}`);
                    break;

                case 'broadcast':
                    const broadcastData = data as BroadcastNotificationJob;
                    // For broadcast, we would need to get all org members and create notifications
                    // This is a simplified version
                    await wsManager.publishToOrganization(
                        broadcastData.organizationId,
                        'notification:broadcast',
                        {
                            type: broadcastData.type,
                            title: broadcastData.title,
                            message: broadcastData.message,
                            data: broadcastData.data,
                        }
                    );
                    logger.info(`Broadcast notification sent to org ${broadcastData.organizationId}`);
                    break;

                default:
                    logger.warn(`Unknown notification job type: ${name}`);
            }
        } catch (error) {
            logger.error(`Notification job failed: ${name}`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 10,
    }
);

notificationWorker.on('completed', (job) => {
    logger.debug(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
    logger.error(`Notification job ${job?.id} failed:`, err);
});

export async function closeNotificationWorker() {
    await notificationWorker.close();
    await connection.quit();
}
