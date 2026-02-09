import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Loader2, Building2 } from "lucide-react";
import { useOrganization } from "../context/OrganizationContext";

const OrganisationSwitcher: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => {
    const {
        currentOrganization,
        organizations,
        isSwitching,
        isLoading,
        switchOrganization,
    } = useOrganization();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get initials from org name
    const getInitials = (name: string | undefined): string => {
        if (!name) return "OR";
        return name
            .split(" ")
            .filter(Boolean)
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Handle organization selection
    const handleSelectOrg = async (orgId: string) => {
        setIsOpen(false);
        await switchOrganization(orgId);
    };

    // Loading state
    if (isLoading && !currentOrganization) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            </div>
        );
    }

    // No organizations
    if (organizations.length === 0) {
        return (
            <div className="px-3 mb-6">
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-500 font-medium">No organization</span>
                </div>
            </div>
        );
    }

    // Collapsed view
    if (!isExpanded) {
        return (
            <div className="flex justify-center py-2 relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${isSwitching
                        ? 'bg-brand-500/20 text-brand-500'
                        : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3A3A3A]'
                        }`}
                >
                    {isSwitching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        getInitials(currentOrganization?.name || "ORG")
                    )}
                </button>

                {/* Collapsed Dropdown */}
                {isOpen && (
                    <div className="absolute left-full ml-2 top-0 py-2 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg shadow-2xl z-[100] min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                        <p className="px-4 py-2 text-[10px] text-gray-500 tracking-widest uppercase">Switch Organization</p>
                        <div className="max-h-[240px] overflow-y-auto">
                            {organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => handleSelectOrg(org.id)}
                                    disabled={isSwitching}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 ${currentOrganization?.id === org.id
                                        ? "text-gray-900 dark:text-white bg-brand-500/5"
                                        : "text-gray-600 dark:text-gray-400"
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${currentOrganization?.id === org.id
                                        ? 'bg-brand-500 text-white'
                                        : 'bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5'
                                        }`}>
                                        {getInitials(org.name)}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium truncate">{org.name || 'Unknown Organization'}</p>
                                        <p className="text-[10px] opacity-50 uppercase">{org.role || 'Member'}</p>
                                    </div>
                                    {currentOrganization?.id === org.id && <Check className="w-4 h-4 text-brand-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Expanded view
    return (
        <div className="relative px-3 mb-6" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSwitching}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 group ${isSwitching
                    ? 'bg-brand-500/5 border-brand-500/20'
                    : 'bg-white dark:bg-[#2A2A2A]/50 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
            >
                {/* Org Logo/Initials */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSwitching
                    ? 'bg-brand-500/20 text-brand-500'
                    : 'bg-brand-500 text-white'
                    }`}>
                    {isSwitching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        getInitials(currentOrganization?.name || "ORG")
                    )}
                </div>

                {/* Org Info */}
                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {currentOrganization?.name || "Select Organization"}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                        {isSwitching ? 'Switching...' : (currentOrganization?.role || organizations.length + ' orgs')}
                    </p>
                </div>

                {/* Chevron */}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-3 right-3 mt-2 py-2 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <p className="px-4 py-2 text-[10px] text-gray-500 tracking-widest uppercase">Your Organizations</p>

                    <div className="max-h-[240px] overflow-y-auto no-scrollbar">
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => handleSelectOrg(org.id)}
                                disabled={isSwitching}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 ${currentOrganization?.id === org.id
                                    ? "text-gray-900 dark:text-white bg-brand-500/5"
                                    : "text-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${currentOrganization?.id === org.id
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5'
                                    }`}>
                                    {getInitials(org.name)}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium">{org.name || 'Unknown Organization'}</p>
                                    <p className="text-[10px] opacity-50 uppercase">{org.role || 'Member'}</p>
                                </div>
                                {currentOrganization?.id === org.id && <Check className="w-4 h-4 text-brand-500" />}
                            </button>
                        ))}
                    </div>

                    {/* Create New */}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/5">
                        <button
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            onClick={() => {
                                setIsOpen(false);
                                // Navigate to organization page to create new
                                window.location.href = '/organisation';
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganisationSwitcher;
