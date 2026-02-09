import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Organization, OrganizationAPI, TokenManager, apiClient, OrganizationMember, Role, MembershipAPI, OrganizationInvite } from '../services/api';

// ==========================================
// Organization Context Types
// ==========================================

interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  invites: OrganizationInvite[];
  isLoading: boolean;
  error: string | null;
  isSwitching: boolean;
}

interface OrganizationContextType extends OrganizationState {
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  refreshCurrentOrganization: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization | null>;
  updateOrganization: (data: { name: string }) => Promise<void>;
  fetchMembers: () => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  leaveOrganization: () => Promise<void>;
  transferOwnership: (newOwnerId: string) => Promise<void>;
  fetchInvites: () => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (token: string) => Promise<void>;
  clearError: () => void;
}

const initialState: OrganizationState = {
  currentOrganization: null,
  organizations: [],
  members: [],
  invites: [],
  isLoading: true,
  error: null,
  isSwitching: false,
};

// ==========================================
// Organization Context
// ==========================================

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// ==========================================
// Organization Provider Component
// ==========================================

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [state, setState] = useState<OrganizationState>(initialState);

  const setPartialState = useCallback((updates: Partial<OrganizationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ==========================================
  // Fetch Organizations List
  // ==========================================
  const refreshOrganizations = useCallback(async () => {
    try {
      setPartialState({ isLoading: true, error: null });

      // Get organizations from TokenManager (set during login)
      const orgs = TokenManager.getOrganizations();

      if (orgs && orgs.length > 0) {
        setPartialState({
          organizations: orgs,
          isLoading: false,
        });

        // If no current org is selected, select the first one
        if (!apiClient.getOrganizationId() && orgs[0]) {
          const firstOrgId = orgs[0].id;
          apiClient.setOrganizationId(firstOrgId);
          setPartialState({ currentOrganization: orgs[0] });
        } else {
          // Find and set current org from list
          const currentOrgId = apiClient.getOrganizationId();
          const currentOrg = orgs.find(o => o.id === currentOrgId);
          if (currentOrg) {
            setPartialState({ currentOrganization: currentOrg });
          }
        }
      } else {
        setPartialState({ isLoading: false });
      }
    } catch (error) {
      console.error('[OrganizationContext] Error refreshing organizations:', error);
      setPartialState({
        error: 'Failed to load organizations',
        isLoading: false,
      });
    }
  }, [setPartialState]);

  // ==========================================
  // Fetch Current Organization Details
  // ==========================================
  const refreshCurrentOrganization = useCallback(async () => {
    const orgId = apiClient.getOrganizationId();
    if (!orgId) {
      console.warn('[OrganizationContext] No organization ID set');
      return;
    }

    try {
      setPartialState({ isLoading: true, error: null });

      const response = await OrganizationAPI.getCurrent();

      if (response.success && response.data) {
        // Find existing org to preserve the role
        const orgs = TokenManager.getOrganizations();
        const storedOrg = orgs.find(o => o.id === response.data.id);

        setPartialState({
          currentOrganization: {
            ...response.data,
            role: storedOrg?.role || 'MEMBER'
          },
          isLoading: false,
        });
      } else {
        setPartialState({ isLoading: false });
      }
    } catch (error) {
      console.error('[OrganizationContext] Error fetching current organization:', error);
      setPartialState({
        error: 'Failed to fetch organization details',
        isLoading: false,
      });
    }
  }, [setPartialState]);

  // ==========================================
  // Switch Organization (Optimistic Update)
  // ==========================================
  const switchOrganization = useCallback(async (orgId: string) => {
    const { organizations, currentOrganization } = state;

    // Find the target organization
    const targetOrg = organizations.find(o => o.id === orgId);
    if (!targetOrg) {
      console.error('[OrganizationContext] Organization not found:', orgId);
      return;
    }

    // Skip if already on this org
    if (currentOrganization?.id === orgId) {
      return;
    }

    // OPTIMISTIC UPDATE: Switch immediately
    setPartialState({
      currentOrganization: targetOrg,
      isSwitching: true,
      error: null,
    });

    // Update the API client to use new org ID
    apiClient.setOrganizationId(orgId);

    // Reorder organizations so selected is first (for persistence)
    const reorderedOrgs = [targetOrg, ...organizations.filter(o => o.id !== orgId)];
    TokenManager.setOrganizations(reorderedOrgs);
    setPartialState({ organizations: reorderedOrgs });

    try {
      // Fetch full details of the new organization
      const response = await OrganizationAPI.getCurrent();

      if (response.success && response.data) {
        setPartialState({
          currentOrganization: {
            ...response.data,
            role: targetOrg.role
          },
          isSwitching: false,
        });
      } else {
        // Keep optimistic update but clear switching state
        setPartialState({ isSwitching: false });
      }
    } catch (error) {
      console.error('[OrganizationContext] Error switching organization:', error);
      // Keep the optimistic update - don't revert
      setPartialState({
        error: 'Switched locally. Failed to sync with server.',
        isSwitching: false,
      });
    }
  }, [state, setPartialState]);

  // ==========================================
  // Create Organization
  // ==========================================
  const createOrganization = useCallback(async (name: string): Promise<Organization | null> => {
    try {
      setPartialState({ isLoading: true, error: null });

      const response = await OrganizationAPI.create(name);

      if (response.success && response.data) {
        const newOrg: Organization = {
          ...response.data.organization,
          role: 'OWNER'
        };

        // Add to organizations list
        const updatedOrgs = [...state.organizations, newOrg];
        TokenManager.setOrganizations(updatedOrgs);

        setPartialState({
          organizations: updatedOrgs,
          isLoading: false,
        });

        return newOrg;
      }

      setPartialState({ isLoading: false });
      return null;
    } catch (error) {
      console.error('[OrganizationContext] Error creating organization:', error);
      setPartialState({
        error: 'Failed to create organization',
        isLoading: false,
      });
      return null;
    }
  }, [state.organizations, setPartialState]);

  // ==========================================
  // Membership Management
  // ==========================================

  const fetchMembers = useCallback(async () => {
    try {
      setPartialState({ isLoading: true });
      const response = await OrganizationAPI.getMembers();
      if (response.success) {
        setPartialState({ members: response.data.members });
      }
    } catch (error) {
      console.error('[OrganizationContext] Error fetching members:', error);
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [setPartialState]);

  const inviteMember = useCallback(async (email: string, role: string) => {
    try {
      setPartialState({ isLoading: true });
      const response = await OrganizationAPI.inviteUser(email, role as any);
      if (!response.success) {
        throw new Error(response.message || 'Failed to invite member');
      }
      await fetchMembers();
    } catch (error: any) {
      console.error('[OrganizationContext] Error inviting member:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [fetchMembers, setPartialState]);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      setPartialState({ isLoading: true });
      const response = await OrganizationAPI.removeMember(memberId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove member');
      }
      await fetchMembers();
    } catch (error: any) {
      console.error('[OrganizationContext] Error removing member:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [fetchMembers, setPartialState]);

  const updateMemberRole = useCallback(async (memberId: string, role: string) => {
    try {
      setPartialState({ isLoading: true });
      const response = await MembershipAPI.updateRole(memberId, role as Role);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update member role');
      }
      await fetchMembers();
    } catch (error: any) {
      console.error('[OrganizationContext] Error updating role:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [fetchMembers, setPartialState]);

  const updateOrganization = useCallback(async (data: { name: string }) => {
    try {
      setPartialState({ isLoading: true, error: null });
      const response = await OrganizationAPI.update(data);
      if (response.success) {
        // Update current organization details
        setPartialState({
          currentOrganization: {
            ...state.currentOrganization!,
            ...response.data.organization
          }
        });
        // Also update in the organizations list if needed
        const updatedOrgs = state.organizations.map(o =>
          o.id === response.data.organization.id ? { ...o, name: response.data.organization.name } : o
        );
        setPartialState({ organizations: updatedOrgs });
        TokenManager.setOrganizations(updatedOrgs);
      }
    } catch (error: any) {
      console.error('[OrganizationContext] Error updating organization:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [state.currentOrganization, state.organizations, setPartialState]);

  const leaveOrganization = useCallback(async () => {
    try {
      setPartialState({ isLoading: true });
      const response = await MembershipAPI.leaveOrganization();
      if (response.success) {
        // Remove from local list
        const orgId = apiClient.getOrganizationId();
        const updatedOrgs = state.organizations.filter(o => o.id !== orgId);
        TokenManager.setOrganizations(updatedOrgs);

        setPartialState({
          organizations: updatedOrgs,
          currentOrganization: updatedOrgs.length > 0 ? updatedOrgs[0] : null
        });

        if (updatedOrgs.length > 0) {
          apiClient.setOrganizationId(updatedOrgs[0].id);
        } else {
          apiClient.setOrganizationId('');
        }
      }
    } catch (error: any) {
      console.error('[OrganizationContext] Error leaving organization:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [state.organizations, setPartialState]);

  const transferOwnership = useCallback(async (newOwnerId: string) => {
    try {
      setPartialState({ isLoading: true });
      const response = await OrganizationAPI.transferOwnership(newOwnerId);
      if (response.success) {
        await refreshCurrentOrganization();
      }
    } catch (error: any) {
      console.error('[OrganizationContext] Error transferring ownership:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [refreshCurrentOrganization, setPartialState]);

  const fetchInvites = useCallback(async () => {
    try {
      setPartialState({ isLoading: true });
      const response = await MembershipAPI.getPendingInvites();
      if (response.success) {
        setPartialState({ invites: response.data.invites });
      }
    } catch (error) {
      console.error('[OrganizationContext] Error fetching invites:', error);
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [setPartialState]);

  const acceptInvitation = useCallback(async (token: string) => {
    try {
      setPartialState({ isLoading: true });
      const response = await OrganizationAPI.acceptInvite(token);
      if (response.success) {
        // Refresh organizations after accepting
        await refreshOrganizations();
        await fetchInvites();
      }
    } catch (error: any) {
      console.error('[OrganizationContext] Error accepting invite:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [refreshOrganizations, fetchInvites, setPartialState]);

  const declineInvitation = useCallback(async (token: string) => {
    try {
      setPartialState({ isLoading: true });
      const response = await OrganizationAPI.declineInvite(token);
      if (response.success) {
        await fetchInvites();
      }
    } catch (error: any) {
      console.error('[OrganizationContext] Error declining invite:', error);
      setPartialState({ error: error.message });
      throw error;
    } finally {
      setPartialState({ isLoading: false });
    }
  }, [fetchInvites, setPartialState]);

  // ==========================================
  // Clear Error
  // ==========================================
  const clearError = useCallback(() => {
    setPartialState({ error: null });
  }, [setPartialState]);

  // ==========================================
  // Initial Load
  // ==========================================
  useEffect(() => {
    refreshOrganizations();
  }, [refreshOrganizations]);

  // ==========================================
  // Context Value
  // ==========================================
  const contextValue: OrganizationContextType = {
    ...state,
    switchOrganization,
    refreshOrganizations,
    refreshCurrentOrganization,
    createOrganization,
    updateOrganization,
    fetchMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    leaveOrganization,
    transferOwnership,
    fetchInvites,
    acceptInvitation,
    declineInvitation,
    clearError,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

// ==========================================
// Custom Hook
// ==========================================

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);

  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }

  return context;
};

// ==========================================
// Exports
// ==========================================

export { OrganizationContext };
export type { OrganizationContextType, OrganizationState };
