import type { PresenceStatus as PrismaPresenceStatus } from '@prisma/client';
import prisma from '../../libs/prisma.js';

export class PresenceRepository {
    async createHistory(data: {
        userId: string;
        organizationId: string;
        status: PrismaPresenceStatus;
    }) {
        // End previous status
        await prisma.userPresenceHistory.updateMany({
            where: {
                userId: data.userId,
                organizationId: data.organizationId,
                endedAt: null,
            },
            data: { endedAt: new Date() },
        });

        // Create new status entry
        return prisma.userPresenceHistory.create({
            data: {
                userId: data.userId,
                organizationId: data.organizationId,
                status: data.status,
            },
        });
    }

    async getCurrentStatus(userId: string, organizationId: string) {
        return prisma.userPresenceHistory.findFirst({
            where: {
                userId,
                organizationId,
                endedAt: null,
            },
            orderBy: { startedAt: 'desc' },
        });
    }

    async getHistory(
        userId: string,
        organizationId: string,
        options: { skip?: number; take?: number } = {}
    ) {
        return prisma.userPresenceHistory.findMany({
            where: { userId, organizationId },
            orderBy: { startedAt: 'desc' },
            skip: options.skip,
            take: options.take || 50,
        });
    }
}

export const presenceRepository = new PresenceRepository();
export default presenceRepository;
