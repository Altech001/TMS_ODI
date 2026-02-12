import type { ExpenseCategory, ExpenseStatus } from '@prisma/client';
import { expenseRepository } from './expense.repository.js';
import { notificationService } from '../notification/notification.service.js';
import { authRepository } from '../auth/auth.repository.js';
import { wsManager } from '../../libs/websocket.js';
import { emailQueue } from '../../queues/index.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { parsePagination, paginatedResponse } from '../../utils/helpers.js';
import type {
    CreateExpenseInput,
    UpdateExpenseInput,
    ApproveExpenseInput,
    RejectExpenseInput,
    ListExpensesQuery,
    AggregateExpensesQuery,
} from './expense.dto.js';

export class ExpenseService {
    async createExpense(
        organizationId: string,
        input: CreateExpenseInput,
        userId: string
    ) {
        const expense = await expenseRepository.create({
            organizationId,
            title: input.title,
            description: input.description,
            amount: input.amount,
            currency: input.currency,
            category: input.category as ExpenseCategory,
            projectId: input.projectId,
            taskId: input.taskId,
            receiptUrl: input.receiptUrl,
            receiptMetadata: input.receiptMetadata,
            createdById: userId,
        });

        await expenseRepository.createAuditLog({
            expenseId: expense.id,
            action: 'CREATED',
            newData: {
                title: expense.title,
                amount: expense.amount.toNumber(),
                category: expense.category,
            },
            changedBy: userId,
        });

        return expense;
    }

    async getExpense(organizationId: string, expenseId: string) {
        const expense = await expenseRepository.findById(expenseId, organizationId);
        if (!expense) {
            throw new NotFoundError('Expense not found');
        }
        return {
            ...expense,
            amount: expense.amount.toNumber(),
        };
    }

    async listExpenses(organizationId: string, query: ListExpensesQuery) {
        const { skip, take } = parsePagination(query.page, query.limit);
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '20', 10);

        const { data, total } = await expenseRepository.findMany(organizationId, {
            status: query.status as ExpenseStatus,
            category: query.category as ExpenseCategory,
            projectId: query.projectId,
            taskId: query.taskId,
            createdById: query.createdById,
            minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
            maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
            skip,
            take,
        });

        // Convert Decimal to number
        const normalizedData = data.map((e) => ({
            ...e,
            amount: e.amount.toNumber(),
        }));

        return paginatedResponse(normalizedData, total, page, limit);
    }

    async updateExpense(
        organizationId: string,
        expenseId: string,
        input: UpdateExpenseInput,
        userId: string
    ) {
        const expense = await expenseRepository.findById(expenseId, organizationId);
        if (!expense) {
            throw new NotFoundError('Expense not found');
        }

        // Only creator or managers can update pending expenses
        if (expense.createdById !== userId && expense.status !== 'PENDING') {
            throw new ForbiddenError('Cannot update this expense');
        }

        if (expense.status !== 'PENDING') {
            throw new BadRequestError('Can only update pending expenses');
        }

        const previousData = {
            title: expense.title,
            amount: expense.amount.toNumber(),
            category: expense.category,
        };

        const updated = await expenseRepository.update(expenseId, {
            title: input.title,
            description: input.description,
            amount: input.amount,
            currency: input.currency,
            category: input.category as ExpenseCategory,
            projectId: input.projectId,
            taskId: input.taskId,
            receiptUrl: input.receiptUrl,
            receiptMetadata: input.receiptMetadata,
        });

        await expenseRepository.createAuditLog({
            expenseId,
            action: 'UPDATED',
            previousData,
            newData: input,
            changedBy: userId,
        });

        return updated;
    }

    async approveExpense(
        organizationId: string,
        expenseId: string,
        input: ApproveExpenseInput,
        approverId: string
    ) {
        const expense = await expenseRepository.findById(expenseId, organizationId);
        if (!expense) {
            throw new NotFoundError('Expense not found');
        }

        if (expense.status !== 'PENDING') {
            throw new BadRequestError('Expense is not pending');
        }

        // Cannot approve own expense
        if (expense.createdById === approverId) {
            throw new ForbiddenError('Cannot approve your own expense');
        }

        const updated = await expenseRepository.updateStatus(
            expenseId,
            'APPROVED',
            approverId
        );

        await expenseRepository.createAuditLog({
            expenseId,
            action: 'APPROVED',
            previousData: { status: 'PENDING' },
            newData: { status: 'APPROVED', comment: input.comment },
            changedBy: approverId,
        });

        // Notify creator
        await notificationService.create({
            userId: expense.createdById,
            organizationId,
            type: 'EXPENSE_APPROVED',
            title: 'Expense Approved',
            message: `Your expense "${expense.title}" has been approved`,
            data: { expenseId },
        });

        // Get creator email for email notification
        const creator = await authRepository.findUserById(expense.createdById);
        if (creator) {
            await emailQueue.add('expense-approval', {
                email: creator.email,
                expenseTitle: expense.title,
                status: 'approved',
            });
        }

        // WebSocket broadcast
        await wsManager.publishToOrganization(organizationId, 'expense:approved', {
            expenseId,
            title: expense.title,
        });

        return updated;
    }

    async rejectExpense(
        organizationId: string,
        expenseId: string,
        input: RejectExpenseInput,
        rejecterId: string
    ) {
        const expense = await expenseRepository.findById(expenseId, organizationId);
        if (!expense) {
            throw new NotFoundError('Expense not found');
        }

        if (expense.status !== 'PENDING') {
            throw new BadRequestError('Expense is not pending');
        }

        const updated = await expenseRepository.updateStatus(
            expenseId,
            'REJECTED',
            rejecterId,
            input.reason
        );

        await expenseRepository.createAuditLog({
            expenseId,
            action: 'REJECTED',
            previousData: { status: 'PENDING' },
            newData: { status: 'REJECTED', reason: input.reason },
            changedBy: rejecterId,
        });

        // Notify creator
        await notificationService.create({
            userId: expense.createdById,
            organizationId,
            type: 'EXPENSE_REJECTED',
            title: 'Expense Rejected',
            message: `Your expense "${expense.title}" has been rejected: ${input.reason}`,
            data: { expenseId, reason: input.reason },
        });

        // Get creator email
        const creator = await authRepository.findUserById(expense.createdById);
        if (creator) {
            await emailQueue.add('expense-approval', {
                email: creator.email,
                expenseTitle: expense.title,
                status: 'rejected',
                reason: input.reason,
            });
        }

        await wsManager.publishToOrganization(organizationId, 'expense:rejected', {
            expenseId,
            title: expense.title,
        });

        return updated;
    }

    async deleteExpense(
        organizationId: string,
        expenseId: string,
        userId: string
    ) {
        const expense = await expenseRepository.findById(expenseId, organizationId);
        if (!expense) {
            throw new NotFoundError('Expense not found');
        }

        // Only creator can delete pending expenses
        if (expense.createdById !== userId) {
            throw new ForbiddenError('Only the creator can delete this expense');
        }

        if (expense.status !== 'PENDING') {
            throw new BadRequestError('Can only delete pending expenses');
        }

        await expenseRepository.softDelete(expenseId);

        await expenseRepository.createAuditLog({
            expenseId,
            action: 'DELETED',
            previousData: { title: expense.title },
            changedBy: userId,
        });

        return { success: true };
    }

    async getAuditLogs(organizationId: string, expenseId: string) {
        const expense = await expenseRepository.findById(expenseId, organizationId);
        if (!expense) {
            throw new NotFoundError('Expense not found');
        }
        return expenseRepository.getAuditLogs(expenseId);
    }

    async getAggregation(organizationId: string, query: AggregateExpensesQuery) {
        return expenseRepository.getAggregation(organizationId, {
            projectId: query.projectId,
            taskId: query.taskId,
            groupBy: query.groupBy,
        });
    }
}

export const expenseService = new ExpenseService();
export default expenseService;
