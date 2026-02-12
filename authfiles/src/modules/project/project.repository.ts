import type { ProjectVisibility, ProjectStatus, ProjectRole } from '@prisma/client';
import prisma from '../../libs/prisma.js';

export class ProjectRepository {
    async findById(id: string, organizationId: string) {
        return prisma.project.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },
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
                _count: {
                    select: {
                        tasks: true,
                        expenses: true,
                    },
                },
            },
        });
    }

    async findMany(
        organizationId: string,
        userId: string,
        options: {
            status?: ProjectStatus;
            visibility?: ProjectVisibility;
            skip?: number;
            take?: number;
        }
    ) {
        const where = {
            organizationId,
            deletedAt: null,
            ...(options.status && { status: options.status }),
            OR: [
                { visibility: 'ORG_WIDE' as ProjectVisibility },
                {
                    visibility: 'PRIVATE' as ProjectVisibility,
                    members: {
                        some: { userId },
                    },
                },
            ],
        };

        const [data, total] = await Promise.all([
            prisma.project.findMany({
                where,
                skip: options.skip,
                take: options.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            tasks: true,
                            expenses: true,
                            members: true,
                        },
                    },
                },
            }),
            prisma.project.count({ where }),
        ]);

        return { data, total };
    }

    async create(data: {
        organizationId: string;
        name: string;
        description?: string;
        visibility: ProjectVisibility;
        createdById: string;
    }) {
        return prisma.project.create({
            data: {
                organizationId: data.organizationId,
                name: data.name,
                description: data.description,
                visibility: data.visibility,
                members: {
                    create: {
                        userId: data.createdById,
                        role: 'LEAD',
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, name: true },
                        },
                    },
                },
            },
        });
    }

    async update(id: string, data: {
        name?: string;
        description?: string | null;
        visibility?: ProjectVisibility;
        status?: ProjectStatus;
    }) {
        return prisma.project.update({
            where: { id },
            data,
        });
    }

    async archive(id: string) {
        return prisma.project.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
                archivedAt: new Date(),
            },
        });
    }

    async unarchive(id: string) {
        return prisma.project.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                archivedAt: null,
            },
        });
    }

    async softDelete(id: string) {
        return prisma.project.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async getMember(projectId: string, userId: string) {
        return prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
    }

    async getMembers(projectId: string) {
        return prisma.projectMember.findMany({
            where: { projectId },
            include: {
                user: {
                    select: { id: true, email: true, name: true },
                },
            },
        });
    }

    async addMember(projectId: string, userId: string, role: ProjectRole) {
        return prisma.projectMember.create({
            data: { projectId, userId, role },
            include: {
                user: {
                    select: { id: true, email: true, name: true },
                },
            },
        });
    }

    async removeMember(projectId: string, userId: string) {
        return prisma.projectMember.delete({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
    }

    async getStats(projectId: string) {
        const [taskStats, expenseStats] = await Promise.all([
            prisma.task.groupBy({
                by: ['status'],
                where: { projectId, deletedAt: null },
                _count: true,
            }),
            prisma.expense.aggregate({
                where: { projectId, deletedAt: null, status: 'APPROVED' },
                _sum: { amount: true },
                _count: true,
            }),
        ]);

        const taskCounts = taskStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
        }, {} as Record<string, number>);

        return {
            tasks: {
                total: Object.values(taskCounts).reduce((a, b) => a + b, 0),
                byStatus: taskCounts,
            },
            expenses: {
                count: expenseStats._count,
                totalApproved: expenseStats._sum.amount?.toNumber() || 0,
            },
        };
    }
}

export const projectRepository = new ProjectRepository();
export default projectRepository;
