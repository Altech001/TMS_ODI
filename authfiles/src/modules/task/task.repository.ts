import type { TaskStatus, TaskPriority, Prisma } from '@prisma/client';
import prisma from '../../libs/prisma.js';

export class TaskRepository {
    async findById(id: string, organizationId: string) {
        return prisma.task.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },
            include: {
                project: { select: { id: true, name: true } },
                parentTask: { select: { id: true, title: true } },
                subtasks: {
                    where: { deletedAt: null },
                    select: { id: true, title: true, status: true },
                },
                assignees: {
                    include: {
                        user: { select: { id: true, email: true, name: true } },
                    },
                },
                createdBy: { select: { id: true, email: true, name: true } },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
    }

    async findMany(
        organizationId: string,
        options: {
            projectId?: string;
            status?: TaskStatus;
            priority?: TaskPriority;
            assigneeId?: string;
            parentTaskId?: string | null;
            skip?: number;
            take?: number;
        }
    ) {
        const where: Prisma.TaskWhereInput = {
            organizationId,
            deletedAt: null,
            ...(options.projectId && { projectId: options.projectId }),
            ...(options.status && { status: options.status }),
            ...(options.priority && { priority: options.priority }),
            ...(options.assigneeId && {
                assignees: { some: { userId: options.assigneeId } },
            }),
            ...(options.parentTaskId !== undefined && {
                parentTaskId: options.parentTaskId
            }),
        };

        const [data, total] = await Promise.all([
            prisma.task.findMany({
                where,
                skip: options.skip,
                take: options.take,
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' },
                    { createdAt: 'desc' },
                ],
                include: {
                    project: { select: { id: true, name: true } },
                    assignees: {
                        include: {
                            user: { select: { id: true, name: true } },
                        },
                    },
                    _count: { select: { subtasks: true } },
                },
            }),
            prisma.task.count({ where }),
        ]);

        return { data, total };
    }

    async create(data: {
        organizationId: string;
        projectId?: string;
        parentTaskId?: string;
        title: string;
        description?: string;
        status: TaskStatus;
        priority: TaskPriority;
        dueDate?: Date;
        createdById: string;
    }) {
        return prisma.task.create({
            data: {
                organizationId: data.organizationId,
                projectId: data.projectId,
                parentTaskId: data.parentTaskId,
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                dueDate: data.dueDate,
                createdById: data.createdById,
            },
            include: {
                createdBy: { select: { id: true, name: true } },
            },
        });
    }

    async update(id: string, data: {
        title?: string;
        description?: string | null;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: Date | null;
        completedAt?: Date | null;
    }) {
        return prisma.task.update({
            where: { id },
            data,
        });
    }

    async softDelete(id: string) {
        return prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async addAssignee(taskId: string, userId: string) {
        return prisma.taskAssignee.create({
            data: { taskId, userId },
            include: {
                user: { select: { id: true, email: true, name: true } },
            },
        });
    }

    async removeAssignee(taskId: string, userId: string) {
        return prisma.taskAssignee.delete({
            where: {
                taskId_userId: { taskId, userId },
            },
        });
    }

    async getAssignees(taskId: string) {
        return prisma.taskAssignee.findMany({
            where: { taskId },
            include: {
                user: { select: { id: true, email: true, name: true } },
            },
        });
    }

    async isAssigned(taskId: string, userId: string) {
        const assignee = await prisma.taskAssignee.findUnique({
            where: {
                taskId_userId: { taskId, userId },
            },
        });
        return !!assignee;
    }

    async logActivity(taskId: string, action: string, details?: object) {
        return prisma.taskActivityLog.create({
            data: {
                taskId,
                action,
                details: details as Prisma.InputJsonValue,
            },
        });
    }

    async getActivityLogs(taskId: string, take: number = 50) {
        return prisma.taskActivityLog.findMany({
            where: { taskId },
            orderBy: { createdAt: 'desc' },
            take,
        });
    }
}

export const taskRepository = new TaskRepository();
export default taskRepository;
