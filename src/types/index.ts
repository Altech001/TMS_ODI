// Auth types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

// Organization types
export type OrgRole = "owner" | "admin" | "manager" | "accountant" | "member" | "viewer";

export interface Organization {
  id: string;
  name: string;
  description?: string;
  userRole?: string;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: OrgRole;
  avatar?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface CreateOrgRequest {
  name: string;
  description?: string;
}
export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "ARCHIVED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    members: number;
  };
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  projectId?: string;
  organizationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  assignees?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

// Finance types
export interface Cashbook {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  currency: string;
  allowBackdated: boolean;
  allowOmitted: boolean;
  lockDate?: string;
  createdAt: string;
  updatedAt: string;
  netBalance?: number;
}

export type CashbookRole = 'VIEWER' | 'EDITOR' | 'APPROVER';

export interface CashbookMember {
  id: string;
  cashbookId: string;
  userId: string;
  role: CashbookRole;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CashbookAccount {
  id: string;
  cashbookId: string;
  name: string;
  type: 'CASH' | 'BANK' | 'MOBILE_MONEY' | 'PETTY_CASH' | 'SAVINGS' | 'OTHER';
  currency: string;
  description?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  organizationId: string;
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'OTHER';
  phone?: string;
  email?: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashbookEntry {
  id: string;
  accountId: string;
  type: 'INFLOW' | 'OUTFLOW' | 'ADJUSTMENT' | 'REVERSAL';
  entryCategory: 'NORMAL' | 'BACKDATED' | 'OMITTED' | 'PRIOR_ADJUSTMENT';
  status: 'ACTIVE' | 'REVERSED' | 'DELETED' | 'PENDING_DELETE_APPROVAL';
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  reason?: string;
  transactionDate: string;
  isReconciled: boolean;
  contactId?: string;
  contact?: Contact;
  attachments?: Array<{
    fileKey: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
  updatedAt: string;
}
