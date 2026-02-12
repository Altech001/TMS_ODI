import logger from '../libs/logger.js';
import { closeEmailWorker } from './email.worker.js';
import { closeNotificationWorker } from './notification.worker.js';
import { closePersonalFinanceReportWorker } from './personalFinanceReport.worker.js';
import { closeOrgFinanceReportWorker } from './orgFinanceReport.worker.js';

// Re-export workers
export { emailWorker } from './email.worker.js';
export { notificationWorker } from './notification.worker.js';
export { personalFinanceReportWorker } from './personalFinanceReport.worker.js';
export { orgFinanceReportWorker } from './orgFinanceReport.worker.js';

export async function startWorkers() {
    logger.info('Starting background workers...');
    // Workers start automatically when imported
    logger.info('Email worker started');
    logger.info('Notification worker started');
    logger.info('Personal finance report worker started');
    logger.info('Org finance report worker started');
}

export async function stopWorkers() {
    logger.info('Stopping background workers...');
    await Promise.all([
        closeEmailWorker(),
        closeNotificationWorker(),
        closePersonalFinanceReportWorker(),
        closeOrgFinanceReportWorker(),
    ]);
    logger.info('All workers stopped');
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    await stopWorkers();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await stopWorkers();
    process.exit(0);
});

