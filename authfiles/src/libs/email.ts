import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import config from '../config/index.js';
import logger from './logger.js';

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

class EmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: 587,
            secure: false,
            auth: {
                user: config.smtp.user,
                pass: config.smtp.pass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        });
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            const info = await this.transporter.sendMail({
                from: `"Project Task Management" <${config.smtp.user}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });

            logger.info('Email sent', { messageId: info.messageId, to: options.to });
            return true;
        } catch (error) {
            logger.error('Failed to send email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to: options.to
            });
            return false;
        }
    }

    async sendOtpEmail(email: string, otp: string, type: 'verification' | 'reset'): Promise<boolean> {
        const subject = type === 'verification'
            ? 'Verify your email address'
            : 'Reset your password';

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${subject}</h2>
            <p>Your verification code is:</p>
            <div class="code">${otp}</div>
            <p>This code will expire in ${config.otp.expiryMinutes} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to: email,
            subject,
            text: `Your verification code is: ${otp}. This code will expire in ${config.otp.expiryMinutes} minutes.`,
            html,
        });
    }

    async sendInviteEmail(
        email: string,
        organizationName: string,
        inviterName: string,
        inviteToken: string
    ): Promise<boolean> {
        const inviteUrl = `${config.appUrl}/invite/${inviteToken}`;

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You've been invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Project Task Management.</p>
            <p><a href="${inviteUrl}" class="button">Accept Invitation</a></p>
            <p>Or copy this link: ${inviteUrl}</p>
            <p>This invitation will expire in 7 days.</p>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to: email,
            subject: `${inviterName} invited you to join ${organizationName}`,
            text: `${inviterName} has invited you to join ${organizationName}. Accept the invitation: ${inviteUrl}`,
            html,
        });
    }

    async sendExpenseApprovalEmail(
        email: string,
        expenseTitle: string,
        status: 'approved' | 'rejected',
        reason?: string
    ): Promise<boolean> {
        const statusText = status === 'approved' ? 'Approved' : 'Rejected';
        const statusColor = status === 'approved' ? '#28a745' : '#dc3545';

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Expense ${statusText}</h2>
            <p>Your expense "<strong>${expenseTitle}</strong>" has been <span class="status">${statusText}</span>.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to: email,
            subject: `Expense ${statusText}: ${expenseTitle}`,
            text: `Your expense "${expenseTitle}" has been ${statusText}.${reason ? ` Reason: ${reason}` : ''}`,
            html,
        });
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            logger.info('Email service connected');
            return true;
        } catch (error) {
            logger.error('Email service connection failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
}

export const emailService = new EmailService();
export default emailService;
