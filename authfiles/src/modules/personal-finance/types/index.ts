import type {
    PersonalAccountType,
    PersonalCategoryType,
    PersonalTransactionType,
    PersonalReportType,
    ReportFormat,
    ReportStatus,
} from '@prisma/client';

export interface AccountWithBalance {
    id: string;
    userId: string;
    name: string;
    type: PersonalAccountType;
    currency: string;
    balance: number;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CategoryWithUsage extends Category {
    transactionCount?: number;
}

export interface Category {
    id: string;
    userId: string | null;
    name: string;
    type: PersonalCategoryType;
    icon: string | null;
    color: string | null;
    isSystem: boolean;
    createdAt: Date;
}


export interface TransactionWithDetails {
    id: string;
    userId: string;
    accountId: string;
    toAccountId: string | null;
    categoryId: string | null;
    type: PersonalTransactionType;
    amount: number;
    currency: string;
    // New Fields
    exchangeRate: number | null;
    isReconciled: boolean;
    reconciledAt: Date | null;
    voucherNumber: string | null;
    // ----------
    note: string | null;
    reference: string | null;
    transactionAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    account: { name: string; type: PersonalAccountType };
    toAccount?: { name: string; type: PersonalAccountType } | null;
    category?: { name: string; type: PersonalCategoryType; icon: string | null; color: string | null } | null;
}

export interface PaginatedTransactionsResult {
    data: TransactionWithDetails[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    summary: {
        openingBalance: number;
        closingBalance: number;
        netMovement: number;
    };
}

export interface DashboardStats {
    totalBalance: number;
    accountBalances: Array<{
        id: string;
        name: string;
        type: PersonalAccountType;
        currency: string;
        balance: number;
    }>;
    periodStats: {
        totalIncome: number;
        totalExpense: number;
        netCashflow: number;
        transactionCount: number;
    };
}

export interface CashflowDataPoint {
    period: string;
    income: number;
    expense: number;
    netCashflow: number;
}

export interface CategoryBreakdownItem {
    categoryId: string;
    categoryName: string;
    icon: string | null;
    color: string | null;
    total: number;
    percentage: number;
    transactionCount: number;
}

export interface ReportDetails {
    id: string;
    userId: string;
    type: PersonalReportType;
    format: ReportFormat;
    status: ReportStatus;
    parameters: Record<string, unknown>;
    fileUrl: string | null;
    fileKey: string | null;
    expiresAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
}

export interface TransferResult {
    fromTransaction: TransactionWithDetails;
    toTransaction: TransactionWithDetails;
}
