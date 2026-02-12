import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import logger from '../libs/logger.js';
import prisma from '../libs/prisma.js';
import { NotificationService } from '../modules/notification/notification.service.js';

const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

const notificationService = new NotificationService();

interface OrgFinanceReportJobData {
    reportId: string;
    organizationId: string;
    userId: string;
}

export const orgFinanceReportWorker = new Worker<OrgFinanceReportJobData>(
    'org-finance-reports',
    async (job) => {
        const { reportId, organizationId, userId } = job.data;
        logger.info('Processing org finance report', { reportId, organizationId });

        try {
            // Mark as processing
            await prisma.orgFinanceReport.update({
                where: { id: reportId },
                data: { status: 'PROCESSING' },
            });

            const report = await prisma.orgFinanceReport.findUnique({
                where: { id: reportId },
            });
            if (!report) throw new Error('Report not found');

            const params = report.parameters as Record<string, unknown>;
            const startDate = params.startDate ? new Date(params.startDate as string) : undefined;
            const endDate = params.endDate ? new Date(params.endDate as string) : undefined;
            const accountId = params.accountId as string | undefined;

            // Fetch ledger entries for the report
            const entries = await prisma.orgFinanceLedgerEntry.findMany({
                where: {
                    organizationId,
                    status: 'ACTIVE',
                    ...(accountId && { accountId }),
                    ...(startDate || endDate ? {
                        transactionDate: {
                            ...(startDate && { gte: startDate }),
                            ...(endDate && { lte: endDate }),
                        },
                    } : {}),
                },
                orderBy: { transactionDate: 'asc' },
                include: {
                    account: { select: { name: true, type: true } },
                    createdBy: { select: { name: true, email: true } },
                },
            });

            // Generate report content (placeholder — actual PDF/Excel generation
            // would use pdfkit/exceljs and upload to S3)
            const reportData = {
                title: `${report.type} Report`,
                organizationId,
                generatedAt: new Date().toISOString(),
                period: { startDate, endDate },
                entriesCount: entries.length,
                totalInflow: entries
                    .filter(e => e.type === 'INFLOW')
                    .reduce((sum, e) => sum + Number(e.amount), 0)
                    .toFixed(2),
                totalOutflow: entries
                    .filter(e => e.type === 'OUTFLOW')
                    .reduce((sum, e) => sum + Number(e.amount), 0)
                    .toFixed(2),
            };

            // For now, mark as completed without S3 upload
            // In production, you would generate PDF/Excel, upload to S3, and store the URL
            await prisma.orgFinanceReport.update({
                where: { id: reportId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    // fileUrl and fileKey would be set after S3 upload
                },
            });

            // Notify user that report is ready
            await notificationService.create({
                userId,
                organizationId,
                type: 'ORG_FINANCE_REPORT_READY',
                title: 'Report Ready',
                message: `Your ${report.type} report has been generated and is ready for download.`,
                data: { reportId, reportType: report.type, ...reportData },
            });

            logger.info('Org finance report completed', { reportId });
        } catch (error) {
            logger.error('Org finance report failed', {
                reportId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            await prisma.orgFinanceReport.update({
                where: { id: reportId },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                },
            });

            throw error;
        }
    },
    {
        connection,
        concurrency: 2,
    }
);

orgFinanceReportWorker.on('completed', (job) => {
    logger.info(`Org finance report job ${job.id} completed`);
});

orgFinanceReportWorker.on('failed', (job, error) => {
    logger.error(`Org finance report job ${job?.id} failed`, { error: error.message });
});

export async function closeOrgFinanceReportWorker() {
    await orgFinanceReportWorker.close();
}
