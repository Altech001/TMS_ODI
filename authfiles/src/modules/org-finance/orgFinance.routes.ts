import { Router } from 'express';
import multer from 'multer';
import { orgFinanceController } from './orgFinance.controller.js';
import {
    authMiddleware,
    orgResolverMiddleware,
    requirePermission,
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/index.js';
import {
    // Cashbooks
    createCashbookSchema,
    updateCashbookSchema,
    cashbookIdParamSchema,
    addCashbookMemberSchema,
    
    // Contacts
    createContactSchema,
    updateContactSchema,
    contactIdParamSchema,
    listContactsQuerySchema,

    // Accounts
    createAccountSchema,
    updateAccountSchema,
    accountIdParamSchema,

    // Entries & Transfers
    createEntrySchema,
    updateEntrySchema,
    entryIdParamSchema,
    listEntriesQuerySchema,
    createTransferSchema,
    createReversalSchema,

    // Delete Requests
    requestDeleteSchema,
    deleteRequestIdParamSchema,
    rejectDeleteSchema,
    listDeleteRequestsQuerySchema,
    approveDeleteSchema,

    // Analytics & Reports
    dashboardQuerySchema,
    createReportSchema,
    reportIdParamSchema,
    listReportsQuerySchema,
    listAuditLogsQuerySchema,
} from './orgFinance.dto.js';
import { uploadController } from './upload.controller.js';

// Configure Multer (Memory Storage)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// All routes require auth + org context
router.use(authMiddleware, orgResolverMiddleware);

// =========================================================================
// CASHBOOKS (NEW CONTAINER LAYER)
// =========================================================================

router.post(
    '/cashbooks',
    requirePermission('org_finance:manage_accounts'),
    validateBody(createCashbookSchema),
    orgFinanceController.createCashbook.bind(orgFinanceController)
);

router.get(
    '/cashbooks',
    requirePermission('org_finance:read'),
    orgFinanceController.listCashbooks.bind(orgFinanceController)
);

router.get(
    '/cashbooks/:cashbookId',
    requirePermission('org_finance:read'),
    validateParams(cashbookIdParamSchema),
    orgFinanceController.getCashbook.bind(orgFinanceController)
);

router.patch(
    '/cashbooks/:cashbookId',
    requirePermission('org_finance:manage_accounts'),
    validateParams(cashbookIdParamSchema),
    validateBody(updateCashbookSchema),
    orgFinanceController.updateCashbook.bind(orgFinanceController)
);

router.delete(
    '/cashbooks/:cashbookId',
    requirePermission('org_finance:manage_accounts'),
    validateParams(cashbookIdParamSchema),
    orgFinanceController.deleteCashbook.bind(orgFinanceController)
);

// --- Cashbook Members ---

router.post(
    '/cashbooks/:cashbookId/members',
    requirePermission('org_finance:manage_accounts'),
    validateParams(cashbookIdParamSchema),
    validateBody(addCashbookMemberSchema),
    orgFinanceController.addCashbookMember.bind(orgFinanceController)
);

router.delete(
    '/cashbooks/:cashbookId/members/:userId',
    requirePermission('org_finance:manage_accounts'),
    validateParams(cashbookIdParamSchema),
    orgFinanceController.removeCashbookMember.bind(orgFinanceController)
);

// =========================================================================
// CONTACTS (SUPPLIERS / CUSTOMERS)
// =========================================================================

router.post(
    '/contacts',
    requirePermission('org_finance:create'), // Or a specific 'manage_contacts' permission if added
    validateBody(createContactSchema),
    orgFinanceController.createContact.bind(orgFinanceController)
);

router.get(
    '/contacts',
    requirePermission('org_finance:read'),
    validateQuery(listContactsQuerySchema as any),
    orgFinanceController.listContacts.bind(orgFinanceController)
);

router.patch(
    '/contacts/:contactId',
    requirePermission('org_finance:update'),
    validateParams(contactIdParamSchema),
    validateBody(updateContactSchema),
    orgFinanceController.updateContact.bind(orgFinanceController)
);

// =========================================================================
// ACCOUNTS (WALLETS)
// =========================================================================

router.post(
    '/accounts',
    requirePermission('org_finance:manage_accounts'),
    validateBody(createAccountSchema),
    orgFinanceController.createAccount.bind(orgFinanceController)
);

router.get(
    '/accounts',
    requirePermission('org_finance:read'),
    orgFinanceController.listAccounts.bind(orgFinanceController)
);

router.get(
    '/accounts/:accountId',
    requirePermission('org_finance:read'),
    validateParams(accountIdParamSchema),
    orgFinanceController.getAccount.bind(orgFinanceController)
);

router.patch(
    '/accounts/:accountId',
    requirePermission('org_finance:manage_accounts'),
    validateParams(accountIdParamSchema),
    validateBody(updateAccountSchema),
    orgFinanceController.updateAccount.bind(orgFinanceController)
);

router.post(
    '/accounts/:accountId/archive',
    requirePermission('org_finance:manage_accounts'),
    validateParams(accountIdParamSchema),
    orgFinanceController.archiveAccount.bind(orgFinanceController)
);

// =========================================================================
// LEDGER ENTRIES & TRANSFERS
// =========================================================================

// =========================================================================
// ATTACHMENT UPLOADS (Step 1 of creating an entry with proof)
// =========================================================================
router.post(
    '/uploads',
    requirePermission('org_finance:create'),
    upload.single('file'), // Expects form-data field named 'file'
    uploadController.uploadEvidence.bind(uploadController)
);

router.post(
    '/entries',
    requirePermission('org_finance:create'),
    validateBody(createEntrySchema),
    orgFinanceController.createEntry.bind(orgFinanceController)
);

router.post(
    '/transfers',
    requirePermission('org_finance:create'),
    validateBody(createTransferSchema),
    orgFinanceController.createTransfer.bind(orgFinanceController)
);

router.get(
    '/entries',
    requirePermission('org_finance:read'),
    validateQuery(listEntriesQuerySchema as any), // Cast to 'any' to handle Zod defaults safely with Express types
    orgFinanceController.listEntries.bind(orgFinanceController)
);

router.get(
    '/entries/:entryId',
    requirePermission('org_finance:read'),
    validateParams(entryIdParamSchema),
    orgFinanceController.getEntry.bind(orgFinanceController)
);

router.patch(
    '/entries/:entryId',
    requirePermission('org_finance:update'),
    validateParams(entryIdParamSchema),
    validateBody(updateEntrySchema),
    orgFinanceController.updateEntry.bind(orgFinanceController)
);

router.patch(
    '/entries/:entryId/reconcile',
    requirePermission('org_finance:update'),
    validateParams(entryIdParamSchema),
    orgFinanceController.toggleReconciliation.bind(orgFinanceController)
);

router.post(
    '/entries/:entryId/reverse',
    requirePermission('org_finance:create'),
    validateParams(entryIdParamSchema),
    validateBody(createReversalSchema),
    orgFinanceController.reverseEntry.bind(orgFinanceController)
);

router.post(
    '/entries/:entryId/request-delete',
    requirePermission('org_finance:request_delete'),
    validateParams(entryIdParamSchema),
    validateBody(requestDeleteSchema),
    orgFinanceController.requestDelete.bind(orgFinanceController)
);

// =========================================================================
// DELETE REQUESTS
// =========================================================================

router.get(
    '/delete-requests',
    requirePermission('org_finance:approve'),
    validateQuery(listDeleteRequestsQuerySchema as any),
    orgFinanceController.listDeleteRequests.bind(orgFinanceController)
);

router.post(
    '/delete-requests/:requestId/approve',
    requirePermission('org_finance:approve'),
    validateParams(deleteRequestIdParamSchema),
    validateBody(approveDeleteSchema),
    orgFinanceController.approveDelete.bind(orgFinanceController)
);

router.post(
    '/delete-requests/:requestId/reject',
    requirePermission('org_finance:approve'),
    validateParams(deleteRequestIdParamSchema),
    validateBody(rejectDeleteSchema),
    orgFinanceController.rejectDelete.bind(orgFinanceController)
);

// =========================================================================
// DASHBOARD & ANALYTICS
// =========================================================================

router.get(
    '/dashboard',
    requirePermission('org_finance:read'),
    validateQuery(dashboardQuerySchema as any),
    orgFinanceController.getDashboard.bind(orgFinanceController)
);

// =========================================================================
// REPORTS
// =========================================================================

router.post(
    '/reports',
    requirePermission('org_finance:report'),
    validateBody(createReportSchema),
    orgFinanceController.createReport.bind(orgFinanceController)
);

router.get(
    '/reports',
    requirePermission('org_finance:report'),
    validateQuery(listReportsQuerySchema as any),
    orgFinanceController.listReports.bind(orgFinanceController)
);

router.get(
    '/reports/:reportId/download',
    requirePermission('org_finance:report'),
    validateParams(reportIdParamSchema),
    orgFinanceController.downloadReport.bind(orgFinanceController)
);

// =========================================================================
// AUDIT LOGS
// =========================================================================

router.get(
    '/audit-logs',
    requirePermission('org_finance:read'),
    validateQuery(listAuditLogsQuerySchema as any),
    orgFinanceController.listAuditLogs.bind(orgFinanceController)
);

export default router;