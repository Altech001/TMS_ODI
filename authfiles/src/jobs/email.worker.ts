import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import { emailService } from '../libs/email.js';
import logger from '../libs/logger.js';

const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

interface OTPEmailJob {
    email: string;
    otp: string;
    type?: 'verification' | 'reset';
}

interface InviteEmailJob {
    email: string;
    organizationName: string;
    inviterName: string;
    inviteToken: string;
}

interface ExpenseApprovalEmailJob {
    email: string;
    expenseTitle: string;
    status: 'approved' | 'rejected';
    reason?: string;
}

type EmailJobData = OTPEmailJob | InviteEmailJob | ExpenseApprovalEmailJob;

export const emailWorker = new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
        const { name, data } = job;

        try {
            switch (name) {
                case 'send-otp':
                    const otpData = data as OTPEmailJob;
                    await emailService.sendOtpEmail(otpData.email, otpData.otp, otpData.type || 'verification');
                    logger.info(`OTP email sent to ${otpData.email}`);
                    break;

                case 'send-invite':
                    const inviteData = data as InviteEmailJob;
                    await emailService.sendInviteEmail(
                        inviteData.email,
                        inviteData.organizationName,
                        inviteData.inviterName,
                        inviteData.inviteToken
                    );
                    logger.info(`Invite email sent to ${inviteData.email}`);
                    break;

                case 'expense-approval':
                    const expenseData = data as ExpenseApprovalEmailJob;
                    await emailService.sendExpenseApprovalEmail(
                        expenseData.email,
                        expenseData.expenseTitle,
                        expenseData.status,
                        expenseData.reason
                    );
                    logger.info(`Expense ${expenseData.status} email sent to ${expenseData.email}`);
                    break;

                default:
                    logger.warn(`Unknown email job type: ${name}`);
            }
        } catch (error) {
            logger.error(`Email job failed: ${name}`, error);
            throw error; // Rethrow to trigger retry
        }
    },
    {
        connection,
        concurrency: 5,
        limiter: {
            max: 10,
            duration: 1000,
        },
    }
);

emailWorker.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed:`, err);
});

export async function closeEmailWorker() {
    await emailWorker.close();
    await connection.quit();
}
