import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";

interface Organization {
    id: string;
    name: string;
    plan: string;
    logo?: string;
}

const organizations: Organization[] = [
    { id: "1", name: "Odixecth", plan: "Enterprise", logo: "OE" },
    { id: "2", name: "Yiga Kati", plan: "Pro", logo: "YK" },
    { id: "3", name: "Hspot Agent", plan: "Free", logo: "HA" },
];

const OrganisationSwitcher: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(organizations[0]);
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

    if (!isExpanded) {
        return (
            <div className="flex justify-center py-2">
                <div
                    className="w-10 h-10 rounded-none bg-gray-100 dark:bg-[#2A2A2A] flex items-center justify-center text-gray-900 dark:text-white font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-[#3A3A3A] transition-colors overflow-hidden"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selectedOrg.logo}
                </div>
            </div>
        );
    }

    return (
        <div className="relative px-3 mb-6 border-b " ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-2  bg-gray-100 dark:bg-[#2A2A2A]/50 hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-all duration-200 group"
            >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-brand-500 font-bold border border-brand-500/20 group-hover:scale-105 transition-transform">
                    {selectedOrg.logo}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selectedOrg.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{selectedOrg.plan}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute left-3 right-3 mt-2 py-2 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <p className="px-4 py-2 text-[10px] uppercase font-bold text-gray-500 tracking-widest">Your Organizations</p>
                    <div className="max-h-[240px] overflow-y-auto no-scrollbar">
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => {
                                    setSelectedOrg(org);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${selectedOrg.id === org.id ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-[#1A1A1A] flex items-center justify-center text-xs font-bold border border-gray-200 dark:border-white/5">
                                    {org.logo}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium">{org.name}</p>
                                    <p className="text-[10px] opacity-50">{org.plan}</p>
                                </div>
                                {selectedOrg.id === org.id && <Check className="w-4 h-4 text-brand-500" />}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/5">
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                            <Plus className="w-4 h-4" />
                            <span>Create New Org</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganisationSwitcher;
