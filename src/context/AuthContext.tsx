import React, { createContext, useContext } from "react";
import type { User } from "@/types";
import apiClient from "@/lib/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean; email: string }>;
  signup: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      try {
        const { data } = await apiClient.get("/auth/me");
        const userData = data.data?.user || data.data || data;

        if (userData && userData.name && !userData.firstName) {
          const [firstName, ...rest] = userData.name.split(" ");
          userData.firstName = firstName;
          userData.lastName = rest.join(" ");
        }
        return userData;
      } catch (error) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    const result = data.data;

    if (result?.tokens?.accessToken) {
      localStorage.setItem("accessToken", result.tokens.accessToken);
      if (result.tokens.refreshToken) {
        localStorage.setItem("refreshToken", result.tokens.refreshToken);
      }
      await refetch();
      return { requiresOtp: false, email };
    }

    if (data.accessToken || data.data?.accessToken) {
      const tokens = data.data || data;
      localStorage.setItem("accessToken", tokens.accessToken);
      if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
      await refetch();
      return { requiresOtp: false, email };
    }

    return { requiresOtp: true, email };
  };

  const signup = async (email: string, password: string, name: string, organizationName: string) => {
    await apiClient.post("/auth/signup", {
      email,
      password,
      name,
      organizationName
    });
  };

  const verifyOtp = async (email: string, otp: string) => {
    const { data } = await apiClient.post("/auth/verify-email", { email, code: otp });
    const result = data.data;

    if (result?.tokens) {
      localStorage.setItem("accessToken", result.tokens.accessToken);
      if (result.tokens.refreshToken) {
        localStorage.setItem("refreshToken", result.tokens.refreshToken);
      }
    } else if (result?.accessToken || data.accessToken) {
      const tokens = result || data;
      localStorage.setItem("accessToken", tokens.accessToken);
      if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
    }
    await refetch();
  };

  const forgotPassword = async (email: string) => {
    await apiClient.post("/auth/forgot-password", { email });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("activeOrgId");
    queryClient.setQueryData(["auth-user"], null);
    window.location.href = "/signin";
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        verifyOtp,
        forgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
