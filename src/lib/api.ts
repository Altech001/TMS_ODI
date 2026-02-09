
import { User, Organization, OrganizationMember  } from "../types";

/**
 * API Client for Project Management Backend
 * Base URL: https://project-management-backend-exsp.onrender.com/api/
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://project-management-backend-exsp.onrender.com/api';

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

// Token management
export const TokenManager = {
    getAccessToken: () => {
        const token = localStorage.getItem("accessToken");
        return token === 'undefined' ? null : token;
    },
    getRefreshToken: () => {
        const token = localStorage.getItem("refreshToken");
        return token === 'undefined' ? null : token;
    },
    
    setTokens: (tokens: Tokens) => {
        if (tokens.accessToken && tokens.accessToken !== 'undefined') {
            localStorage.setItem("accessToken", tokens.accessToken);
        }
        if (tokens.refreshToken && tokens.refreshToken !== 'undefined') {
            localStorage.setItem("refreshToken", tokens.refreshToken);
        }
    },
    
    clearTokens: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("organizations");
        localStorage.removeItem("authToken"); 
        localStorage.removeItem("organizationId");
    },
    
    setUser: (user: User) => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }
    },
    
    getUser: (): User | null => {
        const user = localStorage.getItem("user");
        try {
            return user && user !== 'undefined' ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },
    
    setOrganizations: (orgs: Organization[]) => {
        if (orgs) {
            localStorage.setItem("organizations", JSON.stringify(orgs));
        }
    },
    
    getOrganizations: (): Organization[] => {
        const orgs = localStorage.getItem("organizations");
        try {
            return orgs && orgs !== 'undefined' ? JSON.parse(orgs) : [];
        } catch (e) {
            return [];
        }
    }
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

export interface RequestOptions extends RequestInit {
    skipOrgHeader?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    if (token && token !== 'undefined') {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getToken() {
    return TokenManager.getAccessToken();
  }

  setOrganizationId(orgId: string | null) {
    if (orgId && orgId !== 'undefined') {
      localStorage.setItem('organizationId', orgId);
    } else {
      localStorage.removeItem('organizationId');
    }
  }

  getOrganizationId() {
    const stored = localStorage.getItem('organizationId');
    if (stored && stored !== 'undefined') return stored;
    
    const organizations = TokenManager.getOrganizations();
    if (organizations.length > 0) {
        const first = organizations[0] as any;
        // Handle both Organization (id) and OrganizationMember (organizationId) objects
        const id = first.organizationId || (first.organization && first.organization.id) || first.id || first._id;
        return id && id !== 'undefined' ? id : null;
    }
    return null;
  }

  private getHeaders(skipOrgHeader: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!skipOrgHeader) {
      const orgId = this.getOrganizationId();
      if (orgId && orgId !== 'undefined') {
        headers['X-Organization-Id'] = orgId;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        data = { message: text };
    }

    if (!response.ok) {
      const error: ApiError = {
        success: false,
        error: data.error || data.message || 'An error occurred',
        message: data.message,
        statusCode: response.status,
      };
      throw error;
    }

    return data;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipOrgHeader, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(skipOrgHeader),
        ...(fetchOptions.headers as Record<string, string>),
      },
    });

    return this.handleResponse<T>(response);
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// ==========================================
// Organization API
// ==========================================

export const OrganizationAPI = {
    // Create a new organization
    create: async (name: string) => {
        return apiClient.post<{ data: Organization }>("/organizations", { name }, { skipOrgHeader: true });
    },

    // Get current organization details
    getCurrent: async () => {
        // According to user preference, current org should NOT skip header
        return apiClient.get<{ data: Organization }>("/organizations/current");
    },

    // Update current organization
    update: async (data: { name?: string }) => {
        return apiClient.patch("/organizations/current", data);
    },

    // Invite user to current organization
    inviteUser: async (email: string, role: string) => {
        return apiClient.post("/organizations/current/invite", { email, role });
    },

    // Accept organization invite
    acceptInvite: async (token: string) => {
        return apiClient.post("/organizations/invites/accept", { token }, { skipOrgHeader: true });
    },

    // Decline organization invite
    declineInvite: async (token: string) => {
        return apiClient.post("/organizations/invites/decline", { token }, { skipOrgHeader: true });
    },

    // Transfer ownership
    transferOwnership: async (newOwnerId: string) => {
        return apiClient.post("/organizations/current/transfer-ownership", { newOwnerId });
    },

    // Get all members
    getMembers: async () => {
        return apiClient.get<{ data: OrganizationMember[] }>("/organizations/current/members");
    },

    removeMember: async (memberId: string) => {
        return apiClient.delete(`/members/${memberId}`);
    },
};
