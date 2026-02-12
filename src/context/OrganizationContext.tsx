import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../lib/api-client";
import { useAuth } from "./AuthContext";

// Types matching the services/api.ts Organization shape
export interface Organization {
    id: string;
    name: string;
    role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
    createdAt?: string;
    updatedAt?: string;
    ownerId?: string;
    members?: any[];
    owner?: {
        id: string;
        name: string;
        email: string;
    };
}

interface OrganizationContextType {
    organizations: Organization[];
    currentOrganization: Organization | null;
    isLoading: boolean;
    isSwitching: boolean;
    switchOrganization: (orgId: string) => Promise<void>;
    createOrganization: (name: string) => Promise<Organization | null>;
    refreshOrganizations: () => Promise<void>;
    refreshCurrentOrganization: () => Promise<void>;
    invites: any[];
    fetchInvites: () => Promise<void>;
    acceptInvitation: (token: string) => Promise<void>;
    declineInvitation: (token: string) => Promise<void>;
    members: any[];
    fetchMembers: () => Promise<void>;
    inviteMember: (email: string, role: string) => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    updateMemberRole: (memberId: string, role: string) => Promise<void>;
    updateOrganization: (data: { name?: string }) => Promise<void>;
    leaveOrganization: () => Promise<void>;
    transferOwnership: (newOwnerId: string) => Promise<void>;
    error: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [invites, setInvites] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch all organizations the user belongs to
    const refreshOrganizations = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await apiClient.get("/organizations");
            // Backend returns { success: true, data: Array<{ role, organization: { ... } }> }
            const memberships = data.data || [];
            const orgs: Organization[] = memberships.map((m: any) => ({
                ...m.organization,
                role: m.role,
            }));
            setOrganizations(orgs);

            // Restore or set active org
            const savedOrgId = localStorage.getItem("activeOrgId");
            const saved = orgs.find((o) => o.id === savedOrgId);
            if (saved) {
                setCurrentOrganization(saved);
                localStorage.setItem("currentOrganizationId", saved.id);
            } else if (orgs.length > 0) {
                setCurrentOrganization(orgs[0]);
                localStorage.setItem("activeOrgId", orgs[0].id);
                localStorage.setItem("currentOrganizationId", orgs[0].id);
            }
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh current org details from API
    const refreshCurrentOrganization = useCallback(async () => {
        try {
            const { data } = await apiClient.get("/organizations/current");
            const fullOrg = data.data || data;

            // Update currentOrganization with full details
            setCurrentOrganization((prev) =>
                prev ? { ...prev, ...fullOrg } : fullOrg
            );

            // Also update in the orgs list
            if (fullOrg.id) {
                setOrganizations((prev) =>
                    prev.map((o) => (o.id === fullOrg.id ? { ...o, ...fullOrg } : o))
                );
            }
        } catch {
            // silently fail
        }
    }, []);

    // Switch to a different organization
    const switchOrganization = useCallback(
        async (orgId: string) => {
            setIsSwitching(true);
            try {
                const org = organizations.find((o) => o.id === orgId);
                if (org) {
                    setCurrentOrganization(org);
                    localStorage.setItem("activeOrgId", org.id);
                    // Also store for services/api.ts compatibility
                    localStorage.setItem("currentOrganizationId", org.id);

                    // Small delay to allow queries to react to isSwitching
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } finally {
                setIsSwitching(false);
            }
        },
        [organizations]
    );

    // Create a new organization
    const createOrganization = useCallback(
        async (name: string): Promise<Organization | null> => {
            const { data } = await apiClient.post("/organizations", { name });
            const newOrgData = data.data || data;

            // Refresh orgs list so the new org appears
            await refreshOrganizations();

            // Find and switch to the newly created org
            const newOrg: Organization = {
                id: newOrgData.id || newOrgData.organization?.id,
                name: newOrgData.name || newOrgData.organization?.name || name,
                role: "OWNER",
                createdAt: newOrgData.createdAt,
                updatedAt: newOrgData.updatedAt,
                ownerId: newOrgData.ownerId,
            };

            setCurrentOrganization(newOrg);
            localStorage.setItem("activeOrgId", newOrg.id);
            localStorage.setItem("currentOrganizationId", newOrg.id);

            return newOrg;
        },
        [refreshOrganizations]
    );

    // Fetch pending invitations for the user
    const fetchInvites = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.get("/organizations/current/invites");
            setInvites(data.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch invitations");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Accept an invitation
    const acceptInvitation = useCallback(async (token: string) => {
        setError(null);
        try {
            await apiClient.post("/organizations/invites/accept", { token });
            await fetchInvites();
            await refreshOrganizations();
        } catch (err: any) {
            setError(err.message || "Failed to accept invitation");
            throw err;
        }
    }, [fetchInvites, refreshOrganizations]);

    // Decline an invitation
    const declineInvitation = useCallback(async (token: string) => {
        setError(null);
        try {
            await apiClient.post("/organizations/invites/decline", { token });
            await fetchInvites();
        } catch (err: any) {
            setError(err.message || "Failed to decline invitation");
            throw err;
        }
    }, [fetchInvites]);

    // Fetch members of the current organization
    const fetchMembers = useCallback(async () => {
        if (!currentOrganization?.id) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.get("/organizations/current/members");
            // Backend might return { success: true, data: { members: [] } }
            setMembers(data.data?.members || data.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch members");
        } finally {
            setIsLoading(false);
        }
    }, [currentOrganization?.id]);

    // Invite a member
    const inviteMember = useCallback(async (email: string, role: string) => {
        setError(null);
        try {
            await apiClient.post("/organizations/current/invite", { email, role });
            await fetchMembers();
        } catch (err: any) {
            setError(err.message || "Failed to invite member");
            throw err;
        }
    }, [fetchMembers]);

    // Remove a member
    const removeMember = useCallback(async (memberId: string) => {
        setError(null);
        try {
            await apiClient.delete(`/members/${memberId}`);
            await fetchMembers();
        } catch (err: any) {
            setError(err.message || "Failed to remove member");
            throw err;
        }
    }, [fetchMembers]);

    // Update member role
    const updateMemberRole = useCallback(async (memberId: string, role: string) => {
        setError(null);
        try {
            await apiClient.patch(`/members/${memberId}/role`, { role });
            await fetchMembers();
        } catch (err: any) {
            setError(err.message || "Failed to update member role");
            throw err;
        }
    }, [fetchMembers]);

    // Update organization details
    const updateOrganization = useCallback(async (data: { name?: string }) => {
        setError(null);
        try {
            await apiClient.patch("/organizations/current", data);
            await refreshCurrentOrganization();
            await refreshOrganizations();
        } catch (err: any) {
            setError(err.message || "Failed to update organization");
            throw err;
        }
    }, [refreshCurrentOrganization, refreshOrganizations]);

    // Leave organization
    const leaveOrganization = useCallback(async () => {
        setError(null);
        try {
            await apiClient.post("/organizations/current/leave");
            await refreshOrganizations();
        } catch (err: any) {
            setError(err.message || "Failed to leave organization");
            throw err;
        }
    }, [refreshOrganizations]);

    // Transfer ownership
    const transferOwnership = useCallback(async (newOwnerId: string) => {
        setError(null);
        try {
            await apiClient.post("/organizations/current/transfer-ownership", { newOwnerId });
            await refreshCurrentOrganization();
        } catch (err: any) {
            setError(err.message || "Failed to transfer ownership");
            throw err;
        }
    }, [refreshCurrentOrganization]);

    // Initialize on auth change
    useEffect(() => {
        if (isAuthenticated) {
            refreshOrganizations();
            fetchInvites();
        } else {
            setOrganizations([]);
            setCurrentOrganization(null);
            setInvites([]);
            setError(null);
        }
    }, [isAuthenticated, refreshOrganizations, fetchInvites]);

    // Refresh current org details once we have an active org
    useEffect(() => {
        if (isAuthenticated && currentOrganization?.id) {
            refreshCurrentOrganization();
        }
    }, [isAuthenticated, currentOrganization?.id]);

    return (
        <OrganizationContext.Provider
            value={{
                organizations,
                currentOrganization,
                isLoading,
                isSwitching,
                switchOrganization,
                createOrganization,
                refreshOrganizations,
                refreshCurrentOrganization,
                invites,
                fetchInvites,
                acceptInvitation,
                declineInvitation,
                members,
                fetchMembers,
                inviteMember,
                removeMember,
                updateMemberRole,
                updateOrganization,
                leaveOrganization,
                transferOwnership,
                error,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (!context) throw new Error("useOrganization must be used within OrganizationProvider");
    return context;
}
