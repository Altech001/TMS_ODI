import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { orgFinanceService } from './orgFinance.service.js';
import type {
    CreateAccountInput,
    UpdateAccountInput,
    CreateEntryInput,
    UpdateEntryInput,
    ListEntriesQuery,
    CreateReversalInput,
    RequestDeleteInput,
    RejectDeleteInput,
    ListDeleteRequestsQuery,
    DashboardQuery,
    CreateReportInput,
    ListReportsQuery,
    ListAuditLogsQuery,
    CreateTransferInput,
    CreateCashbookInput,
    UpdateCashbookInput,
    AddCashbookMemberInput,
    CreateContactInput,
    UpdateContactInput,
    ListContactsQuery,
} from './orgFinance.dto.js';

export class OrgFinanceController {
    
    // =========================================================================
    // CASHBOOKS
    // =========================================================================

    async createCashbook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateCashbookInput;
            const cashbook = await orgFinanceService.createCashbook(req.organizationId, input);
            res.status(201).json({ success: true, data: cashbook });
        } catch (error) { next(error); }
    }

    async listCashbooks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const cashbooks = await orgFinanceService.listCashbooks(req.organizationId);
            res.json({ success: true, data: cashbooks });
        } catch (error) { next(error); }
    }

    async getCashbook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const cashbook = await orgFinanceService.getCashbook(req.organizationId, req.params.cashbookId);
            res.json({ success: true, data: cashbook });
        } catch (error) { next(error); }
    }

    async updateCashbook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdateCashbookInput;
            const cashbook = await orgFinanceService.updateCashbook(req.organizationId, req.params.cashbookId, input);
            res.json({ success: true, data: cashbook });
        } catch (error) { next(error); }
    }

    async deleteCashbook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            await orgFinanceService.deleteCashbook(req.organizationId, req.params.cashbookId);
            res.json({ success: true, message: 'Cashbook deleted successfully' });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // CASHBOOK MEMBERS
    // =========================================================================

    async addCashbookMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const input = req.body as AddCashbookMemberInput;
            const result = await orgFinanceService.addCashbookMember(req.organizationId, req.params.cashbookId, input);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async removeCashbookMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            await orgFinanceService.removeCashbookMember(req.organizationId, req.params.cashbookId, req.params.userId);
            res.json({ success: true, message: 'Member removed from cashbook' });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // CONTACTS
    // =========================================================================

    async createContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateContactInput;
            const contact = await orgFinanceService.createContact(req.organizationId, input);
            res.status(201).json({ success: true, data: contact });
        } catch (error) { next(error); }
    }

    async listContacts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as unknown as ListContactsQuery;
            const result = await orgFinanceService.listContacts(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async updateContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdateContactInput;
            const contact = await orgFinanceService.updateContact(req.organizationId, req.params.contactId, input);
            res.json({ success: true, data: contact });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // ACCOUNTS
    // =========================================================================

    async createAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateAccountInput;
            const account = await orgFinanceService.createAccount(req.organizationId, input);
            res.status(201).json({ success: true, data: account });
        } catch (error) { next(error); }
    }

    async listAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const includeArchived = req.query.includeArchived === 'true';
            const cashbookId = req.query.cashbookId as string | undefined;
            const accounts = await orgFinanceService.listAccounts(req.organizationId, cashbookId, includeArchived);
            res.json({ success: true, data: accounts });
        } catch (error) { next(error); }
    }

    async getAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const account = await orgFinanceService.getAccount(req.organizationId, req.params.accountId);
            res.json({ success: true, data: account });
        } catch (error) { next(error); }
    }

    async updateAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdateAccountInput;
            const account = await orgFinanceService.updateAccount(req.organizationId, req.params.accountId, input);
            res.json({ success: true, data: account });
        } catch (error) { next(error); }
    }

    async archiveAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const account = await orgFinanceService.archiveAccount(req.organizationId, req.params.accountId);
            res.json({ success: true, data: account, message: 'Account archived' });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // LEDGER ENTRIES
    // =========================================================================

    async createEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateEntryInput;
            const entry = await orgFinanceService.createEntry(req.organizationId, req.user.id, input);
            res.status(201).json({ success: true, data: entry });
        } catch (error) { next(error); }
    }

    async createTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateTransferInput;
            const result = await orgFinanceService.createTransfer(req.organizationId, req.user.id, input);
            res.status(201).json({ success: true, data: result, message: 'Transfer successful' });
        } catch (error) { next(error); }
    }

    async listEntries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as unknown as ListEntriesQuery;
            const result = await orgFinanceService.listEntries(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async getEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const entry = await orgFinanceService.getEntry(req.organizationId, req.params.entryId);
            res.json({ success: true, data: entry });
        } catch (error) { next(error); }
    }

    async updateEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdateEntryInput;
            const entry = await orgFinanceService.updateEntry(
                req.organizationId,
                req.params.entryId,
                req.user.id,
                input
            );
            res.json({ success: true, data: entry });
        } catch (error) { next(error); }
    }

    async reverseEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateReversalInput;
            const reversal = await orgFinanceService.reverseEntry(
                req.organizationId,
                req.params.entryId,
                req.user.id,
                input
            );
            res.status(201).json({ success: true, data: reversal, message: 'Reversal entry created' });
        } catch (error) { next(error); }
    }

    async toggleReconciliation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const result = await orgFinanceService.toggleReconciliation(
                req.organizationId,
                req.params.entryId,
                req.user.id
            );
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async requestDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as RequestDeleteInput;
            const request = await orgFinanceService.requestDelete(
                req.organizationId,
                req.params.entryId,
                req.user.id,
                input
            );
            res.status(201).json({ success: true, data: request, message: 'Delete request submitted' });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // DELETE REQUESTS
    // =========================================================================

    async listDeleteRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as unknown as ListDeleteRequestsQuery;
            const result = await orgFinanceService.listDeleteRequests(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async approveDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const result = await orgFinanceService.approveDelete(
                req.organizationId,
                req.params.requestId,
                req.user.id
            );
            res.json({ success: true, data: result, message: 'Deletion approved' });
        } catch (error) { next(error); }
    }

    async rejectDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as RejectDeleteInput;
            const result = await orgFinanceService.rejectDelete(
                req.organizationId,
                req.params.requestId,
                req.user.id,
                input
            );
            res.json({ success: true, data: result, message: 'Deletion rejected' });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // DASHBOARD & ANALYTICS
    // =========================================================================

    async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as unknown as DashboardQuery;
            const dashboard = await orgFinanceService.getDashboard(req.organizationId, query);
            res.json({ success: true, data: dashboard });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // REPORTS
    // =========================================================================

    async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateReportInput;
            const report = await orgFinanceService.createReport(
                req.organizationId,
                req.user.id,
                input
            );
            res.status(201).json({ success: true, data: report, message: 'Report generation started' });
        } catch (error) { next(error); }
    }

    async listReports(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as unknown as ListReportsQuery;
            const result = await orgFinanceService.listReports(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async downloadReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const result = await orgFinanceService.getReportDownloadUrl(
                req.organizationId,
                req.params.reportId
            );
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================

    async listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as unknown as ListAuditLogsQuery;
            const result = await orgFinanceService.listAuditLogs(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }
}

export const orgFinanceController = new OrgFinanceController();
export default orgFinanceController;