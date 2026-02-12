import { orgFinanceRepository } from './orgFinance.repository.js';
import { NotificationService } from '../notification/notification.service.js';
import { orgFinanceReportQueue } from '../../queues/index.js';
import { redis } from '../../libs/redis.js';
import { paginatedResponse } from '../../utils/helpers.js';
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
} from '../../utils/errors.js';
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

const BALANCE_CACHE_TTL = 600; // 10 minutes
const BALANCE_CACHE_PREFIX = 'org-balance';

export class OrgFinanceService {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    // =========================================================================
    // BALANCE CACHING
    // =========================================================================

    private balanceCacheKey(orgId: string, accountId: string): string {
        return `${BALANCE_CACHE_PREFIX}:${orgId}:${accountId}`;
    }

    private async getCachedBalance(orgId: string, accountId: string): Promise<string | null> {
        return redis.get(this.balanceCacheKey(orgId, accountId));
    }

    private async setCachedBalance(orgId: string, accountId: string, balance: string): Promise<void> {
        await redis.setex(this.balanceCacheKey(orgId, accountId), BALANCE_CACHE_TTL, balance);
    }

    private async invalidateBalanceCache(orgId: string, accountId: string): Promise<void> {
        await redis.del(this.balanceCacheKey(orgId, accountId));
    }

    private async getAccountBalance(orgId: string, accountId: string): Promise<string> {
        const cached = await this.getCachedBalance(orgId, accountId);
        if (cached !== null) return cached;

        const balance = await orgFinanceRepository.computeAccountBalance(accountId);
        await this.setCachedBalance(orgId, accountId, balance);
        return balance;
    }

    // =========================================================================
    // CASHBOOKS (CONTAINERS)
    // =========================================================================

    async createCashbook(organizationId: string, input: CreateCashbookInput) {
        return orgFinanceRepository.createCashbook(organizationId, input);
    }

    async listCashbooks(organizationId: string) {
        return orgFinanceRepository.findCashbooks(organizationId);
    }

    async getCashbook(organizationId: string, cashbookId: string) {
        const cashbook = await orgFinanceRepository.findCashbookById(organizationId, cashbookId);
        if (!cashbook) throw new NotFoundError('Cashbook not found');
        return cashbook;
    }

    async updateCashbook(organizationId: string, cashbookId: string, input: UpdateCashbookInput) {
        const cashbook = await orgFinanceRepository.findCashbookById(organizationId, cashbookId);
        if (!cashbook) throw new NotFoundError('Cashbook not found');
        return orgFinanceRepository.updateCashbook(organizationId, cashbookId, input);
    }

    async deleteCashbook(organizationId: string, cashbookId: string) {
        const cashbook = await orgFinanceRepository.findCashbookById(organizationId, cashbookId);
        if (!cashbook) throw new NotFoundError('Cashbook not found');
        return orgFinanceRepository.deleteCashbook(organizationId, cashbookId);
    }

    // =========================================================================
    // CASHBOOK MEMBERS
    // =========================================================================

    async addCashbookMember(organizationId: string, cashbookId: string, input: AddCashbookMemberInput) {
        const cashbook = await orgFinanceRepository.findCashbookById(organizationId, cashbookId);
        if (!cashbook) throw new NotFoundError('Cashbook not found');
        return orgFinanceRepository.addCashbookMember(cashbookId, input.userId, input.role);
    }

    async removeCashbookMember(organizationId: string, cashbookId: string, userId: string) {
        const cashbook = await orgFinanceRepository.findCashbookById(organizationId, cashbookId);
        if (!cashbook) throw new NotFoundError('Cashbook not found');
        return orgFinanceRepository.removeCashbookMember(cashbookId, userId);
    }

    // =========================================================================
    // CONTACTS
    // =========================================================================

    async createContact(organizationId: string, input: CreateContactInput) {
        return orgFinanceRepository.createContact(organizationId, input);
    }

    async updateContact(organizationId: string, contactId: string, input: UpdateContactInput) {
        const contact = await orgFinanceRepository.findContactById(organizationId, contactId);
        if (!contact) throw new NotFoundError('Contact not found');
        return orgFinanceRepository.updateContact(organizationId, contactId, input);
    }

    async listContacts(organizationId: string, query: ListContactsQuery) {
        const { data, total, page, limit } = await orgFinanceRepository.findContacts(organizationId, query);
        return paginatedResponse(data, total, page, limit);
    }

    // =========================================================================
    // ACCOUNTS (WALLETS)
    // =========================================================================

    async createAccount(organizationId: string, input: CreateAccountInput) {
        // Validate Cashbook ownership
        const cashbook = await orgFinanceRepository.findCashbookById(organizationId, input.cashbookId);
        if (!cashbook) throw new NotFoundError('Cashbook not found');

        return orgFinanceRepository.createAccount(organizationId, input);
    }

    async listAccounts(organizationId: string, cashbookId?: string, includeArchived = false) {
        // If specific cashbook requested, validate it exists
        if (cashbookId) {
            const cashbook = await orgFinanceRepository.findCashbookById(organizationId, cashbookId);
            if (!cashbook) throw new NotFoundError('Cashbook not found');
        }

        const accounts = await orgFinanceRepository.findAccounts(organizationId, cashbookId, includeArchived);
        const accountsWithBalances = await Promise.all(
            accounts.map(async (account) => ({
                ...account,
                balance: await this.getAccountBalance(organizationId, account.id),
            }))
        );
        return accountsWithBalances;
    }

    async getAccount(organizationId: string, accountId: string) {
        const account = await orgFinanceRepository.findAccountById(organizationId, accountId);
        if (!account) throw new NotFoundError('Account not found');

        const balance = await this.getAccountBalance(organizationId, accountId);
        return { ...account, balance };
    }

    async updateAccount(organizationId: string, accountId: string, input: UpdateAccountInput) {
        const account = await orgFinanceRepository.findAccountById(organizationId, accountId);
        if (!account) throw new NotFoundError('Account not found');

        return orgFinanceRepository.updateAccount(organizationId, accountId, input);
    }

    async archiveAccount(organizationId: string, accountId: string) {
        const account = await orgFinanceRepository.findAccountById(organizationId, accountId);
        if (!account) throw new NotFoundError('Account not found');
        if (account.isArchived) throw new BadRequestError('Account is already archived');

        await this.invalidateBalanceCache(organizationId, accountId);
        return orgFinanceRepository.archiveAccount(accountId);
    }

    // =========================================================================
    // LEDGER ENTRIES
    // =========================================================================

    async createEntry(organizationId: string, userId: string, input: CreateEntryInput) {
        // 1. Validate Account & Cashbook Settings
        const account = await orgFinanceRepository.findAccountById(organizationId, input.accountId);
        if (!account) throw new NotFoundError('Account not found');

        // Check Permissions (User must be member of Cashbook)
        const userRole = await orgFinanceRepository.getCashbookMemberRole(account.cashbookId, userId);
        // Note: Admin/Owner override logic should be handled in middleware or here if context passed
        // For strictness:
        if (!userRole) {
            // Check if user is Org Admin/Owner to allow bypassing specific assignment
            const orgAdmins = await orgFinanceRepository.getOrganizationAdminsAndOwner(organizationId);
            const isAdmin = orgAdmins.some(admin => admin.userId === userId);
            if (!isAdmin) throw new ForbiddenError('You are not a member of this cashbook');
        } else if (userRole === 'VIEWER') {
            throw new ForbiddenError('Viewers cannot create entries');
        }

        // Check Settings (Backdating)
        if (input.entryCategory === 'BACKDATED' && !account.cashbook.allowBackdated) {
            throw new BadRequestError('Backdated entries are not allowed in this cashbook');
        }
        if (input.entryCategory === 'OMITTED' && !account.cashbook.allowOmitted) {
            throw new BadRequestError('Omitted entries are not allowed in this cashbook');
        }
        if (account.cashbook.lockDate && input.transactionDate < account.cashbook.lockDate) {
            throw new BadRequestError(`Cashbook is locked for entries prior to ${account.cashbook.lockDate.toDateString()}`);
        }

        const entry = await orgFinanceRepository.createEntry(
            organizationId,
            userId,
            input,
            input.idempotencyKey
        );

        // Invalidate balance cache
        await this.invalidateBalanceCache(organizationId, input.accountId);

        // Notify org owner for backdated/omitted entries
        if (input.entryCategory !== 'NORMAL') {
            const ownerId = await orgFinanceRepository.getOrganizationOwnerId(organizationId);
            if (ownerId && ownerId !== userId) {
                await this.notificationService.create({
                    userId: ownerId,
                    organizationId,
                    type: 'ORG_FINANCE_ADJUSTMENT',
                    title: `${input.entryCategory} Entry Created`,
                    message: `A ${input.entryCategory.toLowerCase()} ${input.type.toLowerCase()} entry of ${input.amount} was created. Reason: ${input.reason}`,
                    data: { entryId: entry.id, entryCategory: input.entryCategory },
                });
            }
        }

        return entry;
    }

    async createTransfer(organizationId: string, userId: string, input: CreateTransferInput) {
        if (input.fromAccountId === input.toAccountId) {
            throw new BadRequestError('Cannot transfer to the same account');
        }

        const { debit, credit } = await orgFinanceRepository.createTransfer(
            organizationId, 
            userId, 
            input
        );

        // Invalidate cache for BOTH accounts involved
        await this.invalidateBalanceCache(organizationId, input.fromAccountId);
        await this.invalidateBalanceCache(organizationId, input.toAccountId);

        return { debit, credit };
    }

    async listEntries(organizationId: string, query: ListEntriesQuery) {
        const { data, total, page, limit } = await orgFinanceRepository.findEntries(
            organizationId,
            query
        );

        // --- SMART LEDGER CONTEXT ---
        let ledgerContext = null;
        if (query.accountId && query.startDate) {
            const openingBalance = await orgFinanceRepository.calculateOpeningBalance(
                organizationId,
                query.accountId,
                query.startDate
            );
            
            ledgerContext = {
                openingBalance,
            };
        }

        return {
            ...paginatedResponse(data, total, page, limit),
            ledgerContext,
        };
    }

    async getEntry(organizationId: string, entryId: string) {
        const entry = await orgFinanceRepository.findEntryById(organizationId, entryId);
        if (!entry) throw new NotFoundError('Ledger entry not found');
        return entry;
    }

    async updateEntry(organizationId: string, entryId: string, userId: string, input: UpdateEntryInput) {
        const entry = await orgFinanceRepository.findEntryById(organizationId, entryId);
        if (!entry) throw new NotFoundError('Ledger entry not found');
        if (entry.status !== 'ACTIVE') {
            throw new BadRequestError(`Cannot edit entry with status: ${entry.status}`);
        }

        // Snapshot previous data
        const previousData: Record<string, unknown> = {
            description: entry.description,
            reference: entry.reference,
            amount: entry.amount?.toString(),
            transactionDate: entry.transactionDate,
        };

        const updated = await orgFinanceRepository.updateEntry(
            organizationId,
            entryId,
            userId,
            input,
            previousData
        );

        // Invalidate balance cache if amount changed
        if (input.amount !== undefined) {
            await this.invalidateBalanceCache(organizationId, entry.accountId);
        }

        // Notify org owner about edits
        const ownerId = await orgFinanceRepository.getOrganizationOwnerId(organizationId);
        if (ownerId && ownerId !== userId) {
            await this.notificationService.create({
                userId: ownerId,
                organizationId,
                type: 'ORG_FINANCE_ENTRY_UPDATED',
                title: 'Finance Entry Edited',
                message: `A ledger entry was edited. Reason: ${input.editReason}`,
                data: { entryId, editReason: input.editReason, previousData },
            });
        }

        return updated;
    }

    async reverseEntry(
        organizationId: string,
        entryId: string,
        userId: string,
        input: CreateReversalInput
    ) {
        const entry = await orgFinanceRepository.findEntryById(organizationId, entryId);
        if (!entry) throw new NotFoundError('Ledger entry not found');
        if (entry.status !== 'ACTIVE') {
            throw new BadRequestError(`Cannot reverse entry with status: ${entry.status}`);
        }
        if (entry.reversedById) {
            throw new ConflictError('Entry has already been reversed');
        }

        const reversal = await orgFinanceRepository.createReversal(
            organizationId,
            userId,
            {
                id: entry.id,
                accountId: entry.accountId,
                type: entry.type,
                amount: entry.amount,
                currency: entry.currency,
                description: entry.description,
            },
            input.reason,
            input.reference
        );

        // Invalidate balance cache
        await this.invalidateBalanceCache(organizationId, entry.accountId);

        return reversal;
    }

    async toggleReconciliation(organizationId: string, entryId: string, _userId: string) {
        const entry = await orgFinanceRepository.findEntryById(organizationId, entryId);
        if (!entry) throw new NotFoundError('Ledger entry not found');

        // Toggle state
        const newState = !entry.isReconciled;
        return orgFinanceRepository.toggleReconciliation(organizationId, entryId, newState);
    }

    // =========================================================================
    // DELETE REQUESTS
    // =========================================================================

    async requestDelete(organizationId: string, entryId: string, userId: string, input: RequestDeleteInput) {
        const entry = await orgFinanceRepository.findEntryById(organizationId, entryId);
        if (!entry) throw new NotFoundError('Ledger entry not found');
        if (entry.status !== 'ACTIVE') {
            throw new BadRequestError(`Cannot delete entry with status: ${entry.status}`);
        }

        const request = await orgFinanceRepository.createDeleteRequest(
            organizationId,
            entryId,
            userId,
            input.reason
        );

        // Notify owner and admins
        const admins = await orgFinanceRepository.getOrganizationAdminsAndOwner(organizationId);
        for (const admin of admins) {
            if (admin.userId !== userId) {
                await this.notificationService.create({
                    userId: admin.userId,
                    organizationId,
                    type: 'ORG_FINANCE_DELETE_REQUESTED',
                    title: 'Deletion Request',
                    message: `A deletion request was submitted for a finance entry. Reason: ${input.reason}`,
                    data: { requestId: request.id, entryId },
                });
            }
        }

        return request;
    }

    async listDeleteRequests(organizationId: string, query: ListDeleteRequestsQuery) {
        const { data, total, page, limit } = await orgFinanceRepository.findDeleteRequests(
            organizationId,
            query
        );
        return paginatedResponse(data, total, page, limit);
    }

    async approveDelete(organizationId: string, requestId: string, userId: string) {
        const request = await orgFinanceRepository.findDeleteRequestById(requestId);
        if (!request) throw new NotFoundError('Delete request not found');
        if (request.organizationId !== organizationId) throw new NotFoundError('Delete request not found');
        if (request.status !== 'PENDING') {
            throw new BadRequestError(`Request is already ${request.status.toLowerCase()}`);
        }

        const approved = await orgFinanceRepository.approveDeleteRequest(
            requestId,
            request.entryId,
            userId,
            organizationId
        );

        // Invalidate balance cache
        if (request.entry) {
            await this.invalidateBalanceCache(organizationId, request.entry.accountId);
        }

        // Notify requester
        await this.notificationService.create({
            userId: request.requestedById,
            organizationId,
            type: 'ORG_FINANCE_DELETE_APPROVED',
            title: 'Deletion Approved',
            message: 'Your deletion request has been approved.',
            data: { requestId },
        });

        return approved;
    }

    async rejectDelete(
        organizationId: string,
        requestId: string,
        userId: string,
        input: RejectDeleteInput
    ) {
        const request = await orgFinanceRepository.findDeleteRequestById(requestId);
        if (!request) throw new NotFoundError('Delete request not found');
        if (request.organizationId !== organizationId) throw new NotFoundError('Delete request not found');
        if (request.status !== 'PENDING') {
            throw new BadRequestError(`Request is already ${request.status.toLowerCase()}`);
        }

        const rejected = await orgFinanceRepository.rejectDeleteRequest(
            requestId,
            request.entryId,
            userId,
            organizationId,
            input.rejectionReason
        );

        // Notify requester
        await this.notificationService.create({
            userId: request.requestedById,
            organizationId,
            type: 'ORG_FINANCE_DELETE_REJECTED',
            title: 'Deletion Rejected',
            message: `Your deletion request was rejected. Reason: ${input.rejectionReason}`,
            data: { requestId, rejectionReason: input.rejectionReason },
        });

        return rejected;
    }

    // =========================================================================
    // DASHBOARD
    // =========================================================================

    async getDashboard(organizationId: string, query: DashboardQuery) {
        // Only fetch dashboard for accounts within the specified Cashbook if filter provided
        const [accounts, summary, recentEntries, pendingDeleteRequests] = await Promise.all([
            this.listAccounts(organizationId, query.cashbookId),
            orgFinanceRepository.getInflowOutflowSummary(
                organizationId,
                query.startDate,
                query.endDate,
                query.accountId
            ),
            orgFinanceRepository.getRecentEntries(organizationId),
            orgFinanceRepository.getPendingDeleteRequestCount(organizationId),
        ]);

        const totalBalance = accounts.reduce(
            (sum, acc) => sum + parseFloat(acc.balance ?? '0'),
            0
        );

        return {
            totalBalance: totalBalance.toFixed(2),
            totalInflow: summary.totalInflow,
            totalOutflow: summary.totalOutflow,
            netCashflow: summary.netCashflow,
            accountBalances: accounts.map((a) => ({
                accountId: a.id,
                accountName: a.name,
                accountType: a.type,
                currency: a.currency,
                balance: a.balance ?? '0.00',
            })),
            recentEntries,
            pendingDeleteRequests,
        };
    }

    // =========================================================================
    // REPORTS
    // =========================================================================

    async createReport(organizationId: string, userId: string, input: CreateReportInput) {
        const report = await orgFinanceRepository.createReport({
            organizationId,
            userId,
            type: input.type,
            format: input.format,
            parameters: {
                startDate: input.startDate.toISOString(),
                endDate: input.endDate.toISOString(),
                accountId: input.accountId,
                cashbookId: input.cashbookId, // Include Cashbook Scope
            },
        });

        await orgFinanceReportQueue.add('generate-report', {
            reportId: report.id,
            organizationId,
            userId,
        });

        return report;
    }

    async listReports(organizationId: string, query: ListReportsQuery) {
        const { data, total, page, limit } = await orgFinanceRepository.findReports(
            organizationId,
            query
        );
        return paginatedResponse(data, total, page, limit);
    }

    async getReportDownloadUrl(organizationId: string, reportId: string) {
        const report = await orgFinanceRepository.findReportById(reportId);
        if (!report) throw new NotFoundError('Report not found');
        if (report.organizationId !== organizationId) throw new NotFoundError('Report not found');
        if (report.status !== 'COMPLETED') {
            throw new BadRequestError(`Report is not ready. Current status: ${report.status}`);
        }
        if (!report.fileUrl) {
            throw new BadRequestError('Report file is not available');
        }
        return { url: report.fileUrl, expiresAt: report.expiresAt };
    }

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================

    async listAuditLogs(organizationId: string, query: ListAuditLogsQuery) {
        const { data, total, page, limit } = await orgFinanceRepository.findAuditLogs(
            organizationId,
            query
        );
        return paginatedResponse(data, total, page, limit);
    }
}

export const orgFinanceService = new OrgFinanceService();
export default orgFinanceService;