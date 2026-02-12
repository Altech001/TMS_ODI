import type {
    PersonalAccountType,
    PersonalCategoryType,
    PersonalTransactionType,
    PersonalReportType,
    ReportFormat,
} from '@prisma/client';
import { personalFinanceRepository } from './personalFinance.repository.js';
import { personalFinanceReportQueue } from '../../queues/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.js';
import { paginatedResponse } from '../../utils/helpers.js';
import type {
    CreateAccountInput,
    UpdateAccountInput,
    CreateCategoryInput,
    UpdateCategoryInput,
    CreateTransactionInput,
    UpdateTransactionInput,
    ListTransactionsQuery,
    CreateTransferInput,
    DashboardQuery,
    CategoryBreakdownQuery,
    CreateReportInput,
    ListReportsQuery,
} from './personalFinance.dto.js';
import type {
    DashboardStats,
    TransactionWithDetails,
    TransferResult,
} from './types/index.js';

export class PersonalFinanceService {
    // =========================================================================
    // ACCOUNTS
    // =========================================================================

    async createAccount(userId: string, input: CreateAccountInput) {
        const account = await personalFinanceRepository.createAccount({
            userId,
            name: input.name,
            type: input.type as PersonalAccountType,
            currency: input.currency || 'USD',
            balance: input.initialBalance || 0,
        });

        return {
            ...account,
            balance: account.balance.toNumber(),
        };
    }

    async listAccounts(userId: string, includeArchived = false) {
        const accounts = await personalFinanceRepository.findAccountsByUser(userId, includeArchived);
        return accounts.map(a => ({
            ...a,
            balance: a.balance.toNumber(),
        }));
    }

    async getAccount(userId: string, accountId: string) {
        const account = await personalFinanceRepository.findAccountById(accountId, userId);
        if (!account) {
            throw new NotFoundError('Account not found');
        }
        return {
            ...account,
            balance: account.balance.toNumber(),
        };
    }

    async updateAccount(userId: string, accountId: string, input: UpdateAccountInput) {
        const account = await personalFinanceRepository.findAccountById(accountId, userId);
        if (!account) {
            throw new NotFoundError('Account not found');
        }

        const updated = await personalFinanceRepository.updateAccount(accountId, userId, input);
        return {
            ...updated,
            balance: updated.balance.toNumber(),
        };
    }

    async archiveAccount(userId: string, accountId: string) {
        const account = await personalFinanceRepository.findAccountById(accountId, userId);
        if (!account) {
            throw new NotFoundError('Account not found');
        }

        const archived = await personalFinanceRepository.archiveAccount(accountId, userId);
        return {
            ...archived,
            balance: archived.balance.toNumber(),
        };
    }

    // =========================================================================
    // CATEGORIES
    // =========================================================================

    async createCategory(userId: string, input: CreateCategoryInput) {
        return personalFinanceRepository.createCategory({
            userId,
            name: input.name,
            type: input.type as PersonalCategoryType,
            icon: input.icon,
            color: input.color,
        });
    }

    async listCategories(userId: string, type?: PersonalCategoryType) {
        return personalFinanceRepository.findCategoriesByUser(userId, type);
    }

    async updateCategory(userId: string, categoryId: string, input: UpdateCategoryInput) {
        const category = await personalFinanceRepository.findCategoryById(categoryId, userId);
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        if (category.isSystem) {
            throw new ForbiddenError('Cannot modify system categories');
        }

        return personalFinanceRepository.updateCategory(categoryId, userId, input);
    }

    async deleteCategory(userId: string, categoryId: string) {
        const category = await personalFinanceRepository.findCategoryById(categoryId, userId);
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        if (category.isSystem) {
            throw new ForbiddenError('Cannot delete system categories');
        }

        await personalFinanceRepository.deleteCategory(categoryId, userId);
        return { success: true };
    }

    // =========================================================================
    // TRANSACTIONS
    // =========================================================================

    async createTransaction(userId: string, input: CreateTransactionInput): Promise<TransactionWithDetails> {
        // Validate account ownership
        const account = await personalFinanceRepository.findAccountById(input.accountId, userId);
        if (!account) {
            throw new NotFoundError('Account not found');
        }

        // Validate category if provided
        if (input.categoryId) {
            const category = await personalFinanceRepository.findCategoryById(input.categoryId, userId);
            if (!category) {
                throw new NotFoundError('Category not found');
            }
        }

        // For expense, check sufficient balance
        if (input.type === 'EXPENSE' && account.balance.lessThan(input.amount)) {
            throw new BadRequestError('Insufficient balance');
        }

        const transaction = await personalFinanceRepository.createTransaction({
            userId,
            accountId: input.accountId,
            categoryId: input.categoryId,
            type: input.type as PersonalTransactionType,
            amount: input.amount,
            currency: input.currency || account.currency,
            note: input.note,
            reference: input.reference,
            transactionAt: input.transactionAt,
        });

        // Log audit
        await personalFinanceRepository.createAuditLog({
            userId,
            transactionId: transaction.id,
            entityType: 'TRANSACTION',
            entityId: transaction.id,
            action: 'CREATED',
            newData: { type: input.type, amount: input.amount, accountId: input.accountId },
        });

        return {
            ...transaction,
            amount: transaction.amount.toNumber(),
            // Ensure null handling for new fields if not in DB yet
            exchangeRate: transaction.exchangeRate?.toNumber() ?? null,
            isReconciled: transaction.isReconciled,
            reconciledAt: transaction.reconciledAt,
            voucherNumber: transaction.voucherNumber,
        };
    }

    async listTransactions(userId: string, query: ListTransactionsQuery) {
        const skip = (query.page - 1) * query.limit;

        // 1. Fetch the raw transactions
        const { data, total } = await personalFinanceRepository.findTransactions(userId, {
            accountId: query.accountId,
            categoryId: query.categoryId,
            type: query.type as PersonalTransactionType | undefined,
            startDate: query.startDate,
            endDate: query.endDate,
            minAmount: query.minAmount,
            maxAmount: query.maxAmount,
            isReconciled: query.isReconciled,
            skip,
            take: query.limit,
        });

        // 2. Normalize Decimal to Number
        const normalized = data.map(t => ({
            ...t,
            amount: t.amount.toNumber(),
            exchangeRate: t.exchangeRate?.toNumber() ?? null,
        }));

        // 3. Smart Ledger Calculation (Opening & Closing Balance)
        // Only valid if we are filtering by a specific account
        let summary = { openingBalance: 0, closingBalance: 0, netMovement: 0 };
        
        if (query.accountId && query.startDate) {
            // Get Opening Balance as of the Start Date
            const opening = await personalFinanceRepository.calculateOpeningBalance(
                userId, 
                query.accountId, 
                query.startDate
            );
            
            // Get Movement during the requested period (Start Date -> End Date)
            const endDate = query.endDate || new Date();
            const periodMovement = await personalFinanceRepository.calculateMovementsInPeriod(
                userId, 
                query.accountId, 
                query.startDate, 
                endDate
            );

            summary = {
                openingBalance: opening,
                closingBalance: opening + periodMovement,
                netMovement: periodMovement
            };
        }

        // Return combined response
        return {
            ...paginatedResponse(normalized, total, query.page, query.limit),
            summary // Frontend can check if summary.openingBalance != 0 to display Ledger view
        };
    }

    async getTransaction(userId: string, transactionId: string) {
        const transaction = await personalFinanceRepository.findTransactionById(transactionId, userId);
        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }
        return {
            ...transaction,
            amount: transaction.amount.toNumber(),
            exchangeRate: transaction.exchangeRate?.toNumber() ?? null,
        };
    }

    async updateTransaction(userId: string, transactionId: string, input: UpdateTransactionInput) {
        const transaction = await personalFinanceRepository.findTransactionById(transactionId, userId);
        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }

        const previousData = {
            amount: transaction.amount.toNumber(),
            categoryId: transaction.categoryId,
            note: transaction.note,
        };

        const updated = await personalFinanceRepository.updateTransaction(transactionId, userId, {
            categoryId: input.categoryId,
            amount: input.amount,
            note: input.note,
            reference: input.reference,
            transactionAt: input.transactionAt,
        });

        // Log audit
        await personalFinanceRepository.createAuditLog({
            userId,
            transactionId: transactionId,
            entityType: 'TRANSACTION',
            entityId: transactionId,
            action: 'UPDATED',
            previousData,
            newData: input,
        });

        return {
            ...updated,
            amount: updated.amount.toNumber(),
            exchangeRate: updated.exchangeRate?.toNumber() ?? null,
        };
    }

    async deleteTransaction(userId: string, transactionId: string) {
        const transaction = await personalFinanceRepository.findTransactionById(transactionId, userId);
        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }

        await personalFinanceRepository.softDeleteTransaction(transactionId, userId);

        // Log audit
        await personalFinanceRepository.createAuditLog({
            userId,
            transactionId: transactionId,
            entityType: 'TRANSACTION',
            entityId: transactionId,
            action: 'DELETED',
            previousData: { amount: transaction.amount.toNumber(), type: transaction.type },
        });

        return { success: true };
    }

    async toggleReconciliation(userId: string, transactionId: string) {
        const transaction = await personalFinanceRepository.findTransactionById(transactionId, userId);
        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }

        const newState = !transaction.isReconciled;
        const updated = await personalFinanceRepository.toggleReconciliation(transactionId, userId, newState);
        
        return {
            success: true,
            isReconciled: updated.isReconciled,
            reconciledAt: updated.reconciledAt
        };
    }

    // =========================================================================
    // TRANSFERS
    // =========================================================================

    async createTransfer(userId: string, input: CreateTransferInput): Promise<TransferResult> {
        if (input.fromAccountId === input.toAccountId) {
            throw new BadRequestError('Cannot transfer to the same account');
        }

        // Detailed account validation happens inside Repository for atomic consistency,
        // but we do a preliminary check or let Repository throw.
        // The Repository throws generic Error, we might want to catch and wrap, 
        // but for now, we rely on the repository's checks.

        const { debitTx, creditTx } = await personalFinanceRepository.createTransfer({
            userId,
            fromAccountId: input.fromAccountId,
            toAccountId: input.toAccountId,
            amount: input.amount,
            toAmount: input.toAmount,       // New: Pass through
            exchangeRate: input.exchangeRate, // New: Pass through
            note: input.note,
            reference: input.reference,
            transactionAt: input.transactionAt,
        });

        // Log audit
        await personalFinanceRepository.createAuditLog({
            userId,
            entityType: 'TRANSFER',
            entityId: debitTx.id,
            action: 'CREATED',
            newData: {
                fromAccountId: input.fromAccountId,
                toAccountId: input.toAccountId,
                amount: input.amount,
                transferGroupId: debitTx.transferGroupId
            },
        });

        return {
            fromTransaction: { 
                ...debitTx, 
                amount: debitTx.amount.toNumber(),
                exchangeRate: debitTx.exchangeRate?.toNumber() ?? null
            },
            toTransaction: { 
                ...creditTx, 
                amount: creditTx.amount.toNumber(),
                exchangeRate: creditTx.exchangeRate?.toNumber() ?? null
            },
        };
    }

    // =========================================================================
    // DASHBOARD & ANALYTICS
    // =========================================================================

    async getDashboard(userId: string, query: DashboardQuery): Promise<DashboardStats> {
        const accounts = await personalFinanceRepository.findAccountsByUser(userId, false);
        const totalBalance = await personalFinanceRepository.getTotalBalance(userId);
        const periodStats = await personalFinanceRepository.getIncomeExpenseSummary(
            userId,
            query.startDate,
            query.endDate
        );

        return {
            totalBalance,
            accountBalances: accounts.map(a => ({
                id: a.id,
                name: a.name,
                type: a.type,
                currency: a.currency,
                balance: a.balance.toNumber(),
            })),
            periodStats: {
                ...periodStats,
                netCashflow: periodStats.totalIncome - periodStats.totalExpense,
            },
        };
    }

    async getCategoryBreakdown(userId: string, query: CategoryBreakdownQuery) {
        const type = query.type as PersonalCategoryType || 'EXPENSE';
        return personalFinanceRepository.getCategoryBreakdown(
            userId,
            type,
            query.startDate,
            query.endDate,
            query.accountId
        );
    }

    // =========================================================================
    // REPORTS
    // =========================================================================

    async createReport(userId: string, input: CreateReportInput) {
        const report = await personalFinanceRepository.createReport({
            userId,
            type: input.type as PersonalReportType,
            format: input.format as ReportFormat,
            parameters: {
                startDate: input.startDate,
                endDate: input.endDate,
                accountId: input.accountId,
            },
        });

        // Queue background job for report generation
        await personalFinanceReportQueue.add('generate-report', {
            reportId: report.id,
            userId,
            type: input.type,
            format: input.format,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
            accountId: input.accountId,
        });

        return report;
    }

    async listReports(userId: string, query: ListReportsQuery) {
        const skip = (query.page - 1) * query.limit;

        const { data, total } = await personalFinanceRepository.findReportsByUser(userId, {
            status: query.status as any,
            skip,
            take: query.limit,
        });

        return paginatedResponse(data, total, query.page, query.limit);
    }

    async getReportDownloadUrl(userId: string, reportId: string) {
        const report = await personalFinanceRepository.findReportById(reportId, userId);
        if (!report) {
            throw new NotFoundError('Report not found');
        }

        if (report.status !== 'COMPLETED') {
            throw new BadRequestError('Report is not ready for download');
        }

        if (!report.fileUrl) {
            throw new BadRequestError('Report file not available');
        }

        // Return the signed URL (already generated in worker)
        return { downloadUrl: report.fileUrl };
    }
}

export const personalFinanceService = new PersonalFinanceService();
export default personalFinanceService;