import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface UserWidgetProps {
    isExpanded: boolean;
}

const UserWidget: React.FC<UserWidgetProps> = ({ isExpanded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user, organizations, logout, isAuthenticated } = useAuth();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Get current organization role
    const currentOrg = organizations[0];
    const userRole = currentOrg?.role || "Member";

    // Format role for display
    const formatRole = (role: string): string => {
        return role.charAt(0) + role.slice(1).toLowerCase();
    };

    // Generate initials from name
    const getInitials = (name: string | undefined): string => {
        if (!name) return "U";
        return name
            .split(" ")
            .filter(Boolean)
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate("/signin");
    };

    // If not authenticated, don't show widget
    if (!isAuthenticated || !user) {
        return null;
    }

    const displayName = user.name || "User";
    const displayEmail = user.email || "";
    const avatar = getInitials(displayName);

    if (!isExpanded) {
        return (
            <div className="mt-auto pb-8 flex flex-col items-center gap-4 transition-all duration-300">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold border transition-all duration-300 relative ${isOpen ? "bg-[#333333] border-brand-500 shadow-lg scale-90" : "bg-[#2A2A2A] border-white/10 hover:border-white/20"
                        }`}
                >
                    {avatar}
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-[#1A1A1A] rounded-full"></span>
                </button>
            </div>
        );
    }

    return (
        <div className="mt-auto px-3 mb-8 relative" ref={dropdownRef}>
            {/* Premium Floating Dropdown - appears ABOVE the user row */}
            {isOpen && (
                <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#222222] rounded z-[110] overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <p className="text-xs font-bold text-white mb-0.5">{displayName}</p>
                        <p className="text-[10px] text-gray-500 truncate">{displayEmail}</p>
                    </div>

                    <div className="p-2 space-y-0.5">
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-base text-gray-400 hover:text-white  hover:text-brand-400 rounded-xl transition-all group"
                        >
                            <User className="w-4 h-4" />
                            <span>Full Profile</span>
                        </Link>

                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-base text-gray-400 hover:text-white  hover:text-brand-400 rounded-xl transition-all group"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Account Settings</span>
                        </Link>

                        <div className="h-px bg-white/5 my-1" />

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-base font-bold text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-none transition-all group"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Trigger Row */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-3 p-2.5 rounded transition-all duration-300 group ${isOpen
                    ? "bg-transparent"
                    : "bg-transparent border-transparent hover:bg-white/5"
                    }`}
            >
                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#333333] flex items-center justify-center text-white text-[10px] border border-white/10 group-hover:scale-105 transition-transform">
                        {avatar}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1A1A1A] rounded-full"></span>
                </div>

                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight tracking-tight">
                        {displayName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-brand-500"></span>
                        <p className="text-[12px] text-gray-500 leading-none">
                            {formatRole(userRole)}
                        </p>
                    </div>
                </div>

                <ChevronDown
                    className={`w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-all duration-300 ${isOpen ? "rotate-180 text-brand-500" : ""}`}
                />
            </button>
        </div>
    );
};

export default UserWidget;
