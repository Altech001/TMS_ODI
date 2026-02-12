import type {
    PersonalAccountType,
    PersonalCategoryType,
    PersonalTransactionType,
    PersonalReportType,
    ReportFormat,
    ReportStatus,
    Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../libs/prisma.js';
import { v4 as uuidv4 } from 'uuid'; 

// ============================================================================
// ACCOUNTS
// ============================================================================

export class PersonalFinanceRepository {
    
    // --- HELPER: Generate Voucher Number ---
    // Generates a human-readable ID like INC-000123, TRF-000456
    private async generateVoucherNumber(userId: string, type: PersonalTransactionType): Promise<string> {
        const count = await prisma.personalTransaction.count({
            where: { userId, type }
        });
        const prefix = type === 'INCOME' ? 'INC' : type === 'EXPENSE' ? 'EXP' : 'TRF';
        // Pad with zeros to 6 digits
        return `${prefix}-${(count + 1).toString().padStart(6, '0')}`;
    }

    // --- ACCOUNTS ---
    async createAccount(data: {
        userId: string;
        name: string;
        type: PersonalAccountType;
        currency: string;
        balance?: number;
    }) {
        return prisma.personalAccount.create({
            data: {
                userId: data.userId,
                name: data.name,
                type: data.type,
                currency: data.currency,
                balance: data.balance ? new Decimal(data.balance) : new Decimal(0),
            },
        });
    }

    async findAccountById(id: string, userId: string) {
        return prisma.personalAccount.findFirst({
            where: { id, userId },
        });
    }

    async findAccountsByUser(userId: string, includeArchived = false) {
        return prisma.personalAccount.findMany({
            where: {
                userId,
                ...(includeArchived ? {} : { isArchived: false }),
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async updateAccount(id: string, userId: string, data: {
        name?: string;
        currency?: string;
    }) {
        return prisma.personalAccount.update({
            where: { id, userId },
            data,
        });
    }

    async archiveAccount(id: string, userId: string) {
        return prisma.personalAccount.update({
            where: { id, userId },
            data: { isArchived: true },
        });
    }

    async getTotalBalance(userId: string) {
        const result = await prisma.personalAccount.aggregate({
            where: { userId, isArchived: false },
            _sum: { balance: true },
        });
        return result._sum.balance?.toNumber() ?? 0;
    }

    // --- CATEGORIES ---
    async createCategory(data: {
        userId: string;
        name: string;
        type: PersonalCategoryType;
        icon?: string;
        color?: string;
    }) {
        return prisma.personalCategory.create({
            data: {
                userId: data.userId,
                name: data.name,
                type: data.type,
                icon: data.icon,
                color: data.color,
                isSystem: false,
            },
        });
    }

    async findCategoryById(id: string, userId: string) {
        return prisma.personalCategory.findFirst({
            where: {
                id,
                OR: [{ userId }, { isSystem: true }],
            },
        });
    }

    async findCategoriesByUser(userId: string, type?: PersonalCategoryType) {
        return prisma.personalCategory.findMany({
            where: {
                OR: [{ userId }, { isSystem: true }],
                ...(type ? { type } : {}),
            },
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        });
    }

    async updateCategory(id: string, userId: string, data: {
        name?: string;
        icon?: string;
        color?: string;
    }) {
        return prisma.personalCategory.update({
            where: { id, userId },
            data,
        });
    }

    async deleteCategory(id: string, userId: string) {
        return prisma.personalCategory.delete({
            where: { id, userId },
        });
    }

    // --- TRANSACTIONS ---
    async createTransaction(
        data: {
            userId: string;
            accountId: string;
            toAccountId?: string;
            categoryId?: string;
            type: PersonalTransactionType;
            amount: number;
            currency: string;
            note?: string;
            reference?: string;
            transactionAt?: Date;
        },
        updateBalance: boolean = true
    ) {
        return prisma.$transaction(async (tx) => {
            // Generate Voucher Number
            const voucherNumber = await this.generateVoucherNumber(data.userId, data.type);

            // Create the transaction
            const transaction = await tx.personalTransaction.create({
                data: {
                    userId: data.userId,
                    accountId: data.accountId,
                    toAccountId: data.toAccountId,
                    categoryId: data.categoryId,
                    type: data.type,
                    amount: new Decimal(data.amount),
                    currency: data.currency,
                    note: data.note,
                    reference: data.reference,
                    voucherNumber: voucherNumber,
                    transactionAt: data.transactionAt || new Date(),
                },
                include: {
                    account: { select: { name: true, type: true } },
                    toAccount: { select: { name: true, type: true } },
                    category: { select: { name: true, type: true, icon: true, color: true } },
                },
            });

            // Update account balance
            if (updateBalance) {
                if (data.type === 'INCOME') {
                    await tx.personalAccount.update({
                        where: { id: data.accountId },
                        data: { balance: { increment: data.amount } },
                    });
                } else if (data.type === 'EXPENSE') {
                    await tx.personalAccount.update({
                        where: { id: data.accountId },
                        data: { balance: { decrement: data.amount } },
                    });
                }
            }

            return transaction;
        });
    }

    async createTransfer(data: {
        userId: string;
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        toAmount?: number;     // New: Optional specific amount receiving
        exchangeRate?: number; // New: Optional explicit rate
        note?: string;
        reference?: string;
        transactionAt?: Date;
    }) {
        return prisma.$transaction(async (tx) => {
            const timestamp = data.transactionAt || new Date();
            const transferGroupId = uuidv4(); // Unique ID to link Debit and Credit sides
            const voucherNumber = await this.generateVoucherNumber(data.userId, 'TRANSFER');

            // Get source account
            const fromAccount = await tx.personalAccount.findUnique({
                where: { id: data.fromAccountId },
            });
            if (!fromAccount) throw new Error('Source account not found');
            if (fromAccount.balance.lessThan(data.amount)) throw new Error('Insufficient balance');

            // Get destination account
            const toAccount = await tx.personalAccount.findUnique({
                where: { id: data.toAccountId },
            });
            if (!toAccount) throw new Error('Destination account not found');

            // --- Multi-Currency Logic ---
            let creditAmount = new Decimal(data.amount);
            let exchangeRate = new Decimal(1);

            if (fromAccount.currency !== toAccount.currency) {
                if (data.toAmount) {
                    creditAmount = new Decimal(data.toAmount);
                    // Rate = To / From
                    exchangeRate = creditAmount.div(data.amount);
                } else if (data.exchangeRate) {
                    exchangeRate = new Decimal(data.exchangeRate);
                    // To = From * Rate
                    creditAmount = new Decimal(data.amount).mul(exchangeRate);
                } else {
                    throw new Error('Exchange rate or destination amount required for multi-currency transfer');
                }
            }

            // Create DEBIT transaction (From Source) - Money Leaving
            const debitTx = await tx.personalTransaction.create({
                data: {
                    userId: data.userId,
                    accountId: data.fromAccountId,
                    toAccountId: data.toAccountId,
                    type: 'TRANSFER',
                    amount: new Decimal(data.amount),
                    currency: fromAccount.currency,
                    exchangeRate: exchangeRate,
                    transferGroupId: transferGroupId,
                    voucherNumber: `${voucherNumber}-DR`, // e.g. TRF-001-DR
                    note: data.note,
                    reference: data.reference,
                    transactionAt: timestamp,
                },
                include: {
                    account: { select: { name: true, type: true } },
                    toAccount: { select: { name: true, type: true } },
                },
            });

            // Create CREDIT transaction (To Destination) - Money Entering
            const creditTx = await tx.personalTransaction.create({
                data: {
                    userId: data.userId,
                    accountId: data.toAccountId,
                    toAccountId: data.fromAccountId,
                    type: 'TRANSFER',
                    amount: creditAmount,
                    currency: toAccount.currency,
                    exchangeRate: exchangeRate,
                    transferGroupId: transferGroupId,
                    voucherNumber: `${voucherNumber}-CR`, // e.g. TRF-001-CR
                    note: data.note,
                    reference: data.reference,
                    transactionAt: timestamp,
                },
                include: {
                    account: { select: { name: true, type: true } },
                    toAccount: { select: { name: true, type: true } },
                },
            });

            // Update balances atomically
            await tx.personalAccount.update({
                where: { id: data.fromAccountId },
                data: { balance: { decrement: data.amount } },
            });

            await tx.personalAccount.update({
                where: { id: data.toAccountId },
                data: { balance: { increment: creditAmount } },
            });

            return { debitTx, creditTx };
        });
    }

    async findTransactionById(id: string, userId: string) {
        return prisma.personalTransaction.findFirst({
            where: { id, userId, deletedAt: null },
            include: {
                account: { select: { name: true, type: true } },
                toAccount: { select: { name: true, type: true } },
                category: { select: { name: true, type: true, icon: true, color: true } },
            },
        });
    }

    // --- RECONCILIATION ---
    async toggleReconciliation(transactionId: string, userId: string, isReconciled: boolean) {
        return prisma.personalTransaction.update({
            where: { id: transactionId, userId },
            data: { 
                isReconciled,
                reconciledAt: isReconciled ? new Date() : null
            }
        });
    }

    async findTransactions(
        userId: string,
        options: {
            accountId?: string;
            categoryId?: string;
            type?: PersonalTransactionType;
            startDate?: Date;
            endDate?: Date;
            minAmount?: number;
            maxAmount?: number;
            isReconciled?: boolean; // New filter
            skip: number;
            take: number;
        }
    ) {
        const where: Prisma.PersonalTransactionWhereInput = {
            userId,
            deletedAt: null,
            ...(options.accountId && { accountId: options.accountId }),
            ...(options.categoryId && { categoryId: options.categoryId }),
            ...(options.type && { type: options.type }),
            ...(options.startDate && { transactionAt: { gte: options.startDate } }),
            ...(options.endDate && { transactionAt: { lte: options.endDate } }),
            ...(options.minAmount && { amount: { gte: options.minAmount } }),
            ...(options.maxAmount && { amount: { lte: options.maxAmount } }),
            ...(options.isReconciled !== undefined && { isReconciled: options.isReconciled }),
        };

        const [data, total] = await Promise.all([
            prisma.personalTransaction.findMany({
                where,
                include: {
                    account: { select: { name: true, type: true } },
                    toAccount: { select: { name: true, type: true } },
                    category: { select: { name: true, type: true, icon: true, color: true } },
                },
                orderBy: { transactionAt: 'desc' },
                skip: options.skip,
                take: options.take,
            }),
            prisma.personalTransaction.count({ where }),
        ]);

        return { data, total };
    }

    // --- LEDGER LOGIC (Opening Balance) ---
    /**
     * Calculates the Opening Balance for a specific account at a specific date.
     * Logic: Current Balance - (Sum of all movements AFTER the start date)
     */
    async calculateOpeningBalance(userId: string, accountId: string, date: Date): Promise<number> {
        // 1. Get current balance from account snapshot
        const account = await prisma.personalAccount.findUnique({ where: { id: accountId } });
        const currentBalance = account?.balance.toNumber() ?? 0;
        
        // 2. Calculate sum of all movements from `date` until NOW
        const movementsAfterDate = await this.calculateMovementsInPeriod(
            userId, 
            accountId, 
            date, 
            new Date(2100, 0, 1) // Effectively "the end of time"
        );
        
        // 3. Opening Balance = Current - Future Movements
        return currentBalance - movementsAfterDate;
    }

    /**
     * Helper to sum up money flow for an account in a period
     */
    async calculateMovementsInPeriod(userId: string, accountId: string, start: Date, end: Date): Promise<number> {
        const txs = await prisma.personalTransaction.findMany({
            where: {
                userId,
                accountId, // Only transactions affecting this account
                transactionAt: { gte: start, lte: end },
                deletedAt: null
            },
            select: { type: true, amount: true, voucherNumber: true }
        });

        let movement = 0;
        for (const t of txs) {
            const amt = t.amount.toNumber();
            if (t.type === 'INCOME') {
                movement += amt;
            } else if (t.type === 'EXPENSE') {
                movement -= amt;
            } else if (t.type === 'TRANSFER') {
                // Check if this specific row is a Credit (In) or Debit (Out)
                // We use the Voucher suffix we generated: -CR (Credit/In), -DR (Debit/Out)
                if (t.voucherNumber?.endsWith('-CR')) {
                    movement += amt;
                } else {
                    movement -= amt;
                }
            }
        }
        return movement;
    }

    async updateTransaction(id: string, userId: string, data: {
        categoryId?: string | null;
        amount?: number;
        note?: string | null;
        reference?: string | null;
        transactionAt?: Date;
    }) {
        // Get original transaction for balance adjustment
        const original = await prisma.personalTransaction.findFirst({
            where: { id, userId, deletedAt: null },
        });

        if (!original) {
            throw new Error('Transaction not found');
        }

        // Transfers cannot be edited
        if (original.type === 'TRANSFER') {
            throw new Error('Transfers cannot be edited');
        }

        return prisma.$transaction(async (tx) => {
            const updateData: Prisma.PersonalTransactionUpdateInput = {};

            if (data.categoryId !== undefined) {
                updateData.category = data.categoryId
                    ? { connect: { id: data.categoryId } }
                    : { disconnect: true };
            }
            if (data.note !== undefined) updateData.note = data.note;
            if (data.reference !== undefined) updateData.reference = data.reference;
            if (data.transactionAt !== undefined) updateData.transactionAt = data.transactionAt;

            // Handle amount change with balance adjustment
            if (data.amount !== undefined && data.amount !== original.amount.toNumber()) {
                const diff = data.amount - original.amount.toNumber();
                updateData.amount = new Decimal(data.amount);

                if (original.type === 'INCOME') {
                    await tx.personalAccount.update({
                        where: { id: original.accountId },
                        data: { balance: { increment: diff } },
                    });
                } else if (original.type === 'EXPENSE') {
                    await tx.personalAccount.update({
                        where: { id: original.accountId },
                        data: { balance: { decrement: diff } },
                    });
                }
            }

            return tx.personalTransaction.update({
                where: { id },
                data: updateData,
                include: {
                    account: { select: { name: true, type: true } },
                    category: { select: { name: true, type: true, icon: true, color: true } },
                },
            });
        });
    }

    async softDeleteTransaction(id: string, userId: string) {
        const transaction = await prisma.personalTransaction.findFirst({
            where: { id, userId, deletedAt: null },
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Transfers cannot be deleted
        if (transaction.type === 'TRANSFER') {
            throw new Error('Transfers cannot be deleted');
        }

        return prisma.$transaction(async (tx) => {
            // Reverse the balance change
            if (transaction.type === 'INCOME') {
                await tx.personalAccount.update({
                    where: { id: transaction.accountId },
                    data: { balance: { decrement: transaction.amount } },
                });
            } else if (transaction.type === 'EXPENSE') {
                await tx.personalAccount.update({
                    where: { id: transaction.accountId },
                    data: { balance: { increment: transaction.amount } },
                });
            }

            return tx.personalTransaction.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
        });
    }

    // --- AUDIT LOGS ---
    async createAuditLog(data: {
        userId: string;
        transactionId?: string;
        entityType: string;
        entityId: string;
        action: string;
        previousData?: object;
        newData?: object;
    }) {
        return prisma.personalFinanceAuditLog.create({
            data: {
                userId: data.userId,
                transactionId: data.transactionId,
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                previousData: data.previousData as Prisma.InputJsonValue,
                newData: data.newData as Prisma.InputJsonValue,
            },
        });
    }

    // --- REPORTS ---
    async createReport(data: {
        userId: string;
        type: PersonalReportType;
        format: ReportFormat;
        parameters: object;
    }) {
        return prisma.personalFinanceReport.create({
            data: {
                userId: data.userId,
                type: data.type,
                format: data.format,
                parameters: data.parameters as Prisma.InputJsonValue,
            },
        });
    }

    async findReportById(id: string, userId: string) {
        return prisma.personalFinanceReport.findFirst({
            where: { id, userId },
        });
    }

    async findReportsByUser(userId: string, options: {
        status?: ReportStatus;
        skip: number;
        take: number;
    }) {
        const where: Prisma.PersonalFinanceReportWhereInput = {
            userId,
            ...(options.status && { status: options.status }),
        };

        const [data, total] = await Promise.all([
            prisma.personalFinanceReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: options.skip,
                take: options.take,
            }),
            prisma.personalFinanceReport.count({ where }),
        ]);

        return { data, total };
    }

    async updateReportStatus(id: string, data: {
        status: ReportStatus;
        fileUrl?: string;
        fileKey?: string;
        expiresAt?: Date;
        errorMessage?: string;
        completedAt?: Date;
    }) {
        return prisma.personalFinanceReport.update({
            where: { id },
            data,
        });
    }

    // --- ANALYTICS ---
    async getIncomeExpenseSummary(userId: string, startDate?: Date, endDate?: Date) {
        const where: Prisma.PersonalTransactionWhereInput = {
            userId,
            deletedAt: null,
            ...(startDate && { transactionAt: { gte: startDate } }),
            ...(endDate && { transactionAt: { lte: endDate } }),
        };

        const [income, expense, count] = await Promise.all([
            prisma.personalTransaction.aggregate({
                where: { ...where, type: 'INCOME' },
                _sum: { amount: true },
            }),
            prisma.personalTransaction.aggregate({
                where: { ...where, type: 'EXPENSE' },
                _sum: { amount: true },
            }),
            prisma.personalTransaction.count({ where }),
        ]);

        return {
            totalIncome: income._sum.amount?.toNumber() ?? 0,
            totalExpense: expense._sum.amount?.toNumber() ?? 0,
            transactionCount: count,
        };
    }

    async getCategoryBreakdown(
        userId: string,
        type: PersonalCategoryType,
        startDate: Date,
        endDate: Date,
        accountId?: string
    ) {
        const transactionType = type === 'INCOME' ? 'INCOME' : 'EXPENSE';

        const result = await prisma.personalTransaction.groupBy({
            by: ['categoryId'],
            where: {
                userId,
                type: transactionType,
                deletedAt: null,
                transactionAt: { gte: startDate, lte: endDate },
                ...(accountId && { accountId }),
            },
            _sum: { amount: true },
            _count: true,
        });

        // Get category details
        const categoryIds = result.map(r => r.categoryId).filter(Boolean) as string[];
        const categories = await prisma.personalCategory.findMany({
            where: { id: { in: categoryIds } },
        });

        const categoryMap = new Map(categories.map(c => [c.id, c]));
        const total = result.reduce((sum, r) => sum + (r._sum.amount?.toNumber() ?? 0), 0);

        return result.map(r => {
            const category = r.categoryId ? categoryMap.get(r.categoryId) : null;
            const amount = r._sum.amount?.toNumber() ?? 0;
            return {
                categoryId: r.categoryId ?? 'uncategorized',
                categoryName: category?.name ?? 'Uncategorized',
                icon: category?.icon ?? null,
                color: category?.color ?? null,
                total: amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                transactionCount: r._count,
            };
        });
    }
}

export const personalFinanceRepository = new PersonalFinanceRepository();
export default personalFinanceRepository;