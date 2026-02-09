// User & Auth Types
export type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
export type ProjectRole = 'LEAD' | 'MEMBER' | 'VIEWER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
  message?: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  joinedAt: string;
  updatedAt: string;
  user?: User;
}

export interface OrganizationInvite {
  id: string;
  email: string;
  organizationId: string;
  invitedById: string;
  role: MemberRole;
  token: string;
  expiresAt: string;
  status: InviteStatus;
  createdAt: string;
  respondedAt?: string;
}

// Project Types
export type ProjectVisibility = 'PRIVATE' | 'ORG_WIDE';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  deletedAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user?: User;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalMembers: number;
  totalExpenses: number;
}

// Task Types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  organizationId: string;
  projectId?: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletedAt?: string;
  assignees?: TaskAssignee[];
  subtasks?: Task[];
  createdBy?: User;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: string;
  user?: User;
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  action: string;
  details?: unknown;
  createdAt: string;
}

// Expense Types
export type ExpenseCategory = 'TRAVEL' | 'MEALS' | 'SUPPLIES' | 'SOFTWARE' | 'HARDWARE' | 'OTHER';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Expense {
  id: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  receiptUrl?: string;
  receiptMetadata?: unknown;
  createdById: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  createdBy?: User;
  approvedBy?: User;
}

// Notification Types
export type NotificationType = 'TASK_ASSIGNED' | 'EXPENSE_APPROVED' | 'EXPENSE_REJECTED' | 'ORG_INVITE' | 'TASK_UPDATED' | 'TASK_COMPLETED';

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// Personal Finance Types
export interface PersonalAccount {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalCategory {
  id: string;
  userId: string;
  name: string;
  type: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalTransaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  module: string;
  action: string;
  resourceId?: string;
  changes?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
}

// Presence Types
export interface UserPresence {
  userId: string;
  organizationId: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  lastSeen: string;
}

export interface UserPresenceHistory {
  id: string;
  userId: string;
  organizationId: string;
  status: 'ONLINE' | 'OFFLINE';
  loginAt?: string;
  logoutAt?: string;
  createdAt: string;
}

// List Response Types
export interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// API Request/Response Envelopes
export interface ApiListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
