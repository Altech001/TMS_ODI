import { z } from 'zod';

export const createExpenseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3).default('USD'),
    category: z.enum(['TRAVEL', 'MEALS', 'SUPPLIES', 'EQUIPMENT', 'SOFTWARE', 'SERVICES', 'MARKETING', 'OTHER']),
    projectId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    receiptUrl: z.string().url().optional(),
    receiptMetadata: z.object({
        filename: z.string(),
        mimeType: z.string(),
        size: z.number(),
    }).optional(),
});

export const updateExpenseSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    amount: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    category: z.enum(['TRAVEL', 'MEALS', 'SUPPLIES', 'EQUIPMENT', 'SOFTWARE', 'SERVICES', 'MARKETING', 'OTHER']).optional(),
    projectId: z.string().uuid().optional().nullable(),
    taskId: z.string().uuid().optional().nullable(),
    receiptUrl: z.string().url().optional().nullable(),
    receiptMetadata: z.object({
        filename: z.string(),
        mimeType: z.string(),
        size: z.number(),
    }).optional().nullable(),
});

export const expenseIdParamSchema = z.object({
    expenseId: z.string().uuid('Invalid expense ID'),
});

export const approveExpenseSchema = z.object({
    comment: z.string().max(500).optional(),
});

export const rejectExpenseSchema = z.object({
    reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const listExpensesQuerySchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    category: z.enum(['TRAVEL', 'MEALS', 'SUPPLIES', 'EQUIPMENT', 'SOFTWARE', 'SERVICES', 'MARKETING', 'OTHER']).optional(),
    projectId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    createdById: z.string().uuid().optional(),
    minAmount: z.string().optional(),
    maxAmount: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
});

export const aggregateExpensesQuerySchema = z.object({
    projectId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    groupBy: z.enum(['category', 'status', 'project', 'task', 'month']).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ApproveExpenseInput = z.infer<typeof approveExpenseSchema>;
export type RejectExpenseInput = z.infer<typeof rejectExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type AggregateExpensesQuery = z.infer<typeof aggregateExpensesQuerySchema>;
