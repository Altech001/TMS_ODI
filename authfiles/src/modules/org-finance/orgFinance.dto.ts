import { z } from 'zod';

// ============================================================================
// CASHBOOKS (NEW CONTAINER LAYER)
// ============================================================================

export const createCashbookSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    currency: z.string().length(3).default('USD'),
    // Settings
    allowBackdated: z.boolean().default(false),
    allowOmitted: z.boolean().default(false),
    lockDate: z.coerce.date().optional(),
});

export const updateCashbookSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    allowBackdated: z.boolean().optional(),
    allowOmitted: z.boolean().optional(),
    lockDate: z.coerce.date().optional().nullable(),
});

export const cashbookIdParamSchema = z.object({
    cashbookId: z.string().uuid('Invalid cashbook ID'),
});

export const addCashbookMemberSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['VIEWER', 'EDITOR', 'APPROVER']),
});

export type CreateCashbookInput = z.infer<typeof createCashbookSchema>;
export type UpdateCashbookInput = z.infer<typeof updateCashbookSchema>;
export type AddCashbookMemberInput = z.infer<typeof addCashbookMemberSchema>;

// ============================================================================
// CONTACTS (SUPPLIERS / CUSTOMERS)
// ============================================================================

export const createContactSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'OTHER']).default('OTHER'),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().email().optional().nullable(),
    taxId: z.string().max(50).optional().nullable(), // TIN or VAT number
});

export const updateContactSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'OTHER']).optional(),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().email().optional().nullable(),
    taxId: z.string().max(50).optional().nullable(),
});

export const contactIdParamSchema = z.object({
    contactId: z.string().uuid('Invalid contact ID'),
});

export const listContactsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'OTHER']).optional(),
    search: z.string().optional(), // For searching by name
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;

// ============================================================================
// ACCOUNTS
// ============================================================================

export const createAccountSchema = z.object({
    cashbookId: z.string().uuid('Invalid cashbook ID'), // Now required
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['CASH', 'BANK', 'MOBILE_MONEY', 'PETTY_CASH', 'SAVINGS', 'OTHER']),
    currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
    description: z.string().max(500).optional(),
});

export const updateAccountSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    currency: z.string().length(3).optional(),
});

export const accountIdParamSchema = z.object({
    accountId: z.string().uuid('Invalid account ID'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ============================================================================
// LEDGER ENTRIES
// ============================================================================

const attachmentSchema = z.object({
    fileKey: z.string().min(1),
    fileName: z.string().min(1),
    fileType: z.string(),
    fileSize: z.number().int().positive(),
});

export const createEntrySchema = z.object({
    accountId: z.string().uuid('Invalid account ID'),
    type: z.enum(['INFLOW', 'OUTFLOW', 'ADJUSTMENT']),
    entryCategory: z.enum(['NORMAL', 'BACKDATED', 'OMITTED', 'PRIOR_ADJUSTMENT']).default('NORMAL'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3).default('USD'),
    description: z.string().min(1, 'Description is required').max(1000),
    reference: z.string().max(200).optional(),
    reason: z.string().max(500).optional(), // Required for non-NORMAL entries
    transactionDate: z.coerce.date(),
    idempotencyKey: z.string().uuid().optional(),
    
    // New Fields
    contactId: z.string().uuid().optional().nullable(),
    attachments: z.array(attachmentSchema).max(4, 'Maximum 4 attachments allowed').optional(),
}).refine((data) => {
    // reason is required for non-NORMAL entries
    if (data.entryCategory !== 'NORMAL' && !data.reason) {
        return false;
    }
    return true;
}, { message: 'Reason is required for backdated, omitted, or prior adjustment entries', path: ['reason'] });

export const updateEntrySchema = z.object({
    description: z.string().min(1).max(1000).optional(),
    reference: z.string().max(200).optional().nullable(),
    amount: z.number().positive().optional(),
    transactionDate: z.coerce.date().optional(),
    editReason: z.string().min(1, 'Edit reason is required').max(500),
    // Attachments update logic is usually "add/remove" specific endpoints, 
    // or we can allow replacing the list here. For simplicity, we keep separate.
});

export const entryIdParamSchema = z.object({
    entryId: z.string().uuid('Invalid entry ID'),
});

export const listEntriesQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cashbookId: z.string().uuid().optional(), // Filter by Cashbook
    accountId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(), // Filter by Contact
    type: z.enum(['INFLOW', 'OUTFLOW', 'ADJUSTMENT', 'REVERSAL']).optional(),
    entryCategory: z.enum(['NORMAL', 'BACKDATED', 'OMITTED', 'PRIOR_ADJUSTMENT']).optional(),
    status: z.enum(['ACTIVE', 'REVERSED', 'DELETED', 'PENDING_DELETE_APPROVAL']).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    createdById: z.string().uuid().optional(),
    isReconciled: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;

// ============================================================================
// TRANSFERS
// ============================================================================

export const createTransferSchema = z.object({
    fromAccountId: z.string().uuid('Invalid source account ID'),
    toAccountId: z.string().uuid('Invalid destination account ID'),
    amount: z.number().positive('Amount must be positive'),
    transactionDate: z.coerce.date(),
    description: z.string().min(1, 'Description is required').max(1000),
    reference: z.string().max(200).optional(),
    toAmount: z.number().positive().optional(),
    exchangeRate: z.number().positive().optional(),
}).refine(data => {
    return data.fromAccountId !== data.toAccountId;
}, { message: "Cannot transfer to the same account", path: ["toAccountId"] });

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

// ============================================================================
// REVERSAL
// ============================================================================

export const createReversalSchema = z.object({
    reason: z.string().min(1, 'Reversal reason is required').max(500),
    reference: z.string().max(200).optional(),
});

export type CreateReversalInput = z.infer<typeof createReversalSchema>;

// ============================================================================
// DELETE REQUESTS
// ============================================================================

export const requestDeleteSchema = z.object({
    reason: z.string().min(1, 'Deletion reason is required').max(500),
});

export const deleteRequestIdParamSchema = z.object({
    requestId: z.string().uuid('Invalid request ID'),
});

export const approveDeleteSchema = z.object({});

export const rejectDeleteSchema = z.object({
    rejectionReason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const listDeleteRequestsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    cashbookId: z.string().uuid().optional(), // Filter by cashbook
});

export type RequestDeleteInput = z.infer<typeof requestDeleteSchema>;
export type RejectDeleteInput = z.infer<typeof rejectDeleteSchema>;
export type ListDeleteRequestsQuery = z.infer<typeof listDeleteRequestsQuerySchema>;

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

export const dashboardQuerySchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    cashbookId: z.string().uuid().optional(), // Scope dashboard to a cashbook
    accountId: z.string().uuid().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

// ============================================================================
// REPORTS
// ============================================================================

export const createReportSchema = z.object({
    type: z.enum(['CASHBOOK', 'INFLOW_VS_OUTFLOW', 'ACCOUNT_BALANCES', 'MONTHLY_SUMMARY', 'CUSTOM_DATE_RANGE']),
    format: z.enum(['PDF', 'EXCEL']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    cashbookId: z.string().uuid().optional(), // Generate report for specific cashbook
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

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const listAuditLogsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    entityType: z.string().optional(),
    action: z.string().optional(),
    entryId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    cashbookId: z.string().uuid().optional(), // Filter logs by cashbook
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;