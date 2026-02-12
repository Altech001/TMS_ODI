import type { OtpType } from '@prisma/client';
import prisma from '../../libs/prisma.js';

export class AuthRepository {
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }

    async findUserById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async createUser(data: {
        email: string;
        passwordHash: string;
        name: string;
    }) {
        return prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                passwordHash: data.passwordHash,
                name: data.name,
            },
        });
    }

    async updateUser(id: string, data: { passwordHash?: string; isEmailVerified?: boolean }) {
        return prisma.user.update({
            where: { id },
            data,
        });
    }

    async createOtp(data: {
        email: string;
        code: string;
        type: OtpType;
        expiresAt: Date;
    }) {
        // Invalidate any existing OTPs for this email and type
        await prisma.otpCode.updateMany({
            where: {
                email: data.email.toLowerCase(),
                type: data.type,
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
            },
        });

        return prisma.otpCode.create({
            data: {
                email: data.email.toLowerCase(),
                code: data.code,
                type: data.type,
                expiresAt: data.expiresAt,
            },
        });
    }

    async findValidOtp(email: string, code: string, type: OtpType) {
        return prisma.otpCode.findFirst({
            where: {
                email: email.toLowerCase(),
                code,
                type,
                expiresAt: { gt: new Date() },
                usedAt: null,
            },
        });
    }

    async markOtpAsUsed(id: string) {
        return prisma.otpCode.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    }

    async createRefreshToken(data: {
        userId: string;
        token: string;
        expiresAt: Date;
    }) {
        return prisma.refreshToken.create({
            data,
        });
    }

    async findRefreshToken(token: string) {
        return prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }

    async revokeRefreshToken(token: string) {
        return prisma.refreshToken.update({
            where: { token },
            data: { revokedAt: new Date() },
        });
    }

    async revokeAllUserRefreshTokens(userId: string) {
        return prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    async cleanupExpiredTokens() {
        return prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revokedAt: { not: null } },
                ],
            },
        });
    }
}

export const authRepository = new AuthRepository();
export default authRepository;
