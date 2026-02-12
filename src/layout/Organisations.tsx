import { Building2, CheckCircle, ChevronDown, Loader2, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { useOrganization } from "../context/OrganizationContext";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import Label from "@/components/form/Label";

interface OrganisationSwitcherProps {
    isExpanded: boolean;
}

// Create Organization Modal
const CreateOrgModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => Promise<void>;
    isLoading: boolean;
}> = ({ isOpen, onClose, onCreate, isLoading }) => {
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Organization name is required");
            return;
        }

        if (name.trim().length < 2) {
            setError("Name must be at least 2 characters");
            return;
        }

        try {
            await onCreate(name.trim());
            setName("");
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create organization");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
            <div className="bg-white dark:bg-[#1C1C1C] w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Workspace</h2>
                            <p className="text-xs text-gray-500">Start a new business workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <Label>Business Name</Label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Business"
                            className="w-full bg-gray-50 dark:bg-[#2A2A2A] py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            <strong>Note:</strong> You will be the owner of this business with full owner privileges.
                            You can invite team members after creation.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 rounded text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Create
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

const OrganisationSwitcher: React.FC<OrganisationSwitcherProps> = ({ isExpanded }) => {
    const { currentOrganization, organizations, switchOrganization, createOrganization } = useOrganization();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleSwitch = async (orgId: string) => {
        await switchOrganization(orgId);
        setIsOpen(false);
    };

    const handleCreate = async (name: string) => {
        setIsCreating(true);
        try {
            await createOrganization(name);
        } finally {
            setIsCreating(false);
        }
    };

    // Collapsed state — just show icon
    if (!isExpanded) {
        return (
            <div className="flex justify-center px-0 mb-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-11 h-11 rounded-lg flex items-center justify-center bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-all"
                    title={currentOrganization?.name || "Select Organization"}
                >
                    <Building2 className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="relative px-3 mb-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 hover:border-brand-500/50 transition-all cursor-pointer"
                >
                    <div className="w-7 h-7 bg-brand-500 rounded flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1 text-left truncate">
                        {currentOrganization?.name || "Select Organization"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[100]"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute left-3 right-3 top-full mt-1 z-[101] bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-none shadow-xl py-2">
                            <div className="px-3 py-2 border-b border-gray-200 dark:border-white/10">
                                <p className="text-[10px] font-bold text-gray-500">My Business / Personal</p>
                            </div>

                            <div className="max-h-[240px] overflow-y-auto">
                                {organizations.map((org) => (
                                    <button
                                        key={org.id}
                                        onClick={() => handleSwitch(org.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${currentOrganization?.id === org.id ? "bg-brand-500/5" : ""
                                            }`}
                                    >
                                        <div className={`w-7 h-7 rounded flex items-center justify-center ${currentOrganization?.id === org.id ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"
                                            }`}>
                                            <Building2 className={`w-3.5 h-3.5 ${currentOrganization?.id === org.id ? "text-white" : "text-gray-500 dark:text-gray-400"
                                                }`} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white ">{org.name}</p>
                                            <p className="text-[8px] text-gray-500">{org.role}</p>
                                        </div>
                                        {currentOrganization?.id === org.id && (
                                            <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 dark:border-white/10 pt-1 mt-1">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(true);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-brand-500"
                                >
                                    <div className="w-7 h-7 rounded bg-brand-500/10 flex items-center justify-center">
                                        <Plus className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-sm font-normal">Create New Business</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <CreateOrgModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreate}
                isLoading={isCreating}
            />
        </>
    );
};

export default OrganisationSwitcher;
