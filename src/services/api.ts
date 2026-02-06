// Use proxy in development, full URL in production
const API_BASE_URL = import.meta.env.DEV 
    ? "/api" 
    : "https://project-management-backend-exsp.onrender.com/api";

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
    createdAt: string;
}

export interface Organization {
    id: string;
    name: string;
    role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        user: User;
        tokens: Tokens;
        organizations: Organization[];
    };
    message?: string;
}

export interface SignupResponse {
    success: boolean;
    data: {
        user: User;
        tokens: Tokens;
        organizationId: string;
    };
    message?: string;
}

export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}

// Token management
export const TokenManager = {
    getAccessToken: () => localStorage.getItem("accessToken"),
    getRefreshToken: () => localStorage.getItem("refreshToken"),
    
    setTokens: (tokens: Tokens) => {
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
    },
    
    clearTokens: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("organizations");
    },
    
    setUser: (user: User) => {
        localStorage.setItem("user", JSON.stringify(user));
    },
    
    getUser: (): User | null => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },
    
    setOrganizations: (orgs: Organization[]) => {
        localStorage.setItem("organizations", JSON.stringify(orgs));
    },
    
    getOrganizations: (): Organization[] => {
        const orgs = localStorage.getItem("organizations");
        return orgs ? JSON.parse(orgs) : [];
    }
};

// API helper with organization context
interface RequestOptions extends RequestInit {
    skipOrgHeader?: boolean; // Skip organization header for auth endpoints
}

async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const token = TokenManager.getAccessToken();
    const organizations = TokenManager.getOrganizations();
    // Handle both id and _id variations for organization ID
    const currentOrg = organizations[0];
    const currentOrgId = currentOrg ? (currentOrg.id || (currentOrg as any)._id) : null;
    
    const { skipOrgHeader, ...fetchOptions } = options;
    
    const method = fetchOptions.method || "GET";
    const isGetRequest = method === "GET";
    
    const headers: HeadersInit = {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Only include Content-Type for requests with a body
        ...(!isGetRequest && { "Content-Type": "application/json" }),
        // Add organization header for organization-scoped endpoints
        ...(!skipOrgHeader && currentOrgId && { "X-Organization-Id": currentOrgId }),
        ...fetchOptions.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "An error occurred");
    }

    return data;
}

// Auth API - these endpoints don't require organization context
export const AuthAPI = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        return apiRequest<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            skipOrgHeader: true,
        });
    },

    signup: async (
        email: string,
        password: string,
        name: string,
        organizationName: string
    ): Promise<SignupResponse> => {
        return apiRequest<SignupResponse>("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ email, password, name, organizationName }),
            skipOrgHeader: true,
        });
    },

    verifyOtp: async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest("/auth/verify-otp", {
            method: "POST",
            body: JSON.stringify({ email, code }),
            skipOrgHeader: true,
        });
    },

    resetPassword: async (
        email: string,
        code: string,
        newPassword: string
    ): Promise<{ success: boolean; message: string }> => {
        return apiRequest("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ email, code, newPassword }),
            skipOrgHeader: true,
        });
    },

    requestPasswordReset: async (email: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
            skipOrgHeader: true,
        });
    },

    logout: () => {
        TokenManager.clearTokens();
    }
};

// ==========================================
// Organization & Membership Types
// ==========================================

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface OrganizationDetails {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
}

export interface OrganizationMember {
    id: string;
    userId: string;
    organizationId: string;
    role: Role;
    user: {
        id: string;
        name: string;
        email: string;
    };
    joinedAt: string;
}

export interface OrganizationInvite {
    id: string;
    email: string;
    role: Role;
    token: string;
    expiresAt: string;
    organization: {
        id: string;
        name: string;
    };
}

export interface CreateOrganizationResponse {
    success: boolean;
    data: {
        organization: OrganizationDetails;
    };
    message?: string;
}

export interface InviteUserResponse {
    success: boolean;
    data: {
        invite: OrganizationInvite;
    };
    message?: string;
}

export interface AcceptInviteResponse {
    success: boolean;
    data: {
        organization: Organization;
    };
    message?: string;
}

export interface GetOrganizationResponse {
    success: boolean;
    data: OrganizationDetails & {
        members: OrganizationMember[];
        owner?: {
            id: string;
            name: string;
            email: string;
        };
    };
}

export interface UpdateMemberRoleResponse {
    success: boolean;
    data: {
        member: OrganizationMember;
    };
    message?: string;
}

export interface AdminOrganization {
    id: string;
    name: string;
    slug?: string;
    owner: {
        id: string;
        name: string;
        email: string;
    };
    contactEmail?: string;
    status: "ACTIVE" | "SUSPENDED" | "PENDING";
    plan: "FREE" | "PRO" | "ENTERPRISE";
    memberCount: number;
    createdAt: string;
    updatedAt: string;
    subscriptionId?: string;
    storageUsed?: number; // bytes
}

export interface AdminStats {
    totalOrganizations: number;
    totalUsers: number;
    activeOrganizations: number;
    suspendedOrganizations: number;
    totalStorage: number;
    totalRevenue: number;
}

export interface GetAdminOrganizationsResponse {
    success: boolean;
    data: {
        organizations: AdminOrganization[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    };
}

export interface GetAdminStatsResponse {
    success: boolean;
    data: {
        stats: AdminStats;
    };
}

// ==========================================
// Organization API
// ==========================================

export const OrganizationAPI = {
    // Create a new organization
    create: async (name: string): Promise<CreateOrganizationResponse> => {
        return apiRequest<CreateOrganizationResponse>("/organizations", {
            method: "POST",
            body: JSON.stringify({ name }),
            skipOrgHeader: true, // Creating new org, no current org context
        });
    },

    // Get current organization details
    getCurrent: async (): Promise<GetOrganizationResponse> => {
        return apiRequest<GetOrganizationResponse>("/organizations/current", {
            method: "GET",
        });
    },

    // Update current organization
    update: async (data: { name?: string }): Promise<{ success: boolean; data: { organization: OrganizationDetails }; message?: string }> => {
        return apiRequest("/organizations/current", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Invite user to current organization
    inviteUser: async (email: string, role: Exclude<Role, "OWNER">): Promise<InviteUserResponse> => {
        return apiRequest<InviteUserResponse>("/organizations/current/invite", {
            method: "POST",
            body: JSON.stringify({ email, role }),
        });
    },

    // Accept organization invite
    acceptInvite: async (token: string): Promise<AcceptInviteResponse> => {
        return apiRequest<AcceptInviteResponse>("/organizations/invites/accept", {
            method: "POST",
            body: JSON.stringify({ token }),
            skipOrgHeader: true,
        });
    },

    // Decline organization invite
    declineInvite: async (token: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest("/organizations/invites/decline", {
            method: "POST",
            body: JSON.stringify({ token }),
            skipOrgHeader: true,
        });
    },

    // Transfer organization ownership (OWNER only)
    transferOwnership: async (newOwnerId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest("/organizations/current/transfer-ownership", {
            method: "POST",
            body: JSON.stringify({ newOwnerId }),
        });
    },

    // Get all members of current organization
    getMembers: async (): Promise<{ success: boolean; data: { members: OrganizationMember[] } }> => {
        return apiRequest("/organizations/current/members", {
            method: "GET",
        });
    },

    removeMember: async (memberId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/members/${memberId}`, {
            method: "DELETE",
        });
    },
};

// ==========================================
// Super Admin API
// ==========================================

export const SuperAdminAPI = {
    // Get all organizations (with pagination and filters)
    getOrganizations: async (page = 1, limit = 10, search?: string, status?: string): Promise<GetAdminOrganizationsResponse> => {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) queryParams.set("search", search);
        if (status && status !== "All") queryParams.set("status", status);

        // Try /organizations instead of /admin/organizations as the backend might not have the /admin prefix
        return apiRequest<GetAdminOrganizationsResponse>(`/organizations?${queryParams.toString()}`, {
            method: "GET",
            skipOrgHeader: true,
        });
    },

    // Get platform stats
    getStats: async (): Promise<GetAdminStatsResponse> => {
        // Try /organizations/stats instead of /admin/stats
        return apiRequest<GetAdminStatsResponse>("/organizations/stats", {
            method: "GET",
            skipOrgHeader: true,
        });
    },

    // Update organization status
    updateStatus: async (orgId: string, status: "ACTIVE" | "SUSPENDED"): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/organizations/${orgId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
            skipOrgHeader: true,
        });
    },

    // Create organization (Admin override)
    createOrganization: async (data: any): Promise<CreateOrganizationResponse> => {
        return apiRequest<CreateOrganizationResponse>("/organizations", {
            method: "POST",
            body: JSON.stringify(data),
            skipOrgHeader: true,
        });
    },

    // Delete organization
    deleteOrganization: async (orgId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/organizations/${orgId}`, {
            method: "DELETE",
            skipOrgHeader: true,
        });
    },
};

// ==========================================
// Membership API
// ==========================================

export const MembershipAPI = {
    // Update member role (ADMIN/OWNER only)
    updateRole: async (memberId: string, role: Role): Promise<UpdateMemberRoleResponse> => {
        return apiRequest<UpdateMemberRoleResponse>(`/members/${memberId}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        });
    },

    // Get pending invites for current user
    getPendingInvites: async (): Promise<{ success: boolean; data: { invites: OrganizationInvite[] } }> => {
        return apiRequest("/organizations/invites/pending", {
            method: "GET",
            skipOrgHeader: true,
        });
    },

    // Leave organization (current user leaves)
    leaveOrganization: async (): Promise<{ success: boolean; message: string }> => {
        return apiRequest("/organizations/current/leave", {
            method: "POST",
        });
    },
};

// ==========================================
// Project Management Types
// ==========================================

export type ProjectVisibility = "PRIVATE" | "ORG_WIDE";
export type ProjectRole = "LEAD" | "MEMBER" | "VIEWER";
export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";

export interface Project {
    id: string;
    name: string;
    description?: string;
    visibility: ProjectVisibility;
    status: ProjectStatus;
    organizationId: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        members: number;
    };
}

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;
    user: {
        id: string;
        name: string;
        email: string;
    };
    joinedAt: string;
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
    visibility?: ProjectVisibility;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    visibility?: ProjectVisibility;
}

export interface ProjectResponse {
    success: boolean;
    data: {
        project: Project;
    };
    message?: string;
}

export interface ProjectListResponse {
    success: boolean;
    data: {
        projects: Project[];
        total: number;
        page: number;
        limit: number;
    };
}

export interface ProjectMembersResponse {
    success: boolean;
    data: {
        members: ProjectMember[];
    };
}

export interface AddProjectMemberRequest {
    userId: string;
    role?: ProjectRole;
}

// ==========================================
// Project API
// ==========================================

export const ProjectAPI = {
    // Create a new project
    create: async (data: CreateProjectRequest): Promise<ProjectResponse> => {
        return apiRequest<ProjectResponse>("/projects", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Get all projects (respects visibility and membership)
    getAll: async (params?: { 
        page?: number; 
        limit?: number; 
        status?: ProjectStatus;
        search?: string;
    }): Promise<ProjectListResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        if (params?.status) queryParams.set("status", params.status);
        if (params?.search) queryParams.set("search", params.search);
        
        const queryString = queryParams.toString();
        return apiRequest<ProjectListResponse>(`/projects${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Get single project by ID
    getById: async (projectId: string): Promise<ProjectResponse> => {
        return apiRequest<ProjectResponse>(`/projects/${projectId}`, {
            method: "GET",
        });
    },

    // Update project
    update: async (projectId: string, data: UpdateProjectRequest): Promise<ProjectResponse> => {
        return apiRequest<ProjectResponse>(`/projects/${projectId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Delete project (ADMIN/OWNER only)
    delete: async (projectId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/projects/${projectId}`, {
            method: "DELETE",
        });
    },

    // Archive project
    archive: async (projectId: string): Promise<ProjectResponse> => {
        return apiRequest<ProjectResponse>(`/projects/${projectId}/archive`, {
            method: "POST",
        });
    },

    // Unarchive project
    unarchive: async (projectId: string): Promise<ProjectResponse> => {
        return apiRequest<ProjectResponse>(`/projects/${projectId}/unarchive`, {
            method: "POST",
        });
    },

    // Get project members
    getMembers: async (projectId: string): Promise<ProjectMembersResponse> => {
        return apiRequest<ProjectMembersResponse>(`/projects/${projectId}/members`, {
            method: "GET",
        });
    },

    // Add member to project
    addMember: async (projectId: string, data: AddProjectMemberRequest): Promise<{ success: boolean; data: { member: ProjectMember }; message?: string }> => {
        return apiRequest(`/projects/${projectId}/members`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Update project member role
    updateMemberRole: async (projectId: string, memberId: string, role: ProjectRole): Promise<{ success: boolean; data: { member: ProjectMember }; message?: string }> => {
        return apiRequest(`/projects/${projectId}/members/${memberId}`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        });
    },

    // Remove member from project
    removeMember: async (projectId: string, memberId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/projects/${projectId}/members/${memberId}`, {
            method: "DELETE",
        });
    },
};

// ==========================================
// Task Management Types
// ==========================================

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskAssignee {
    id: string;
    userId: string;
    taskId: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    assignedAt: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    projectId?: string;
    parentTaskId?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    organizationId: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    assignees?: TaskAssignee[];
    project?: {
        id: string;
        name: string;
    };
    parentTask?: {
        id: string;
        title: string;
    };
    subtasks?: Task[];
    _count?: {
        subtasks: number;
        assignees: number;
    };
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    projectId?: string;
    parentTaskId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    projectId?: string;
}

export interface TaskResponse {
    success: boolean;
    data: {
        task: Task;
    };
    message?: string;
}

export interface TaskListResponse {
    success: boolean;
    data: {
        tasks: Task[];
        total: number;
        page: number;
        limit: number;
    };
}

export interface TaskFilters {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
    assigneeId?: string;
    createdById?: string;
    search?: string;
    dueBefore?: string;
    dueAfter?: string;
    includeSubtasks?: boolean;
}

// ==========================================
// Task API
// ==========================================

export const TaskAPI = {
    // Create a new task
    create: async (data: CreateTaskRequest): Promise<TaskResponse> => {
        return apiRequest<TaskResponse>("/tasks", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Get all tasks with filters
    getAll: async (filters?: TaskFilters): Promise<TaskListResponse> => {
        const queryParams = new URLSearchParams();
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        if (filters?.status) queryParams.set("status", filters.status);
        if (filters?.priority) queryParams.set("priority", filters.priority);
        if (filters?.projectId) queryParams.set("projectId", filters.projectId);
        if (filters?.assigneeId) queryParams.set("assigneeId", filters.assigneeId);
        if (filters?.createdById) queryParams.set("createdById", filters.createdById);
        if (filters?.search) queryParams.set("search", filters.search);
        if (filters?.dueBefore) queryParams.set("dueBefore", filters.dueBefore);
        if (filters?.dueAfter) queryParams.set("dueAfter", filters.dueAfter);
        if (filters?.includeSubtasks) queryParams.set("includeSubtasks", "true");
        
        const queryString = queryParams.toString();
        return apiRequest<TaskListResponse>(`/tasks${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Get tasks assigned to current user
    getMyTasks: async (filters?: Omit<TaskFilters, "assigneeId">): Promise<TaskListResponse> => {
        const queryParams = new URLSearchParams();
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        if (filters?.status) queryParams.set("status", filters.status);
        if (filters?.priority) queryParams.set("priority", filters.priority);
        if (filters?.projectId) queryParams.set("projectId", filters.projectId);
        
        const queryString = queryParams.toString();
        return apiRequest<TaskListResponse>(`/tasks/my${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Get single task by ID
    getById: async (taskId: string): Promise<TaskResponse> => {
        return apiRequest<TaskResponse>(`/tasks/${taskId}`, {
            method: "GET",
        });
    },

    // Update task
    update: async (taskId: string, data: UpdateTaskRequest): Promise<TaskResponse> => {
        return apiRequest<TaskResponse>(`/tasks/${taskId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Update task status only
    updateStatus: async (taskId: string, status: TaskStatus): Promise<TaskResponse> => {
        return apiRequest<TaskResponse>(`/tasks/${taskId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
    },

    // Delete task
    delete: async (taskId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/tasks/${taskId}`, {
            method: "DELETE",
        });
    },

    // Get subtasks
    getSubtasks: async (taskId: string): Promise<TaskListResponse> => {
        return apiRequest<TaskListResponse>(`/tasks/${taskId}/subtasks`, {
            method: "GET",
        });
    },

    // Assign user to task
    assignUser: async (taskId: string, userId: string): Promise<{ success: boolean; data: { assignee: TaskAssignee }; message?: string }> => {
        return apiRequest(`/tasks/${taskId}/assignees`, {
            method: "POST",
            body: JSON.stringify({ userId }),
        });
    },

    // Unassign user from task
    unassignUser: async (taskId: string, userId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/tasks/${taskId}/assignees/${userId}`, {
            method: "DELETE",
        });
    },

    // Get task assignees
    getAssignees: async (taskId: string): Promise<{ success: boolean; data: { assignees: TaskAssignee[] } }> => {
        return apiRequest(`/tasks/${taskId}/assignees`, {
            method: "GET",
        });
    },

    // Bulk update task status
    bulkUpdateStatus: async (taskIds: string[], status: TaskStatus): Promise<{ success: boolean; data: { updated: number }; message?: string }> => {
        return apiRequest("/tasks/bulk/status", {
            method: "PATCH",
            body: JSON.stringify({ taskIds, status }),
        });
    },

    // Bulk assign tasks
    bulkAssign: async (taskIds: string[], userId: string): Promise<{ success: boolean; data: { updated: number }; message?: string }> => {
        return apiRequest("/tasks/bulk/assign", {
            method: "POST",
            body: JSON.stringify({ taskIds, userId }),
        });
    },
};

// ==========================================
// Expense Management Types
// ==========================================

export type ExpenseCategory = "TRAVEL" | "MEALS" | "SUPPLIES" | "EQUIPMENT" | "SOFTWARE" | "SERVICES" | "MARKETING" | "OTHER";
export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "REIMBURSED";

export interface ReceiptMetadata {
    filename: string;
    mimeType: string;
    size: number;
}

export interface Expense {
    id: string;
    title: string;
    amount: number;
    currency: string;
    category: ExpenseCategory;
    status: ExpenseStatus;
    description?: string;
    receiptUrl?: string;
    receiptMetadata?: ReceiptMetadata;
    projectId?: string;
    taskId?: string;
    organizationId: string;
    submittedById: string;
    submittedBy?: {
        id: string;
        name: string;
        email: string;
    };
    approvedById?: string;
    approvedBy?: {
        id: string;
        name: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
    approvalComment?: string;
    project?: {
        id: string;
        name: string;
    };
    task?: {
        id: string;
        title: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpenseRequest {
    title: string;
    amount: number;
    currency?: string;
    category: ExpenseCategory;
    projectId?: string;
    taskId?: string;
    description?: string;
    receiptUrl?: string;
    receiptMetadata?: ReceiptMetadata;
}

export interface UpdateExpenseRequest {
    title?: string;
    amount?: number;
    currency?: string;
    category?: ExpenseCategory;
    projectId?: string | null;
    taskId?: string | null;
    description?: string;
    receiptUrl?: string;
    receiptMetadata?: ReceiptMetadata;
}

export interface ExpenseResponse {
    success: boolean;
    data: {
        expense: Expense;
    };
    message?: string;
}

export interface ExpenseListResponse {
    success: boolean;
    data: {
        expenses: Expense[];
        total: number;
        page: number;
        limit: number;
        totalAmount?: number;
    };
}

export interface ExpenseFilters {
    page?: number;
    limit?: number;
    status?: ExpenseStatus;
    category?: ExpenseCategory;
    projectId?: string;
    submittedById?: string;
    minAmount?: number;
    maxAmount?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

// ==========================================
// Expense API
// ==========================================

export const ExpenseAPI = {
    // Create a new expense claim
    create: async (data: CreateExpenseRequest): Promise<ExpenseResponse> => {
        return apiRequest<ExpenseResponse>("/expenses", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Get all expenses with filters
    getAll: async (filters?: ExpenseFilters): Promise<ExpenseListResponse> => {
        const queryParams = new URLSearchParams();
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        if (filters?.status) queryParams.set("status", filters.status);
        if (filters?.category) queryParams.set("category", filters.category);
        if (filters?.projectId) queryParams.set("projectId", filters.projectId);
        if (filters?.submittedById) queryParams.set("submittedById", filters.submittedById);
        if (filters?.minAmount) queryParams.set("minAmount", filters.minAmount.toString());
        if (filters?.maxAmount) queryParams.set("maxAmount", filters.maxAmount.toString());
        if (filters?.dateFrom) queryParams.set("dateFrom", filters.dateFrom);
        if (filters?.dateTo) queryParams.set("dateTo", filters.dateTo);
        if (filters?.search) queryParams.set("search", filters.search);
        
        const queryString = queryParams.toString();
        return apiRequest<ExpenseListResponse>(`/expenses${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Get my submitted expenses
    getMyExpenses: async (filters?: Omit<ExpenseFilters, "submittedById">): Promise<ExpenseListResponse> => {
        const queryParams = new URLSearchParams();
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        if (filters?.status) queryParams.set("status", filters.status);
        if (filters?.category) queryParams.set("category", filters.category);
        
        const queryString = queryParams.toString();
        return apiRequest<ExpenseListResponse>(`/expenses/my${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Get pending expenses for approval (MANAGER+ only)
    getPendingForApproval: async (filters?: ExpenseFilters): Promise<ExpenseListResponse> => {
        const queryParams = new URLSearchParams();
        queryParams.set("status", "PENDING");
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        if (filters?.category) queryParams.set("category", filters.category);
        
        const queryString = queryParams.toString();
        return apiRequest<ExpenseListResponse>(`/expenses?${queryString}`, {
            method: "GET",
        });
    },

    // Get single expense by ID
    getById: async (expenseId: string): Promise<ExpenseResponse> => {
        return apiRequest<ExpenseResponse>(`/expenses/${expenseId}`, {
            method: "GET",
        });
    },

    // Update expense (only while PENDING)
    update: async (expenseId: string, data: UpdateExpenseRequest): Promise<ExpenseResponse> => {
        return apiRequest<ExpenseResponse>(`/expenses/${expenseId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Delete expense (only while PENDING)
    delete: async (expenseId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/expenses/${expenseId}`, {
            method: "DELETE",
        });
    },

    // Approve expense (MANAGER+ only)
    approve: async (expenseId: string, comment?: string): Promise<ExpenseResponse> => {
        return apiRequest<ExpenseResponse>(`/expenses/${expenseId}/approve`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
    },

    // Reject expense (MANAGER+ only)
    reject: async (expenseId: string, reason: string): Promise<ExpenseResponse> => {
        return apiRequest<ExpenseResponse>(`/expenses/${expenseId}/reject`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        });
    },

    // Mark expense as reimbursed (ADMIN+ only)
    markReimbursed: async (expenseId: string): Promise<ExpenseResponse> => {
        return apiRequest<ExpenseResponse>(`/expenses/${expenseId}/reimburse`, {
            method: "POST",
        });
    },

    // Get expense summary/statistics
    getSummary: async (filters?: { dateFrom?: string; dateTo?: string; projectId?: string }): Promise<{
        success: boolean;
        data: {
            totalAmount: number;
            byCategory: Record<ExpenseCategory, number>;
            byStatus: Record<ExpenseStatus, number>;
            count: number;
        };
    }> => {
        const queryParams = new URLSearchParams();
        if (filters?.dateFrom) queryParams.set("dateFrom", filters.dateFrom);
        if (filters?.dateTo) queryParams.set("dateTo", filters.dateTo);
        if (filters?.projectId) queryParams.set("projectId", filters.projectId);
        
        const queryString = queryParams.toString();
        return apiRequest(`/expenses/summary${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Upload receipt (returns URL for use in create/update)
    uploadReceipt: async (file: File): Promise<{ success: boolean; data: { url: string; metadata: ReceiptMetadata } }> => {
        const formData = new FormData();
        formData.append("receipt", file);
        
        const token = TokenManager.getAccessToken();
        const organizations = TokenManager.getOrganizations();
        const currentOrgId = organizations[0]?.id;
        
        const response = await fetch(`${import.meta.env.DEV ? "/api" : "https://project-management-backend-exsp.onrender.com/api"}/expenses/upload-receipt`, {
            method: "POST",
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(currentOrgId && { "X-Organization-Id": currentOrgId }),
            },
            body: formData,
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to upload receipt");
        }
        return data;
    },
};

// ==========================================
// Presence Module Types
// ==========================================

export type PresenceStatus = "AVAILABLE" | "WORKING" | "BUSY" | "IN_MEETING" | "ON_BREAK" | "AT_LUNCH" | "AWAY" | "OFFLINE";

export interface UserPresence {
    id: string;
    userId: string;
    status: PresenceStatus;
    customMessage?: string;
    lastActiveAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export interface PresenceHistory {
    id: string;
    userId: string;
    status: PresenceStatus;
    startedAt: string;
    endedAt?: string;
    duration?: number; // in minutes
}

export interface UpdatePresenceRequest {
    status: PresenceStatus;
    customMessage?: string;
}

export interface PresenceResponse {
    success: boolean;
    data: {
        presence: UserPresence;
    };
    message?: string;
}

export interface TeamPresenceResponse {
    success: boolean;
    data: {
        members: UserPresence[];
        summary: {
            total: number;
            byStatus: Record<PresenceStatus, number>;
        };
    };
}

export interface PresenceHistoryResponse {
    success: boolean;
    data: {
        history: PresenceHistory[];
        total: number;
        page: number;
        limit: number;
    };
}

// ==========================================
// Presence API
// ==========================================

export const PresenceAPI = {
    // Update own presence status
    updateMyStatus: async (data: UpdatePresenceRequest): Promise<PresenceResponse> => {
        return apiRequest<PresenceResponse>("/presence/me", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Get own presence status
    getMyStatus: async (): Promise<PresenceResponse> => {
        return apiRequest<PresenceResponse>("/presence/me", {
            method: "GET",
        });
    },

    // Get team/organization presence
    getTeamPresence: async (): Promise<TeamPresenceResponse> => {
        return apiRequest<TeamPresenceResponse>("/presence/team", {
            method: "GET",
        });
    },

    // Get presence by user ID
    getUserPresence: async (userId: string): Promise<PresenceResponse> => {
        return apiRequest<PresenceResponse>(`/presence/user/${userId}`, {
            method: "GET",
        });
    },

    // Get presence history for current user
    getMyHistory: async (filters?: { 
        dateFrom?: string; 
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<PresenceHistoryResponse> => {
        const queryParams = new URLSearchParams();
        if (filters?.dateFrom) queryParams.set("dateFrom", filters.dateFrom);
        if (filters?.dateTo) queryParams.set("dateTo", filters.dateTo);
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        
        const queryString = queryParams.toString();
        return apiRequest<PresenceHistoryResponse>(`/presence/me/history${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Get presence history for a specific user (MANAGER+ only)
    getUserHistory: async (userId: string, filters?: { 
        dateFrom?: string; 
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<PresenceHistoryResponse> => {
        const queryParams = new URLSearchParams();
        if (filters?.dateFrom) queryParams.set("dateFrom", filters.dateFrom);
        if (filters?.dateTo) queryParams.set("dateTo", filters.dateTo);
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        
        const queryString = queryParams.toString();
        return apiRequest<PresenceHistoryResponse>(`/presence/user/${userId}/history${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Set status to offline (for logout/app close)
    goOffline: async (): Promise<PresenceResponse> => {
        return apiRequest<PresenceResponse>("/presence/me", {
            method: "PATCH",
            body: JSON.stringify({ status: "OFFLINE" }),
        });
    },

    // Set status to available (for login/app open)
    goOnline: async (): Promise<PresenceResponse> => {
        return apiRequest<PresenceResponse>("/presence/me", {
            method: "PATCH",
            body: JSON.stringify({ status: "AVAILABLE" }),
        });
    },
};

// ==========================================
// Notification Module Types
// ==========================================

export type NotificationType = 
    | "TASK_ASSIGNED"
    | "TASK_COMPLETED"
    | "TASK_COMMENT"
    | "PROJECT_INVITE"
    | "ORG_INVITE"
    | "EXPENSE_APPROVED"
    | "EXPENSE_REJECTED"
    | "MENTION"
    | "REMINDER"
    | "SYSTEM";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    data?: {
        taskId?: string;
        projectId?: string;
        expenseId?: string;
        userId?: string;
        organizationId?: string;
        [key: string]: string | undefined;
    };
    userId: string;
    createdAt: string;
    readAt?: string;
}

export interface NotificationResponse {
    success: boolean;
    data: {
        notification: Notification;
    };
    message?: string;
}

export interface NotificationListResponse {
    success: boolean;
    data: {
        notifications: Notification[];
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
    };
}

export interface NotificationFilters {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationType;
}

// ==========================================
// Notification API
// ==========================================

export const NotificationAPI = {
    // Get all notifications
    getAll: async (filters?: NotificationFilters): Promise<NotificationListResponse> => {
        const queryParams = new URLSearchParams();
        if (filters?.page) queryParams.set("page", filters.page.toString());
        if (filters?.limit) queryParams.set("limit", filters.limit.toString());
        if (filters?.isRead !== undefined) queryParams.set("isRead", filters.isRead.toString());
        if (filters?.type) queryParams.set("type", filters.type);
        
        const queryString = queryParams.toString();
        return apiRequest<NotificationListResponse>(`/notifications${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
        });
    },

    // Get unread notifications count
    getUnreadCount: async (): Promise<{ success: boolean; data: { count: number } }> => {
        return apiRequest("/notifications/unread-count", {
            method: "GET",
        });
    },

    // Mark specific notification as read
    markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
        return apiRequest<NotificationResponse>(`/notifications/${notificationId}/read`, {
            method: "POST",
        });
    },

    // Mark all notifications as read
    markAllAsRead: async (): Promise<{ success: boolean; data: { updated: number }; message?: string }> => {
        return apiRequest("/notifications/read-all", {
            method: "POST",
        });
    },

    // Delete a notification
    delete: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/notifications/${notificationId}`, {
            method: "DELETE",
        });
    },

    // Delete all read notifications
    deleteAllRead: async (): Promise<{ success: boolean; data: { deleted: number }; message?: string }> => {
        return apiRequest("/notifications/clear-read", {
            method: "DELETE",
        });
    },

    // Get notification by ID
    getById: async (notificationId: string): Promise<NotificationResponse> => {
        return apiRequest<NotificationResponse>(`/notifications/${notificationId}`, {
            method: "GET",
        });
    },
};

export default AuthAPI;
