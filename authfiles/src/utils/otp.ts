import crypto from 'crypto';
import config from '../config/index.js';

export function generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        otp += digits[randomBytes[i] % 10];
    }

    return otp;
}

export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

export function getOtpExpiry(): Date {
    return new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);
}

export function getInviteExpiry(days: number = 7): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function isExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
}

export default {
    generateOtp,
    generateSecureToken,
    getOtpExpiry,
    getInviteExpiry,
    isExpired,
};
