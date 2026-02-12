import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import config from '../config/index.js';
import prisma from '../libs/prisma.js';
import { s3Service, generateReportKey } from '../libs/s3.js';
import logger from '../libs/logger.js';
import type { PersonalReportType, ReportFormat } from '@prisma/client';

const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

interface ReportJobData {
    reportId: string;
    userId: string;
    type: PersonalReportType;
    format: ReportFormat;
    startDate: string;
    endDate: string;
    accountId?: string;
}

async function generatePdfReport(data: ReportJobData): Promise<Buffer> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Fetch transactions
    const transactions = await prisma.personalTransaction.findMany({
        where: {
            userId: data.userId,
            deletedAt: null,
            transactionAt: { gte: startDate, lte: endDate },
            ...(data.accountId && { accountId: data.accountId }),
        },
        include: {
            account: { select: { name: true, type: true } },
            category: { select: { name: true } },
        },
        orderBy: { transactionAt: 'desc' },
    });

    // Fetch accounts for summary
    const accounts = await prisma.personalAccount.findMany({
        where: { userId: data.userId, isArchived: false },
    });

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50 });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('Personal Finance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${startDate.toDateString()} - ${endDate.toDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Account Summary
        doc.fontSize(14).text('Account Summary', { underline: true });
        doc.moveDown(0.5);
        accounts.forEach(account => {
            doc.fontSize(10).text(`${account.name} (${account.type}): ${account.currency} ${account.balance.toNumber().toFixed(2)}`);
        });
        doc.moveDown();

        // Calculate totals
        const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);
        const expense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);

        doc.fontSize(14).text('Period Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10)
            .text(`Total Income: $${income.toFixed(2)}`)
            .text(`Total Expense: $${expense.toFixed(2)}`)
            .text(`Net: $${(income - expense).toFixed(2)}`);
        doc.moveDown();

        // Transaction List
        doc.fontSize(14).text('Transactions', { underline: true });
        doc.moveDown(0.5);

        transactions.slice(0, 100).forEach(tx => {
            const sign = tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '↔';
            const categoryName = tx.category?.name || 'Uncategorized';
            doc.fontSize(9).text(
                `${tx.transactionAt.toDateString()} | ${sign} ${tx.currency} ${tx.amount.toNumber().toFixed(2)} | ${tx.account.name} | ${categoryName}`,
                { continued: false }
            );
        });

        if (transactions.length > 100) {
            doc.moveDown();
            doc.fontSize(9).text(`... and ${transactions.length - 100} more transactions`);
        }

        doc.end();
    });
}

async function generateExcelReport(data: ReportJobData): Promise<Buffer> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const transactions = await prisma.personalTransaction.findMany({
        where: {
            userId: data.userId,
            deletedAt: null,
            transactionAt: { gte: startDate, lte: endDate },
            ...(data.accountId && { accountId: data.accountId }),
        },
        include: {
            account: { select: { name: true, type: true } },
            category: { select: { name: true } },
        },
        orderBy: { transactionAt: 'desc' },
    });

    const accounts = await prisma.personalAccount.findMany({
        where: { userId: data.userId, isArchived: false },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Personal Finance';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'Account', key: 'account', width: 20 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Currency', key: 'currency', width: 10 },
        { header: 'Balance', key: 'balance', width: 15 },
    ];

    accounts.forEach(account => {
        summarySheet.addRow({
            account: account.name,
            type: account.type,
            currency: account.currency,
            balance: account.balance.toNumber(),
        });
    });

    // Transactions sheet
    const txSheet = workbook.addWorksheet('Transactions');
    txSheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Currency', key: 'currency', width: 10 },
        { header: 'Account', key: 'account', width: 20 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Note', key: 'note', width: 30 },
        { header: 'Reference', key: 'reference', width: 15 },
    ];

    transactions.forEach(tx => {
        txSheet.addRow({
            date: tx.transactionAt.toISOString().split('T')[0],
            type: tx.type,
            amount: tx.amount.toNumber(),
            currency: tx.currency,
            account: tx.account.name,
            category: tx.category?.name || 'Uncategorized',
            note: tx.note || '',
            reference: tx.reference || '',
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export const personalFinanceReportWorker = new Worker<ReportJobData>(
    'personal-finance-reports',
    async (job: Job<ReportJobData>) => {
        const { data } = job;
        logger.info(`Processing personal finance report: ${data.reportId}`);

        try {
            // Update status to processing
            await prisma.personalFinanceReport.update({
                where: { id: data.reportId },
                data: { status: 'PROCESSING' },
            });

            // Generate report
            let buffer: Buffer;
            let contentType: string;
            let extension: 'pdf' | 'xlsx';

            if (data.format === 'PDF') {
                buffer = await generatePdfReport(data);
                contentType = 'application/pdf';
                extension = 'pdf';
            } else {
                buffer = await generateExcelReport(data);
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                extension = 'xlsx';
            }

            // Upload to S3
            const key = generateReportKey(data.userId, data.reportId, extension);
            await s3Service.uploadFile(key, buffer, contentType);

            // Generate signed URL (valid for 24 hours)
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const signedUrl = await s3Service.getSignedDownloadUrl(key, 86400);

            // Update report with file info
            await prisma.personalFinanceReport.update({
                where: { id: data.reportId },
                data: {
                    status: 'COMPLETED',
                    fileUrl: signedUrl,
                    fileKey: key,
                    expiresAt,
                    completedAt: new Date(),
                },
            });

            logger.info(`Personal finance report completed: ${data.reportId}`);
        } catch (error) {
            logger.error(`Personal finance report failed: ${data.reportId}`, error);

            await prisma.personalFinanceReport.update({
                where: { id: data.reportId },
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
        limiter: {
            max: 5,
            duration: 60000,
        },
    }
);

personalFinanceReportWorker.on('completed', (job) => {
    logger.info(`Report job ${job.id} completed`);
});

personalFinanceReportWorker.on('failed', (job, err) => {
    logger.error(`Report job ${job?.id} failed:`, err);
});

export async function closePersonalFinanceReportWorker() {
    await personalFinanceReportWorker.close();
    await connection.quit();
}
