import type { ExpenseStatus, ExpenseCategory, Prisma } from '@prisma/client';
import prisma from '../../libs/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

export class ExpenseRepository {
    async findById(id: string, organizationId: string) {
        return prisma.expense.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } },
                createdBy: { select: { id: true, email: true, name: true } },
                approvedBy: { select: { id: true, email: true, name: true } },
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
    }

    async findMany(
        organizationId: string,
        options: {
            status?: ExpenseStatus;
            category?: ExpenseCategory;
            projectId?: string;
            taskId?: string;
            createdById?: string;
            minAmount?: number;
            maxAmount?: number;
            skip?: number;
            take?: number;
        }
    ) {
        const where: Prisma.ExpenseWhereInput = {
            organizationId,
            deletedAt: null,
            ...(options.status && { status: options.status }),
            ...(options.category && { category: options.category }),
            ...(options.projectId && { projectId: options.projectId }),
            ...(options.taskId && { taskId: options.taskId }),
            ...(options.createdById && { createdById: options.createdById }),
            ...((options.minAmount || options.maxAmount) && {
                amount: {
                    ...(options.minAmount && { gte: new Decimal(options.minAmount) }),
                    ...(options.maxAmount && { lte: new Decimal(options.maxAmount) }),
                },
            }),
        };

        const [data, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                skip: options.skip,
                take: options.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    project: { select: { id: true, name: true } },
                    task: { select: { id: true, title: true } },
                    createdBy: { select: { id: true, name: true } },
                },
            }),
            prisma.expense.count({ where }),
        ]);

        return { data, total };
    }

    async create(data: {
        organizationId: string;
        title: string;
        description?: string;
        amount: number;
        currency: string;
        category: ExpenseCategory;
        projectId?: string;
        taskId?: string;
        receiptUrl?: string;
        receiptMetadata?: object;
        createdById: string;
    }) {
        return prisma.expense.create({
            data: {
                organizationId: data.organizationId,
                title: data.title,
                description: data.description,
                amount: new Decimal(data.amount),
                currency: data.currency,
                category: data.category,
                projectId: data.projectId,
                taskId: data.taskId,
                receiptUrl: data.receiptUrl,
                receiptMetadata: data.receiptMetadata as Prisma.InputJsonValue,
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
        amount?: number;
        currency?: string;
        category?: ExpenseCategory;
        projectId?: string | null;
        taskId?: string | null;
        receiptUrl?: string | null;
        receiptMetadata?: object | null;
    }) {
        const updateData: Prisma.ExpenseUpdateInput = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
        if (data.receiptMetadata !== undefined) {
            updateData.receiptMetadata = data.receiptMetadata as Prisma.InputJsonValue;
        }
        if (data.projectId !== undefined) {
            updateData.project = data.projectId ? { connect: { id: data.projectId } } : { disconnect: true };
        }
        if (data.taskId !== undefined) {
            updateData.task = data.taskId ? { connect: { id: data.taskId } } : { disconnect: true };
        }

        return prisma.expense.update({
            where: { id },
            data: updateData,
        });
    }

    async updateStatus(
        id: string,
        status: ExpenseStatus,
        approvedById?: string,
        rejectionReason?: string
    ) {
        return prisma.expense.update({
            where: { id },
            data: {
                status,
                approvedById,
                approvedAt: status === 'APPROVED' ? new Date() : undefined,
                rejectionReason,
            },
        });
    }

    async softDelete(id: string) {
        return prisma.expense.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async createAuditLog(data: {
        expenseId: string;
        action: string;
        previousData?: object;
        newData?: object;
        changedBy: string;
    }) {
        return prisma.expenseAuditLog.create({
            data: {
                expenseId: data.expenseId,
                action: data.action,
                previousData: data.previousData as Prisma.InputJsonValue,
                newData: data.newData as Prisma.InputJsonValue,
                changedBy: data.changedBy,
            },
        });
    }

    async getAuditLogs(expenseId: string) {
        return prisma.expenseAuditLog.findMany({
            where: { expenseId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAggregation(
        organizationId: string,
        options: {
            projectId?: string;
            taskId?: string;
            groupBy?: 'category' | 'status' | 'project' | 'task' | 'month';
        }
    ) {
        const where: Prisma.ExpenseWhereInput = {
            organizationId,
            deletedAt: null,
            ...(options.projectId && { projectId: options.projectId }),
            ...(options.taskId && { taskId: options.taskId }),
        };

        // Get totals
        const totals = await prisma.expense.aggregate({
            where,
            _sum: { amount: true },
            _count: true,
        });

        // Get approved totals
        const approved = await prisma.expense.aggregate({
            where: { ...where, status: 'APPROVED' },
            _sum: { amount: true },
            _count: true,
        });

        // Get pending totals
        const pending = await prisma.expense.aggregate({
            where: { ...where, status: 'PENDING' },
            _sum: { amount: true },
            _count: true,
        });

        // Group by category
        const byCategory = await prisma.expense.groupBy({
            by: ['category'],
            where,
            _sum: { amount: true },
            _count: true,
        });

        // Group by status
        const byStatus = await prisma.expense.groupBy({
            by: ['status'],
            where,
            _sum: { amount: true },
            _count: true,
        });

        return {
            totals: {
                count: totals._count,
                amount: totals._sum.amount?.toNumber() || 0,
            },
            approved: {
                count: approved._count,
                amount: approved._sum.amount?.toNumber() || 0,
            },
            pending: {
                count: pending._count,
                amount: pending._sum.amount?.toNumber() || 0,
            },
            byCategory: byCategory.map((c) => ({
                category: c.category,
                count: c._count,
                amount: c._sum.amount?.toNumber() || 0,
            })),
            byStatus: byStatus.map((s) => ({
                status: s.status,
                count: s._count,
                amount: s._sum.amount?.toNumber() || 0,
            })),
        };
    }
}

export const expenseRepository = new ExpenseRepository();
export default expenseRepository;
