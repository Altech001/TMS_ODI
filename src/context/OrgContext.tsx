import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Organization, OrgRole } from "@/types";
import apiClient from "@/lib/api-client";
import { useAuth } from "./AuthContext";

interface OrgContextType {
  organizations: Organization[];
  activeOrg: Organization | null;
  userRole: OrgRole | null;
  isLoading: boolean;
  setActiveOrg: (org: Organization) => void;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (name: string, description?: string) => Promise<Organization>;
  invites: any[];
  fetchInvites: () => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
  declineInvite: (token: string) => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<OrgRole | null>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/organizations");
      // The backend returns { success: true, data: Array<{ role, organization: { ... } }> }
      const memberships = data.data || [];
      const orgs: Organization[] = memberships.map((m: any) => ({
        ...m.organization,
        userRole: m.role.toLowerCase()
      }));
      setOrganizations(orgs);

      // Restore or set active org
      const savedOrgId = localStorage.getItem("activeOrgId");
      const saved = orgs.find((o) => o.id === savedOrgId);
      if (saved) {
        setActiveOrgState(saved);
        setUserRole((saved as any).userRole || null);
      } else if (orgs.length > 0) {
        setActiveOrgState(orgs[0]);
        setUserRole((orgs[0] as any).userRole || null);
        localStorage.setItem("activeOrgId", orgs[0].id);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/organizations/current/invites");
      setInvites(data.data || []);
    } catch {
      // silently fail
    }
  }, []);

  const acceptInvite = async (token: string) => {
    await apiClient.post("/organizations/invites/accept", { token });
    await fetchInvites();
    await fetchOrganizations();
  };

  const declineInvite = async (token: string) => {
    await apiClient.post("/organizations/invites/decline", { token });
    await fetchInvites();
  };

  const fetchUserRole = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/organizations/current");
      const fullOrg = data.data || data;

      // Update activeOrg with full details (like description)
      setActiveOrgState(prev => prev ? { ...prev, ...fullOrg } : fullOrg);

      const membershipsRes = await apiClient.get("/organizations");
      const memberships = membershipsRes.data.data || [];
      const currentMembership = memberships.find((m: any) => m.organizationId === activeOrg?.id);
      if (currentMembership) {
        setUserRole(currentMembership.role.toLowerCase());
      }
    } catch {
      // silently fail
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
      fetchInvites();
    }
  }, [isAuthenticated, fetchOrganizations, fetchInvites]);

  useEffect(() => {
    if (activeOrg) fetchUserRole();
  }, [activeOrg?.id, fetchUserRole]);

  const setActiveOrg = (org: Organization) => {
    setActiveOrgState(org);
    setUserRole((org as any).userRole || null);
    localStorage.setItem("activeOrgId", org.id);
  };

  const createOrganization = async (name: string, description?: string) => {
    const { data } = await apiClient.post("/organizations", { name, description });
    const newOrgData = data.data || data;
    await fetchOrganizations();
    // After fetchOrganizations, the new org will be in the list and activeOrg will be set if it's the only one
    // or we can manually find it and set it active
    const orgsRes = await apiClient.get("/organizations");
    const memberships = orgsRes.data.data || [];
    const createdMembership = memberships.find((m: any) => m.organizationId === newOrgData.id);
    if (createdMembership) {
      const mappedOrg = { ...createdMembership.organization, userRole: createdMembership.role.toLowerCase() };
      setActiveOrg(mappedOrg);
    }
    return newOrgData;
  };

  return (
    <OrgContext.Provider
      value={{
        organizations,
        activeOrg,
        userRole,
        isLoading,
        setActiveOrg,
        fetchOrganizations,
        createOrganization,
        invites,
        fetchInvites,
        acceptInvite,
        declineInvite
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within OrgProvider");
  return context;
}
