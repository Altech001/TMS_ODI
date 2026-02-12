import type { MemberRole } from '@prisma/client';
import prisma from '../../libs/prisma.js';

export class MembershipRepository {
    async getMember(organizationId: string, userId: string) {
        return prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }

    async getMemberById(memberId: string) {
        return prisma.organizationMember.findUnique({
            where: { id: memberId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }

    async getMembers(organizationId: string) {
        return prisma.organizationMember.findMany({
            where: { organizationId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { role: 'asc' },
                { joinedAt: 'asc' },
            ],
        });
    }

    async updateRole(memberId: string, role: MemberRole) {
        return prisma.organizationMember.update({
            where: { id: memberId },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }

    async removeMember(memberId: string) {
        return prisma.organizationMember.delete({
            where: { id: memberId },
        });
    }

    async countByRole(organizationId: string, role: MemberRole) {
        return prisma.organizationMember.count({
            where: {
                organizationId,
                role,
            },
        });
    }
}

export const membershipRepository = new MembershipRepository();
export default membershipRepository;
