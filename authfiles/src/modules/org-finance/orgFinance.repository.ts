import type { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../libs/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import type {
    CreateAccountInput,
    UpdateAccountInput,
    CreateEntryInput,
    UpdateEntryInput,
    ListEntriesQuery,
    ListDeleteRequestsQuery,
    ListAuditLogsQuery,
    ListReportsQuery,
    CreateTransferInput,
    CreateCashbookInput,
    UpdateCashbookInput,
    CreateContactInput,
    UpdateContactInput,
    ListContactsQuery,
} from './orgFinance.dto.js';

export class OrgFinanceRepository {
    
    // =========================================================================
    // HELPER: VOUCHER NUMBERING
    // =========================================================================
    
    private async generateVoucherNumber(organizationId: string, type: string): Promise<string> {
        // Count entries of this type in this org to create sequential ID
        const count = await prisma.orgFinanceLedgerEntry.count({
            where: { organizationId, type: type as any }
        });
        
        let prefix = 'J';
        if (type === 'INFLOW') prefix = 'R';
        if (type === 'OUTFLOW') prefix = 'P';
        
        return `${prefix}-${(count + 1).toString().padStart(6, '0')}`;
    }

    // =========================================================================
    // CASHBOOKS (CONTAINERS)
    // =========================================================================

    async createCashbook(organizationId: string, input: CreateCashbookInput) {
        return prisma.orgCashbook.create({
            data: {
                organizationId,
                name: input.name,
                description: input.description,
                currency: input.currency,
                allowBackdated: input.allowBackdated,
                allowOmitted: input.allowOmitted,
                lockDate: input.lockDate,
            }
        });
    }

    async findCashbooks(organizationId: string) {
        return prisma.orgCashbook.findMany({
            where: { organizationId },
            include: {
                _count: { select: { accounts: true, members: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async findCashbookById(organizationId: string, cashbookId: string) {
        return prisma.orgCashbook.findFirst({
            where: { id: cashbookId, organizationId }
        });
    }

    async updateCashbook(_organizationId: string, cashbookId: string, data: UpdateCashbookInput) {
        return prisma.orgCashbook.update({
            where: { id: cashbookId }, // Prisma checks ID uniqueness globally
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.allowBackdated !== undefined && { allowBackdated: data.allowBackdated }),
                ...(data.allowOmitted !== undefined && { allowOmitted: data.allowOmitted }),
                ...(data.lockDate !== undefined && { lockDate: data.lockDate }),
            }
        });
    }

    async deleteCashbook(organizationId: string, cashbookId: string) {
        return prisma.orgCashbook.delete({
            where: { id: cashbookId, organizationId }
        });
    }

    // =========================================================================
    // CASHBOOK MEMBERS
    // =========================================================================

    async addCashbookMember(cashbookId: string, userId: string, role: 'VIEWER' | 'EDITOR' | 'APPROVER') {
        return prisma.orgCashbookMember.upsert({
            where: { cashbookId_userId: { cashbookId, userId } },
            update: { role },
            create: { cashbookId, userId, role }
        });
    }

    async removeCashbookMember(cashbookId: string, userId: string) {
        return prisma.orgCashbookMember.delete({
            where: { cashbookId_userId: { cashbookId, userId } }
        });
    }

    async findCashbookMembers(cashbookId: string) {
        return prisma.orgCashbookMember.findMany({
            where: { cashbookId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { assignedAt: 'asc' }
        });
    }

    async getCashbookMemberRole(cashbookId: string, userId: string) {
        const member = await prisma.orgCashbookMember.findUnique({
            where: { cashbookId_userId: { cashbookId, userId } },
            select: { role: true }
        });
        return member?.role || null;
    }

    // =========================================================================
    // CONTACTS
    // =========================================================================

    async createContact(organizationId: string, input: CreateContactInput) {
        return prisma.orgContact.create({
            data: {
                organizationId,
                name: input.name,
                type: input.type,
                phone: input.phone,
                email: input.email,
                taxId: input.taxId
            }
        });
    }

    async updateContact(_organizationId: string, contactId: string, input: UpdateContactInput) {
        return prisma.orgContact.update({
            where: { id: contactId },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.type && { type: input.type }),
                ...(input.phone !== undefined && { phone: input.phone }),
                ...(input.email !== undefined && { email: input.email }),
                ...(input.taxId !== undefined && { taxId: input.taxId }),
            }
        });
    }

    async findContacts(organizationId: string, query: ListContactsQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.OrgContactWhereInput = {
            organizationId,
            ...(query.type && { type: query.type }),
            ...(query.search && { name: { contains: query.search, mode: 'insensitive' } })
        };

        const [data, total] = await Promise.all([
            prisma.orgContact.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.orgContact.count({ where })
        ]);

        return { data, total, page, limit };
    }

    async findContactById(organizationId: string, contactId: string) {
        return prisma.orgContact.findFirst({
            where: { id: contactId, organizationId }
        });
    }

    // =========================================================================
    // ACCOUNTS
    // =========================================================================

    async createAccount(organizationId: string, input: CreateAccountInput) {
        return prisma.orgFinanceAccount.create({
            data: {
                organizationId,
                cashbookId: input.cashbookId, // Link to Cashbook
                name: input.name,
                type: input.type,
                currency: input.currency ?? 'USD',
                description: input.description,
            },
        });
    }

    async findAccounts(organizationId: string, cashbookId?: string, includeArchived = false) {
        return prisma.orgFinanceAccount.findMany({
            where: {
                organizationId,
                ...(cashbookId && { cashbookId }),
                ...(includeArchived ? {} : { isArchived: false }),
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findAccountById(organizationId: string, accountId: string) {
        return prisma.orgFinanceAccount.findFirst({
            where: { id: accountId, organizationId },
            include: { cashbook: true } // Include parent cashbook for permission checks
        });
    }

    async updateAccount(_organizationId: string, accountId: string, data: UpdateAccountInput) {
        return prisma.orgFinanceAccount.update({
            where: { id: accountId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.currency !== undefined && { currency: data.currency }),
            },
        });
    }

    async archiveAccount(accountId: string) {
        return prisma.orgFinanceAccount.update({
            where: { id: accountId },
            data: { isArchived: true },
        });
    }

    // =========================================================================
    // BALANCE COMPUTATION (Ledger-Derived)
    // =========================================================================

    async computeAccountBalance(accountId: string): Promise<string> {
        const result = await prisma.orgFinanceLedgerEntry.groupBy({
            by: ['type'],
            where: {
                accountId,
                status: 'ACTIVE', 
            },
            _sum: { amount: true },
        });

        let balance = new Decimal(0);
        for (const row of result) {
            const sum = row._sum.amount ?? new Decimal(0);
            if (row.type === 'INFLOW' || row.type === 'ADJUSTMENT') {
                balance = balance.plus(sum);
            } else if (row.type === 'OUTFLOW') {
                balance = balance.minus(sum);
            }
        }
        return balance.toFixed(2);
    }

    // =========================================================================
    // LEDGER ENTRIES
    // =========================================================================

    async createEntry(
        organizationId: string,
        userId: string,
        input: CreateEntryInput,
        idempotencyKey?: string
    ) {
        return prisma.$transaction(async (tx) => {
            if (idempotencyKey) {
                const existing = await tx.orgFinanceLedgerEntry.findUnique({
                    where: { idempotencyKey },
                });
                if (existing) return existing;
            }

            const account = await tx.orgFinanceAccount.findFirst({
                where: { id: input.accountId, organizationId, isArchived: false },
            });
            if (!account) throw new Error('Account not found or archived');

            const voucherNumber = await this.generateVoucherNumber(organizationId, input.type);

            // Create Entry with Attachments
            const entry = await tx.orgFinanceLedgerEntry.create({
                data: {
                    organizationId,
                    accountId: input.accountId,
                    createdById: userId,
                    contactId: input.contactId, // Link Contact
                    type: input.type,
                    entryCategory: input.entryCategory ?? 'NORMAL',
                    amount: input.amount,
                    currency: input.currency ?? 'USD',
                    description: input.description,
                    reference: input.reference,
                    reason: input.reason,
                    transactionDate: input.transactionDate,
                    idempotencyKey,
                    voucherNumber,
                    // Map Attachments
                    attachments: input.attachments ? {
                        create: input.attachments.map(att => ({
                            fileKey: att.fileKey,
                            fileName: att.fileName,
                            fileType: att.fileType,
                            fileSize: att.fileSize
                        }))
                    } : undefined
                },
                include: {
                    account: { select: { name: true, type: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    contact: { select: { name: true, type: true } },
                    attachments: true
                },
            });

            await tx.orgFinanceAuditLog.create({
                data: {
                    organizationId,
                    userId,
                    entryId: entry.id,
                    entityType: 'LEDGER_ENTRY',
                    entityId: entry.id,
                    action: 'CREATE',
                    newData: entry as unknown as Prisma.InputJsonValue,
                },
            });

            return entry;
        });
    }

    async createTransfer(organizationId: string, userId: string, input: CreateTransferInput) {
        return prisma.$transaction(async (tx) => {
            const transferGroupId = uuidv4();
            const voucherNumber = await this.generateVoucherNumber(organizationId, 'OUTFLOW'); 

            // 1. Get Accounts
            const fromAccount = await tx.orgFinanceAccount.findFirst({ where: { id: input.fromAccountId, organizationId }});
            const toAccount = await tx.orgFinanceAccount.findFirst({ where: { id: input.toAccountId, organizationId }});
            
            if (!fromAccount || !toAccount) throw new Error("Accounts not found in this organization");

            // 2. Handle Multi-Currency
            let creditAmount = new Decimal(input.amount);
            let exchangeRate = new Decimal(1);

            if (fromAccount.currency !== toAccount.currency) {
                if (input.toAmount) {
                    creditAmount = new Decimal(input.toAmount);
                    exchangeRate = creditAmount.div(input.amount);
                } else if (input.exchangeRate) {
                    exchangeRate = new Decimal(input.exchangeRate);
                    creditAmount = new Decimal(input.amount).mul(exchangeRate);
                } else {
                    throw new Error("Multi-currency transfer requires exchangeRate or toAmount");
                }
            }

            // 3. Debit (Outflow)
            const debit = await tx.orgFinanceLedgerEntry.create({
                data: {
                    organizationId,
                    accountId: input.fromAccountId,
                    createdById: userId,
                    type: 'OUTFLOW',
                    entryCategory: 'NORMAL',
                    amount: input.amount,
                    currency: fromAccount.currency,
                    description: `Transfer to ${toAccount.name}: ${input.description}`,
                    reference: input.reference,
                    transactionDate: input.transactionDate,
                    transferGroupId,
                    voucherNumber: `${voucherNumber}-DR`,
                    exchangeRate,
                }
            });

            // 4. Credit (Inflow)
            const credit = await tx.orgFinanceLedgerEntry.create({
                data: {
                    organizationId,
                    accountId: input.toAccountId,
                    createdById: userId,
                    type: 'INFLOW',
                    entryCategory: 'NORMAL',
                    amount: creditAmount,
                    currency: toAccount.currency,
                    description: `Transfer from ${fromAccount.name}: ${input.description}`,
                    reference: input.reference,
                    transactionDate: input.transactionDate,
                    transferGroupId,
                    voucherNumber: `${voucherNumber}-CR`,
                    exchangeRate,
                }
            });

            return { debit, credit };
        });
    }

    async findEntries(organizationId: string, query: ListEntriesQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.OrgFinanceLedgerEntryWhereInput = {
            organizationId,
            ...(query.cashbookId && { account: { cashbookId: query.cashbookId } }), // Filter by Cashbook
            ...(query.accountId && { accountId: query.accountId }),
            ...(query.contactId && { contactId: query.contactId }), // Filter by Contact
            ...(query.type && { type: query.type }),
            ...(query.entryCategory && { entryCategory: query.entryCategory }),
            ...(query.status ? { status: query.status } : { status: { not: 'DELETED' } }),
            ...(query.createdById && { createdById: query.createdById }),
            ...(query.isReconciled !== undefined && { isReconciled: query.isReconciled }),
            ...(query.startDate || query.endDate ? {
                transactionDate: {
                    ...(query.startDate && { gte: query.startDate }),
                    ...(query.endDate && { lte: query.endDate }),
                },
            } : {}),
            ...(query.minAmount !== undefined || query.maxAmount !== undefined ? {
                amount: {
                    ...(query.minAmount !== undefined && { gte: query.minAmount }),
                    ...(query.maxAmount !== undefined && { lte: query.maxAmount }),
                },
            } : {}),
        };

        const [data, total] = await Promise.all([
            prisma.orgFinanceLedgerEntry.findMany({
                where,
                skip,
                take: limit,
                orderBy: { transactionDate: 'desc' },
                include: {
                    account: { select: { name: true, type: true } },
                    contact: { select: { name: true, type: true } }, // Include contact name
                    createdBy: { select: { id: true, name: true, email: true } },
                    lastEditedBy: { select: { id: true, name: true, email: true } },
                    attachments: true // Include attachment URLs
                },
            }),
            prisma.orgFinanceLedgerEntry.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    // --- SMART LEDGER: OPENING BALANCE ---
    async calculateOpeningBalance(organizationId: string, accountId: string, date: Date): Promise<number> {
        const currentBalanceStr = await this.computeAccountBalance(accountId);
        const currentBalance = parseFloat(currentBalanceStr);

        const movements = await prisma.orgFinanceLedgerEntry.findMany({
            where: {
                organizationId,
                accountId,
                status: 'ACTIVE',
                transactionDate: { gte: date }
            },
            select: { type: true, amount: true }
        });

        let movementSum = 0;
        for (const m of movements) {
            const val = m.amount.toNumber();
            if (m.type === 'INFLOW' || m.type === 'ADJUSTMENT') movementSum += val;
            else if (m.type === 'OUTFLOW') movementSum -= val;
        }

        return currentBalance - movementSum;
    }

    // --- RECONCILIATION ---
    async toggleReconciliation(organizationId: string, entryId: string, isReconciled: boolean) {
        return prisma.orgFinanceLedgerEntry.update({
            where: { id: entryId, organizationId },
            data: { isReconciled, reconciledAt: isReconciled ? new Date() : null }
        });
    }

    async findEntryById(organizationId: string, entryId: string) {
        return prisma.orgFinanceLedgerEntry.findFirst({
            where: { id: entryId, organizationId },
            include: {
                account: { select: { name: true, type: true } },
                contact: { select: { id: true, name: true, type: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                lastEditedBy: { select: { id: true, name: true, email: true } },
                attachments: true,
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });
    }

    async updateEntry(
        organizationId: string,
        entryId: string,
        userId: string,
        input: UpdateEntryInput,
        previousData: Record<string, unknown>
    ) {
        return prisma.$transaction(async (tx) => {
            const updated = await tx.orgFinanceLedgerEntry.update({
                where: { id: entryId },
                data: {
                    ...(input.description !== undefined && { description: input.description }),
                    ...(input.reference !== undefined && { reference: input.reference }),
                    ...(input.amount !== undefined && { amount: input.amount }),
                    ...(input.transactionDate !== undefined && { transactionDate: input.transactionDate }),
                    isEdited: true,
                    editReason: input.editReason,
                    lastEditedById: userId,
                    lastEditedAt: new Date(),
                },
                include: {
                    account: { select: { name: true, type: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    lastEditedBy: { select: { id: true, name: true, email: true } },
                },
            });

            await tx.orgFinanceAuditLog.create({
                data: {
                    organizationId,
                    userId,
                    entryId,
                    entityType: 'LEDGER_ENTRY',
                    entityId: entryId,
                    action: 'UPDATE',
                    previousData: previousData as Prisma.InputJsonValue,
                    newData: updated as unknown as Prisma.InputJsonValue,
                },
            });

            return updated;
        });
    }

    async createReversal(
        organizationId: string,
        userId: string,
        originalEntry: {
            id: string;
            accountId: string;
            type: string;
            amount: unknown;
            currency: string;
            description: string;
        },
        reason: string,
        reference?: string
    ) {
        // Flip the type
        const reversalType = originalEntry.type === 'INFLOW' ? 'OUTFLOW'
            : originalEntry.type === 'OUTFLOW' ? 'INFLOW'
                : 'OUTFLOW'; 

        const voucherNumber = await this.generateVoucherNumber(organizationId, reversalType);

        return prisma.$transaction(async (tx) => {
            const reversal = await tx.orgFinanceLedgerEntry.create({
                data: {
                    organizationId,
                    accountId: originalEntry.accountId,
                    createdById: userId,
                    type: reversalType as any,
                    entryCategory: 'NORMAL',
                    amount: Number(originalEntry.amount),
                    currency: originalEntry.currency,
                    description: `REVERSAL: ${originalEntry.description}`,
                    reference,
                    reason,
                    transactionDate: new Date(),
                    reversalOfId: originalEntry.id,
                    voucherNumber,
                },
                include: {
                    account: { select: { name: true, type: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                },
            });

            await tx.orgFinanceLedgerEntry.update({
                where: { id: originalEntry.id },
                data: {
                    status: 'REVERSED',
                    reversedById: reversal.id,
                },
            });

            await tx.orgFinanceAuditLog.create({
                data: {
                    organizationId,
                    userId,
                    entryId: reversal.id,
                    entityType: 'LEDGER_ENTRY',
                    entityId: reversal.id,
                    action: 'REVERSE',
                    previousData: { originalEntryId: originalEntry.id } as Prisma.InputJsonValue,
                    newData: reversal as unknown as Prisma.InputJsonValue,
                },
            });

            return reversal;
        });
    }

    // =========================================================================
    // DELETE REQUESTS
    // =========================================================================

    async createDeleteRequest(
        organizationId: string,
        entryId: string,
        userId: string,
        reason: string
    ) {
        return prisma.$transaction(async (tx) => {
            await tx.orgFinanceLedgerEntry.update({
                where: { id: entryId },
                data: { status: 'PENDING_DELETE_APPROVAL', deleteRequestedById: userId, deletedReason: reason },
            });

            const request = await tx.orgFinanceDeleteRequest.create({
                data: {
                    organizationId,
                    entryId,
                    requestedById: userId,
                    reason,
                },
                include: {
                    entry: { include: { account: true } },
                    requestedBy: { select: { id: true, name: true, email: true } },
                },
            });

            await tx.orgFinanceAuditLog.create({
                data: {
                    organizationId,
                    userId,
                    entryId,
                    entityType: 'DELETE_REQUEST',
                    entityId: request.id,
                    action: 'REQUEST_DELETE',
                    newData: { reason, entryId } as Prisma.InputJsonValue,
                },
            });

            return request;
        });
    }

    async findDeleteRequests(organizationId: string, query: ListDeleteRequestsQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: Prisma.OrgFinanceDeleteRequestWhereInput = {
            organizationId,
            ...(query.status && { status: query.status }),
            ...(query.cashbookId && { entry: { account: { cashbookId: query.cashbookId } } }), // Filter by Cashbook
        };

        const [data, total] = await Promise.all([
            prisma.orgFinanceDeleteRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    entry: {
                        include: {
                            account: { select: { name: true, type: true } },
                            createdBy: { select: { id: true, name: true, email: true } },
                        },
                    },
                    requestedBy: { select: { id: true, name: true, email: true } },
                    approvedBy: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.orgFinanceDeleteRequest.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async findDeleteRequestById(requestId: string) {
        return prisma.orgFinanceDeleteRequest.findUnique({
            where: { id: requestId },
            include: {
                entry: {
                    include: {
                        account: { select: { name: true, type: true, cashbookId: true } },
                        createdBy: { select: { id: true, name: true, email: true } },
                    },
                },
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async approveDeleteRequest(requestId: string, entryId: string, approvedById: string, organizationId: string) {
        return prisma.$transaction(async (tx) => {
            const request = await tx.orgFinanceDeleteRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    approvedById,
                    resolvedAt: new Date(),
                },
                include: {
                    entry: true,
                    requestedBy: { select: { id: true, name: true, email: true } },
                },
            });

            await tx.orgFinanceLedgerEntry.update({
                where: { id: entryId },
                data: {
                    status: 'DELETED',
                    approvedById,
                    approvedAt: new Date(),
                },
            });

            await tx.orgFinanceAuditLog.create({
                data: {
                    organizationId,
                    userId: approvedById,
                    entryId,
                    entityType: 'DELETE_REQUEST',
                    entityId: requestId,
                    action: 'APPROVE_DELETE',
                    newData: { requestId, entryId, approvedById } as Prisma.InputJsonValue,
                },
            });

            return request;
        });
    }

    async rejectDeleteRequest(
        requestId: string,
        entryId: string,
        rejectedById: string,
        organizationId: string,
        rejectionReason: string
    ) {
        return prisma.$transaction(async (tx) => {
            const request = await tx.orgFinanceDeleteRequest.update({
                where: { id: requestId },
                data: {
                    status: 'REJECTED',
                    approvedById: rejectedById, // stores who resolved it
                    rejectionReason,
                    resolvedAt: new Date(),
                },
                include: {
                    requestedBy: { select: { id: true, name: true, email: true } },
                },
            });

            await tx.orgFinanceLedgerEntry.update({
                where: { id: entryId },
                data: { status: 'ACTIVE' },
            });

            await tx.orgFinanceAuditLog.create({
                data: {
                    organizationId,
                    userId: rejectedById,
                    entryId,
                    entityType: 'DELETE_REQUEST',
                    entityId: requestId,
                    action: 'REJECT_DELETE',
                    newData: { requestId, rejectionReason } as Prisma.InputJsonValue,
                },
            });

            return request;
        });
    }

    // =========================================================================
    // DASHBOARD / ANALYTICS
    // =========================================================================

    async getInflowOutflowSummary(
        organizationId: string,
        startDate?: Date,
        endDate?: Date,
        accountId?: string
    ) {
        const where: Prisma.OrgFinanceLedgerEntryWhereInput = {
            organizationId,
            status: 'ACTIVE',
            ...(accountId && { accountId }),
            ...(startDate || endDate ? {
                transactionDate: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                },
            } : {}),
        };

        const result = await prisma.orgFinanceLedgerEntry.groupBy({
            by: ['type'],
            where,
            _sum: { amount: true },
        });

        let totalInflow = 0;
        let totalOutflow = 0;
        for (const row of result) {
            const sum = Number(row._sum.amount ?? 0);
            if (row.type === 'INFLOW') totalInflow += sum;
            else if (row.type === 'OUTFLOW') totalOutflow += sum;
        }

        return {
            totalInflow: totalInflow.toFixed(2),
            totalOutflow: totalOutflow.toFixed(2),
            netCashflow: (totalInflow - totalOutflow).toFixed(2),
        };
    }

    async getRecentEntries(organizationId: string, limit = 10) {
        return prisma.orgFinanceLedgerEntry.findMany({
            where: { organizationId, status: { not: 'DELETED' } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                account: { select: { name: true, type: true } },
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async getPendingDeleteRequestCount(organizationId: string) {
        return prisma.orgFinanceDeleteRequest.count({
            where: { organizationId, status: 'PENDING' },
        });
    }

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================

    async findAuditLogs(organizationId: string, query: ListAuditLogsQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.OrgFinanceAuditLogWhereInput = {
            organizationId,
            ...(query.entityType && { entityType: query.entityType }),
            ...(query.action && { action: query.action }),
            ...(query.entryId && { entryId: query.entryId }),
            ...(query.userId && { userId: query.userId }),
            ...(query.cashbookId && { entry: { account: { cashbookId: query.cashbookId } } }), // Filter by Cashbook
            ...(query.startDate || query.endDate ? {
                createdAt: {
                    ...(query.startDate && { gte: query.startDate }),
                    ...(query.endDate && { lte: query.endDate }),
                },
            } : {}),
        };

        const [data, total] = await Promise.all([
            prisma.orgFinanceAuditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.orgFinanceAuditLog.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async createAuditLog(data: {
        organizationId: string;
        userId: string;
        entryId?: string;
        entityType: string;
        entityId: string;
        action: string;
        previousData?: Record<string, unknown>;
        newData?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return prisma.orgFinanceAuditLog.create({
            data: {
                organizationId: data.organizationId,
                userId: data.userId,
                entryId: data.entryId,
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                previousData: data.previousData as Prisma.InputJsonValue,
                newData: data.newData as Prisma.InputJsonValue,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    }

    // =========================================================================
    // REPORTS
    // =========================================================================

    async createReport(data: {
        organizationId: string;
        userId: string;
        type: string;
        format: string;
        parameters: Record<string, unknown>;
    }) {
        return prisma.orgFinanceReport.create({
            data: {
                organizationId: data.organizationId,
                userId: data.userId,
                type: data.type as any,
                format: data.format as any,
                parameters: data.parameters as Prisma.InputJsonValue,
            },
        });
    }

    async findReports(organizationId: string, query: ListReportsQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: Prisma.OrgFinanceReportWhereInput = {
            organizationId,
            ...(query.status && { status: query.status }),
        };

        const [data, total] = await Promise.all([
            prisma.orgFinanceReport.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.orgFinanceReport.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async findReportById(reportId: string) {
        return prisma.orgFinanceReport.findUnique({
            where: { id: reportId },
        });
    }

    async updateReportStatus(
        reportId: string,
        status: string,
        extra?: { fileUrl?: string; fileKey?: string; expiresAt?: Date; errorMessage?: string }
    ) {
        return prisma.orgFinanceReport.update({
            where: { id: reportId },
            data: {
                status: status as any,
                ...(status === 'COMPLETED' && { completedAt: new Date() }),
                ...(extra?.fileUrl && { fileUrl: extra.fileUrl }),
                ...(extra?.fileKey && { fileKey: extra.fileKey }),
                ...(extra?.expiresAt && { expiresAt: extra.expiresAt }),
                ...(extra?.errorMessage && { errorMessage: extra.errorMessage }),
            },
        });
    }

    // =========================================================================
    // ORG OWNER LOOKUP
    // =========================================================================

    async getOrganizationOwnerId(organizationId: string): Promise<string | null> {
        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { ownerId: true },
        });
        return org?.ownerId ?? null;
    }

    async getOrganizationAdminsAndOwner(organizationId: string) {
        const members = await prisma.organizationMember.findMany({
            where: {
                organizationId,
                role: { in: ['OWNER', 'ADMIN'] },
            },
            select: {
                userId: true,
                role: true,
                user: { select: { id: true, name: true, email: true } },
            },
        });
        return members;
    }
}

export const orgFinanceRepository = new OrgFinanceRepository();
export default orgFinanceRepository;