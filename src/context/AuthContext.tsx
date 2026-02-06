import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthAPI, TokenManager, User, Organization } from "../services/api";

type Role = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

const ROLE_HIERARCHY: Record<Role, number> = {
    OWNER: 5,
    ADMIN: 4,
    MANAGER: 3,
    MEMBER: 2,
    VIEWER: 1,
};

interface AuthContextType {
    user: User | null;
    organizations: Organization[];
    currentRole: Role | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
    logout: () => void;
    verifyOtp: (email: string, code: string) => Promise<void>;
    resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    hasRole: (minRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        const storedUser = TokenManager.getUser();
        const storedOrgs = TokenManager.getOrganizations();
        const accessToken = TokenManager.getAccessToken();

        if (storedUser && accessToken) {
            setUser(storedUser);
            setOrganizations(storedOrgs);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await AuthAPI.login(email, password);

        if (response.success) {
            const { user, tokens, organizations } = response.data;

            TokenManager.setTokens(tokens);
            TokenManager.setUser(user);
            TokenManager.setOrganizations(organizations);

            setUser(user);
            setOrganizations(organizations);
        }
    };

    const signup = async (email: string, password: string, name: string, organizationName: string) => {
        const response = await AuthAPI.signup(email, password, name, organizationName);

        if (response.success) {
            const { user, tokens, organizationId } = response.data;

            TokenManager.setTokens(tokens);
            TokenManager.setUser(user);

            // Create initial organization entry
            const newOrg: Organization = {
                id: organizationId,
                name: organizationName,
                role: "OWNER"
            };
            TokenManager.setOrganizations([newOrg]);

            setUser(user);
            setOrganizations([newOrg]);
        }
    };

    const logout = () => {
        AuthAPI.logout();
        setUser(null);
        setOrganizations([]);
    };

    const verifyOtp = async (email: string, code: string) => {
        await AuthAPI.verifyOtp(email, code);

        // Update user verification status
        if (user) {
            const updatedUser = { ...user, isEmailVerified: true };
            TokenManager.setUser(updatedUser);
            setUser(updatedUser);
        }
    };

    const resetPassword = async (email: string, code: string, newPassword: string) => {
        await AuthAPI.resetPassword(email, code, newPassword);
    };

    const requestPasswordReset = async (email: string) => {
        await AuthAPI.requestPasswordReset(email);
    };

    // Get current role from first organization
    const currentRole = organizations[0]?.role as Role | null;

    // Check if user has at least the minimum role
    const hasRole = (minRole: Role): boolean => {
        if (!currentRole) return false;
        return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[minRole];
    };

    const value: AuthContextType = {
        user,
        organizations,
        currentRole,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        verifyOtp,
        resetPassword,
        requestPasswordReset,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
