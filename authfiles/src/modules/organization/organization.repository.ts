import type { MemberRole, InviteStatus } from '@prisma/client';
import prisma from '../../libs/prisma.js';
import { generateSlug } from '../../utils/helpers.js';

export class OrganizationRepository {
    async findById(id: string) {
        return prisma.organization.findUnique({
            where: { id },
        });
    }

    async findByIdWithMembers(id: string) {
        return prisma.organization.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                owner: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findBySlug(slug: string) {
        return prisma.organization.findUnique({
            where: { slug },
        });
    }

    async create(data: { name: string; ownerId: string }) {
        const slug = generateSlug(data.name);

        return prisma.organization.create({
            data: {
                name: data.name,
                slug,
                ownerId: data.ownerId,
                members: {
                    create: {
                        userId: data.ownerId,
                        role: 'OWNER',
                    },
                },
            },
            include: {
                members: true,
            },
        });
    }

    async update(id: string, data: { name?: string }) {
        const updateData: { name?: string; slug?: string } = {};

        if (data.name) {
            updateData.name = data.name;
            updateData.slug = generateSlug(data.name);
        }

        return prisma.organization.update({
            where: { id },
            data: updateData,
        });
    }

    async softDelete(id: string) {
        return prisma.organization.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async getUserOrganizations(userId: string) {
        return prisma.organizationMember.findMany({
            where: {
                userId,
                organization: {
                    deletedAt: null,
                },
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        ownerId: true,
                        createdAt: true,
                    },
                },
            },
        });
    }

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
            orderBy: { joinedAt: 'asc' },
        });
    }

    async addMember(organizationId: string, userId: string, role: MemberRole) {
        return prisma.organizationMember.create({
            data: {
                organizationId,
                userId,
                role,
            },
        });
    }

    async updateMemberRole(organizationId: string, userId: string, role: MemberRole) {
        return prisma.organizationMember.update({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            data: { role },
        });
    }

    async removeMember(organizationId: string, userId: string) {
        return prisma.organizationMember.delete({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });
    }

    async countOwners(organizationId: string) {
        return prisma.organizationMember.count({
            where: {
                organizationId,
                role: 'OWNER',
            },
        });
    }

    async createInvite(data: {
        email: string;
        organizationId: string;
        invitedById: string;
        role: MemberRole;
        token: string;
        expiresAt: Date;
    }) {
        return prisma.organizationInvite.create({
            data,
        });
    }

    async findInviteByToken(token: string) {
        return prisma.organizationInvite.findUnique({
            where: { token },
            include: {
                organization: true,
                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findPendingInvite(email: string, organizationId: string) {
        return prisma.organizationInvite.findFirst({
            where: {
                email: email.toLowerCase(),
                organizationId,
                status: 'PENDING',
                expiresAt: { gt: new Date() },
            },
        });
    }

    async updateInviteStatus(id: string, status: InviteStatus) {
        return prisma.organizationInvite.update({
            where: { id },
            data: {
                status,
                respondedAt: new Date(),
            },
        });
    }

    async getUserPendingInvites(email: string) {
        return prisma.organizationInvite.findMany({
            where: {
                email: email.toLowerCase(),
                status: 'PENDING',
                expiresAt: { gt: new Date() },
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async getOrganizationInvites(organizationId: string) {
        return prisma.organizationInvite.findMany({
            where: {
                organizationId,
                status: 'PENDING',
                expiresAt: { gt: new Date() },
            },
            include: {
                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async transferOwnership(organizationId: string, currentOwnerId: string, newOwnerId: string) {
        return prisma.$transaction([
            prisma.organization.update({
                where: { id: organizationId },
                data: { ownerId: newOwnerId },
            }),
            prisma.organizationMember.update({
                where: {
                    userId_organizationId: {
                        userId: currentOwnerId,
                        organizationId,
                    },
                },
                data: { role: 'ADMIN' },
            }),
            prisma.organizationMember.update({
                where: {
                    userId_organizationId: {
                        userId: newOwnerId,
                        organizationId,
                    },
                },
                data: { role: 'OWNER' },
            }),
        ]);
    }
}

export const organizationRepository = new OrganizationRepository();
export default organizationRepository;
