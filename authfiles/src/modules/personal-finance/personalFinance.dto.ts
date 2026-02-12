import { z } from 'zod';

// ============================================================================
// ACCOUNTS
// ============================================================================

export const createAccountSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['CASH', 'BANK', 'MOBILE_MONEY', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'OTHER']),
    currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
    initialBalance: z.number().default(0),
});

export const updateAccountSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    currency: z.string().length(3).optional(),
});

export const accountIdParamSchema = z.object({
    accountId: z.string().uuid('Invalid account ID'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ============================================================================
// CATEGORIES
// ============================================================================

export const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(50),
    type: z.enum(['INCOME', 'EXPENSE']),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).max(50).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const categoryIdParamSchema = z.object({
    categoryId: z.string().uuid('Invalid category ID'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ============================================================================
// TRANSACTIONS
// ============================================================================

export const createTransactionSchema = z.object({
    accountId: z.string().uuid('Invalid account ID'),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    type: z.enum(['INCOME', 'EXPENSE']),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3).optional(),
    note: z.string().max(500).optional(),
    reference: z.string().max(100).optional(),
    transactionAt: z.coerce.date().optional(),
});

export const updateTransactionSchema = z.object({
    categoryId: z.string().uuid().optional().nullable(),
    amount: z.number().positive().optional(),
    note: z.string().max(500).optional().nullable(),
    reference: z.string().max(100).optional().nullable(),
    transactionAt: z.coerce.date().optional(),
});

export const transactionIdParamSchema = z.object({
    transactionId: z.string().uuid('Invalid transaction ID'),
});

export const listTransactionsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    accountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    // Logic: Accepts "true" or "false" strings, converts to boolean. 
    // If missing (undefined), it stays undefined (optional).
    isReconciled: z.enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

// ============================================================================
// TRANSFERS
// ============================================================================

export const createTransferSchema = z.object({
    fromAccountId: z.string().uuid('Invalid source account ID'),
    toAccountId: z.string().uuid('Invalid destination account ID'),
    amount: z.number().positive('Amount must be positive'), // Source Amount

    // Multi-currency handling
    // User can provide EITHER the exchange rate OR the amount to be received
    toAmount: z.number().positive().optional(),
    exchangeRate: z.number().positive().optional(),

    note: z.string().max(500).optional(),
    reference: z.string().max(100).optional(),
    transactionAt: z.coerce.date().optional(),
}).refine((_data) => {
    // If toAmount and exchangeRate are both provided, they must mathematically match (roughly)
    // Generally, providing one is sufficient.
    return true;
}, { message: "Provide either destination amount or exchange rate for cross-currency transfers" });

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

export const dashboardQuerySchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

export const cashflowQuerySchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    accountId: z.string().uuid().optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('month'),
});

export const categoryBreakdownQuerySchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    accountId: z.string().uuid().optional(),
});

export const createReportSchema = z.object({
    type: z.enum(['MONTHLY_SUMMARY', 'FULL_STATEMENT', 'CATEGORY_BREAKDOWN', 'CASHFLOW']),
    format: z.enum(['PDF', 'EXCEL']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    accountId: z.string().uuid().optional(),
});

export const reportIdParamSchema = z.object({
    reportId: z.string().uuid('Invalid report ID'),
});

export const listReportsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type CashflowQuery = z.infer<typeof cashflowQuerySchema>;
export type CategoryBreakdownQuery = z.infer<typeof categoryBreakdownQuerySchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
