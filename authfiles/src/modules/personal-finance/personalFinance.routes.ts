import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { validateBody, validateQuery, validateParams } from '../../middlewares/validate.js';
import { personalFinanceController } from './personalFinance.controller.js';
import {
    createAccountSchema,
    updateAccountSchema,
    accountIdParamSchema,
    createCategorySchema,
    updateCategorySchema,
    categoryIdParamSchema,
    createTransactionSchema,
    updateTransactionSchema,
    transactionIdParamSchema,
    listTransactionsQuerySchema,
    createTransferSchema,
    dashboardQuerySchema,
    categoryBreakdownQuerySchema,
    createReportSchema,
    reportIdParamSchema,
    listReportsQuerySchema,
} from './personalFinance.dto.js';

// If you want strict typing without 'as any', you can import ZodSchema
// import { ZodSchema } from 'zod'; 

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================================
// ACCOUNTS
// ============================================================================

router.post(
    '/accounts',
    validateBody(createAccountSchema),
    personalFinanceController.createAccount.bind(personalFinanceController)
);

router.get(
    '/accounts',
    personalFinanceController.listAccounts.bind(personalFinanceController)
);

router.get(
    '/accounts/:accountId',
    validateParams(accountIdParamSchema),
    personalFinanceController.getAccount.bind(personalFinanceController)
);

router.patch(
    '/accounts/:accountId',
    validateParams(accountIdParamSchema),
    validateBody(updateAccountSchema),
    personalFinanceController.updateAccount.bind(personalFinanceController)
);

router.post(
    '/accounts/:accountId/archive',
    validateParams(accountIdParamSchema),
    personalFinanceController.archiveAccount.bind(personalFinanceController)
);

// ============================================================================
// CATEGORIES
// ============================================================================

router.post(
    '/categories',
    validateBody(createCategorySchema),
    personalFinanceController.createCategory.bind(personalFinanceController)
);

router.get(
    '/categories',
    personalFinanceController.listCategories.bind(personalFinanceController)
);

router.patch(
    '/categories/:categoryId',
    validateParams(categoryIdParamSchema),
    validateBody(updateCategorySchema),
    personalFinanceController.updateCategory.bind(personalFinanceController)
);

router.delete(
    '/categories/:categoryId',
    validateParams(categoryIdParamSchema),
    personalFinanceController.deleteCategory.bind(personalFinanceController)
);

// ============================================================================
// TRANSACTIONS
// ============================================================================

router.post(
    '/transactions',
    validateBody(createTransactionSchema),
    personalFinanceController.createTransaction.bind(personalFinanceController)
);

router.get(
    '/transactions',
    // FIX: Cast to 'any' to bypass TS error regarding Zod Default inputs.
    // The middleware expects strict inputs, but .default() makes input optional.
    // Zod handles this correctly at runtime, so the cast is safe.
    validateQuery(listTransactionsQuerySchema as any), 
    personalFinanceController.listTransactions.bind(personalFinanceController)
);

router.get(
    '/transactions/:transactionId',
    validateParams(transactionIdParamSchema),
    personalFinanceController.getTransaction.bind(personalFinanceController)
);

router.patch(
    '/transactions/:transactionId',
    validateParams(transactionIdParamSchema),
    validateBody(updateTransactionSchema),
    personalFinanceController.updateTransaction.bind(personalFinanceController)
);

router.delete(
    '/transactions/:transactionId',
    validateParams(transactionIdParamSchema),
    personalFinanceController.deleteTransaction.bind(personalFinanceController)
);

// NEW: Reconciliation Endpoint
router.patch(
    '/transactions/:transactionId/reconcile',
    validateParams(transactionIdParamSchema),
    personalFinanceController.toggleReconciliation.bind(personalFinanceController)
);

// ============================================================================
// TRANSFERS
// ============================================================================

router.post(
    '/transfers',
    validateBody(createTransferSchema),
    personalFinanceController.createTransfer.bind(personalFinanceController)
);

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

router.get(
    '/dashboard',
    validateQuery(dashboardQuerySchema as any), // Cast here too just in case
    personalFinanceController.getDashboard.bind(personalFinanceController)
);

router.get(
    '/analytics/categories',
    validateQuery(categoryBreakdownQuerySchema as any),
    personalFinanceController.getCategoryBreakdown.bind(personalFinanceController)
);

// ============================================================================
// REPORTS
// ============================================================================

router.post(
    '/reports',
    validateBody(createReportSchema),
    personalFinanceController.createReport.bind(personalFinanceController)
);

router.get(
    '/reports',
    validateQuery(listReportsQuerySchema as any),
    personalFinanceController.listReports.bind(personalFinanceController)
);

router.get(
    '/reports/:reportId/download',
    validateParams(reportIdParamSchema),
    personalFinanceController.getReportDownload.bind(personalFinanceController)
);

export default router;