import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';

const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

export const notificationQueue = new Queue('notifications', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 500,
        },
    },
});

export const personalFinanceReportQueue = new Queue('personal-finance-reports', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});

export const orgFinanceReportQueue = new Queue('org-finance-reports', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});

export async function closeQueues() {
    await emailQueue.close();
    await notificationQueue.close();
    await personalFinanceReportQueue.close();
    await orgFinanceReportQueue.close();
    await connection.quit();
}

