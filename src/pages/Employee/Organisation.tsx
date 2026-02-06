import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle,
    ChevronDown,
    Crown,
    Edit,
    Loader2,
    Mail,
    MapPin,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    User,
    UserPlus,
    Users,
    X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
    MembershipAPI,
    Organization,
    OrganizationAPI,
    OrganizationDetails,
    OrganizationMember,
    Role,
    TokenManager
} from "../../services/api";

// UI Types (mapped from API)
interface MemberUI {
    id: string;
    userId: string;
    name: string;
    role: Role;
    roleDisplay: string;
    status: "ACTIVE" | "OFFLINE" | "ON_LEAVE";
    email: string;
    avatar?: string;
    joinedAt: string;
}

// Map API role to display role
const getRoleDisplay = (role: string): string => {
    const roleMap: Record<string, string> = {
        "OWNER": "Organization Owner",
        "ADMIN": "Administrator",
        "MANAGER": "Manager",
        "MEMBER": "Team Member",
        "VIEWER": "Viewer"
    };
    return roleMap[role] || role;
};

// Role options for invite/update
const ROLE_OPTIONS: { value: Exclude<Role, "OWNER">; label: string; description: string }[] = [
    { value: "ADMIN", label: "Administrator", description: "Full access to manage organization" },
    { value: "MANAGER", label: "Manager", description: "Can manage projects and team members" },
    { value: "MEMBER", label: "Team Member", description: "Can view and work on assigned tasks" },
    { value: "VIEWER", label: "Viewer", description: "Read-only access to organization" },
];

// Map API member to UI format
const mapMemberToUI = (member: OrganizationMember): MemberUI => {
    return {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        role: member.role,
        roleDisplay: getRoleDisplay(member.role),
        status: "ACTIVE",
        email: member.user.email,
        joinedAt: member.joinedAt,
    };
};

// Invite Modal Component
const InviteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, role: Exclude<Role, "OWNER">) => Promise<void>;
    isLoading: boolean;
}> = ({ isOpen, onClose, onInvite, isLoading }) => {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Exclude<Role, "OWNER">>("MEMBER");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        try {
            await onInvite(email.trim(), role);
            setEmail("");
            setRole("MEMBER");
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send invite");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100000 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/10 rounded-lg w-full max-w-md mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invite Team Member</h2>
                            <p className="text-xs text-gray-500">Send an invitation to join your organization</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500 transition-all"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Role
                        </label>
                        <div className="space-y-2">
                            {ROLE_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${role === option.value
                                        ? "border-brand-500 bg-brand-500/5"
                                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={option.value}
                                        checked={role === option.value}
                                        onChange={() => setRole(option.value)}
                                        className="sr-only"
                                        disabled={isLoading}
                                    />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${role === option.value
                                        ? "border-brand-500 bg-brand-500"
                                        : "border-gray-300 dark:border-gray-600"
                                        }`}>
                                        {role === option.value && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</p>
                                        <p className="text-xs text-gray-500">{option.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Actions */}
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
                            className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Send Invite
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Create Organization Modal Component
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/10 rounded-lg w-full max-w-md mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Organization</h2>
                            <p className="text-xs text-gray-500">Start a new organization workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Company"
                            className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500 transition-all"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    {/* Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            <strong>Note:</strong> You will be the owner of this organization with full admin privileges.
                            You can invite team members after creation.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Actions */}
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
                            className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                                    Create Organization
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Organization Switcher Dropdown
const OrgSwitcher: React.FC<{
    currentOrg: OrganizationDetails | null;
    organizations: Organization[];
    onSwitch: (orgId: string) => void;
    onCreateNew: () => void;
}> = ({ currentOrg, organizations, onSwitch, onCreateNew }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 hover:border-brand-500/50 transition-all cursor-pointer"
            >
                <Building2 className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white max-w-[150px] truncate">
                    {currentOrg?.name || "Select Organization"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-[101] bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl py-2 min-w-[240px]">
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-white/10">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Organizations</p>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => {
                                        onSwitch(org.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${currentOrg?.id === org.id ? 'bg-brand-500/5' : ''
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded flex items-center justify-center ${currentOrg?.id === org.id ? 'bg-brand-500' : 'bg-gray-200 dark:bg-white/10'
                                        }`}>
                                        <Building2 className={`w-4 h-4 ${currentOrg?.id === org.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                                            }`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{org.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{org.role}</p>
                                    </div>
                                    {currentOrg?.id === org.id && (
                                        <CheckCircle className="w-4 h-4 text-brand-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-2">
                            <button
                                onClick={() => {
                                    onCreateNew();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-brand-500"
                            >
                                <div className="w-8 h-8 rounded bg-brand-500/10 flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold">Create New Organization</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Member Actions Dropdown
const MemberActions: React.FC<{
    member: MemberUI;
    onRemove: (memberId: string) => void;
    onUpdateRole: (memberId: string, role: Role) => void;
    isOwner: boolean;
}> = ({ member, onRemove, onUpdateRole, isOwner }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Don't show actions for owner
    if (member.role === "OWNER") return null;

    // Only owners/admins can manage members
    if (!isOwner) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]">
                        <button
                            onClick={() => {
                                onUpdateRole(member.id, "ADMIN");
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                            <Crown className="w-4 h-4" />
                            Make Admin
                        </button>
                        <button
                            onClick={() => {
                                onUpdateRole(member.id, "MANAGER");
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                            <Edit className="w-4 h-4" />
                            Make Manager
                        </button>
                        <button
                            onClick={() => {
                                onUpdateRole(member.id, "MEMBER");
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                            <User className="w-4 h-4" />
                            Make Member
                        </button>
                        <div className="border-t border-gray-200 dark:border-white/10 my-1" />
                        <button
                            onClick={() => {
                                onRemove(member.id);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove Member
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// Success Toast
const SuccessToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-500 text-white px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

const Organisation: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [members, setMembers] = useState<MemberUI[]>([]);
    const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [isCreatingOrg, setIsCreatingOrg] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Check if current user is owner (for permissions)
    const isOwner = true; // TODO: Get from auth context

    // Fetch organization data from API
    const fetchOrganizationData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch organization details with members
            const response = await OrganizationAPI.getCurrent();
            console.log("Organization API response:", response);

            if (response.success && response.data) {
                // API returns organization data directly on response.data
                const { members, owner, ...orgData } = response.data;
                setOrganization(orgData);

                // Map members to UI format
                if (members) {
                    const uiMembers = members.map(mapMemberToUI);
                    setMembers(uiMembers);
                }
            }
        } catch (err) {
            console.error("Failed to fetch organization:", err);
            setError(err instanceof Error ? err.message : "Failed to load organization");
        } finally {
            setIsLoading(false);
        }
    };

    // Invite new member
    const handleInvite = async (email: string, role: Exclude<Role, "OWNER">) => {
        setIsInviting(true);
        try {
            const response = await OrganizationAPI.inviteUser(email, role);
            console.log("Invite response:", response);

            if (response.success) {
                setSuccessMessage(`Invitation sent to ${email}`);
                // Refresh members list
                await fetchOrganizationData();
            }
        } finally {
            setIsInviting(false);
        }
    };

    // Remove member
    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            const response = await OrganizationAPI.removeMember(memberId);
            if (response.success) {
                setSuccessMessage("Member removed successfully");
                // Update local state
                setMembers(prev => prev.filter(m => m.id !== memberId));
            }
        } catch (err) {
            console.error("Failed to remove member:", err);
            alert(err instanceof Error ? err.message : "Failed to remove member");
        }
    };

    // Update member role
    const handleUpdateRole = async (memberId: string, role: Role) => {
        try {
            const response = await MembershipAPI.updateRole(memberId, role);
            if (response.success) {
                setSuccessMessage(`Role updated to ${getRoleDisplay(role)}`);
                // Update local state
                setMembers(prev => prev.map(m =>
                    m.id === memberId
                        ? { ...m, role, roleDisplay: getRoleDisplay(role) }
                        : m
                ));
            }
        } catch (err) {
            console.error("Failed to update role:", err);
            alert(err instanceof Error ? err.message : "Failed to update role");
        }
    };

    // Create new organization
    const handleCreateOrg = async (name: string) => {
        setIsCreatingOrg(true);
        try {
            const response = await OrganizationAPI.create(name);
            console.log("Create org response:", response);

            if (response.success) {
                setSuccessMessage(`Organization "${name}" created successfully!`);
                // Refresh organizations list
                const updatedOrgs = TokenManager.getOrganizations();
                setOrganizations(updatedOrgs);
                // Reload to show new org (in real app, would switch to new org)
                window.location.reload();
            }
        } finally {
            setIsCreatingOrg(false);
        }
    };

    // Switch organization
    const handleSwitchOrg = (orgId: string) => {
        // Update the organization context in TokenManager
        const orgs = TokenManager.getOrganizations();
        const selectedOrg = orgs.find(o => o.id === orgId);

        if (selectedOrg) {
            // Reorder so selected org is first (this is how current org is determined)
            const reorderedOrgs = [selectedOrg, ...orgs.filter(o => o.id !== orgId)];
            TokenManager.setOrganizations(reorderedOrgs);

            // Reload page to fetch new org data
            window.location.reload();
        }
    };

    // Initial load
    useEffect(() => {
        // Load organizations list from token manager
        const orgs = TokenManager.getOrganizations();
        setOrganizations(orgs);

        fetchOrganizationData();
    }, []);

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.roleDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort members: Owner first, then by name
    const sortedMembers = [...filteredMembers].sort((a, b) => {
        if (a.role === "OWNER") return -1;
        if (b.role === "OWNER") return 1;
        return a.name.localeCompare(b.name);
    });

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                    <p className="text-gray-500 font-medium text-sm">Loading organization...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center justify-center py-12 bg-red-500/5 border border-red-500/20 rounded px-12">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                    <p className="text-red-500 font-bold text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchOrganizationData}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Success Toast */}
            {successMessage && (
                <SuccessToast
                    message={successMessage}
                    onClose={() => setSuccessMessage(null)}
                />
            )}

            {/* Invite Modal */}
            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onInvite={handleInvite}
                isLoading={isInviting}
            />

            {/* Create Organization Modal */}
            <CreateOrgModal
                isOpen={showCreateOrgModal}
                onClose={() => setShowCreateOrgModal(false)}
                onCreate={handleCreateOrg}
                isLoading={isCreatingOrg}
            />

            {/* Header / Org Info */}
            <div className="bg-gray-100 dark:bg-[#1C1C1C] p-8 relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
                    <Building2 className="w-48 h-48 text-gray-900 dark:text-white" />
                </div>

                {/* Top Row: Org Name + Right Controls */}
                <div className="relative z-20 flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
                    {/* Left: Org Info */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-brand-500 rounded flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase">
                                {organization?.name || "Organization"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500 font-bold text-[12px] uppercase tracking-wider">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                                    <span>Headquarters: Kampala, Uganda</span>
                                </div>
                                <span className="w-1 h-1 rounded-full bg-gray-400 hidden md:block"></span>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-brand-500" />
                                    <span>{members.length} Members total</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Org Switcher + Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Organization Switcher */}
                        <OrgSwitcher
                            currentOrg={organization}
                            organizations={organizations}
                            onSwitch={handleSwitchOrg}
                            onCreateNew={() => setShowCreateOrgModal(true)}
                        />

                        <div className="flex items-center gap-2 bg-gray-200 dark:bg-[#2A2A2A] px-4 py-2 rounded-full border border-gray-300 dark:border-white/5">
                            <Shield className="w-4 h-4 text-brand-500" />
                            <span className="text-[12px] font-semibold text-gray-900 dark:text-white">Verified</span>
                        </div>

                        <button
                            onClick={fetchOrganizationData}
                            className="p-2.5 text-gray-500 hover:text-brand-500 bg-white dark:bg-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg border border-gray-200 dark:border-white/10 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Second Row: Search + Invite */}
                <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search members by name, role, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-medium placeholder:text-gray-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Member
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Members", value: members.length, color: "brand" },
                        { label: "Administrators", value: members.filter(m => m.role === "ADMIN" || m.role === "OWNER").length, color: "purple" },
                        { label: "Managers", value: members.filter(m => m.role === "MANAGER").length, color: "amber" },
                        { label: "Team Members", value: members.filter(m => m.role === "MEMBER" || m.role === "VIEWER").length, color: "green" },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-lg p-4"
                        >
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>


            </div>
            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedMembers.map((member) => (
                    <div key={member.id} className="bg-white dark:bg-[#1C1C1C] p-6 hover:border-brand-500/30 transition-all group relative overflow-hidden border border-gray-200 dark:border-transparent rounded-lg">
                        {/* Owner Badge */}
                        {member.role === "OWNER" && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                <Crown className="w-3 h-3" />
                                Owner
                            </div>
                        )}

                        {/* Member Actions */}
                        <div className="absolute top-3 right-3">
                            <MemberActions
                                member={member}
                                onRemove={handleRemoveMember}
                                onUpdateRole={handleUpdateRole}
                                isOwner={isOwner}
                            />
                        </div>

                        {/* Status Bar */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${member.status === 'ACTIVE' ? 'bg-green-500' :
                            member.status === 'OFFLINE' ? 'bg-gray-700' : 'bg-orange-500'
                            } opacity-40`}></div>

                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center border border-gray-200 dark:border-white/5 relative">
                                    <User className="w-7 h-7" />
                                    {/* Status Indicator */}
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1C1C1C] ${member.status === 'ACTIVE' ? 'bg-green-500' :
                                        member.status === 'OFFLINE' ? 'bg-gray-500' : 'bg-orange-500'
                                        }`}></div>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{member.name}</h3>
                                    <p className="text-[11px] font-bold text-brand-500 uppercase mt-1">{member.roleDisplay}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <div className="w-7 h-7 rounded bg-gray-100 dark:bg-white/5 flex items-center justify-center text-brand-500/60">
                                    <Mail className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">{member.email}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${member.role === "OWNER" ? "bg-amber-500/10 text-amber-500" :
                                member.role === "ADMIN" ? "bg-purple-500/10 text-purple-500" :
                                    member.role === "MANAGER" ? "bg-blue-500/10 text-blue-500" :
                                        "bg-gray-500/10 text-gray-500"
                                }`}>
                                {member.role}
                            </span>
                            {/* <button className="text-[12px] font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1.5">
                                View Profile
                                <ArrowRight className="w-3 h-3" />
                            </button> */}
                        </div>
                    </div>
                ))}

                {sortedMembers.length === 0 && (
                    <div className="col-span-full py-20 bg-white dark:bg-[#1C1C1C] border border-dashed border-gray-300 dark:border-white/10 rounded-lg flex flex-col items-center justify-center text-center">
                        <Users className="w-12 h-12 text-gray-700 mb-4" />
                        <h3 className="text-gray-900 dark:text-white font-bold uppercase">No members found</h3>
                        <p className="text-gray-600 text-xs mt-2">Try adjusting your search terms or invite new members</p>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="mt-4 flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-none text-sm font-bold transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            Invite Member
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Organisation;

