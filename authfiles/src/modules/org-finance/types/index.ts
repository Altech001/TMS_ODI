import type {
    OrgFinanceAccountType,
    OrgLedgerType,
    OrgLedgerEntryCategory,
    OrgLedgerStatus,
    OrgDeleteRequestStatus,
    OrgFinanceReportType,
    ReportFormat,
    ReportStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================================================
// Account Types
// ============================================================================

export interface OrgFinanceAccountResponse {
    id: string;
    organizationId: string;
    name: string;
    type: OrgFinanceAccountType;
    currency: string;
    description: string | null;
    isArchived: boolean;
    balance?: string; // Computed from ledger
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// Ledger Entry Types
// ============================================================================

export interface OrgLedgerEntryResponse {
    id: string;
    organizationId: string;
    accountId: string;
    createdById: string;
    type: OrgLedgerType;
    entryCategory: OrgLedgerEntryCategory;
    amount: Decimal;
    currency: string;
    description: string;
    reference: string | null;
    reason: string | null;
    transactionDate: Date;
    status: OrgLedgerStatus;
    isEdited: boolean;
    editReason: string | null;
    lastEditedById: string | null;
    lastEditedAt: Date | null;
    reversalOfId: string | null;
    reversedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    account?: { name: string; type: OrgFinanceAccountType };
    createdBy?: { id: string; name: string; email: string };
    lastEditedBy?: { id: string; name: string; email: string } | null;
}

// ============================================================================
// Delete Request Types
// ============================================================================

export interface OrgDeleteRequestResponse {
    id: string;
    organizationId: string;
    entryId: string;
    requestedById: string;
    reason: string;
    status: OrgDeleteRequestStatus;
    approvedById: string | null;
    rejectionReason: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
    entry?: OrgLedgerEntryResponse;
    requestedBy?: { id: string; name: string; email: string };
    approvedBy?: { id: string; name: string; email: string } | null;
}

// ============================================================================
// Report Types
// ============================================================================

export interface OrgFinanceReportResponse {
    id: string;
    organizationId: string;
    userId: string;
    type: OrgFinanceReportType;
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

// ============================================================================
// Dashboard / Analytics Types
// ============================================================================

export interface OrgFinanceDashboard {
    totalBalance: string;
    totalInflow: string;
    totalOutflow: string;
    netCashflow: string;
    accountBalances: Array<{
        accountId: string;
        accountName: string;
        accountType: OrgFinanceAccountType;
        currency: string;
        balance: string;
    }>;
    recentEntries: OrgLedgerEntryResponse[];
    pendingDeleteRequests: number;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface OrgFinanceAuditLogResponse {
    id: string;
    organizationId: string;
    userId: string;
    entryId: string | null;
    entityType: string;
    entityId: string;
    action: string;
    previousData: unknown;
    newData: unknown;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    user?: { id: string; name: string; email: string };
}
