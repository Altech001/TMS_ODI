import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Array<"OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER">;
}

/**
 * ProtectedRoute component that handles:
 * 1. Authentication check - redirects to signin if not authenticated
 * 2. Role-based access - redirects to unauthorized if user doesn't have required role
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, organizations } = useAuth();
    const location = useLocation();

    // Show nothing while loading auth state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1A1A1A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to signin if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && allowedRoles.length > 0) {
        // Get the user's role from their organizations (use the first/current organization)
        const currentOrg = organizations[0];
        const userRole = currentOrg?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
