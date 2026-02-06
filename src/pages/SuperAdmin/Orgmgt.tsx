import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle2,
    Cloud,
    Globe,
    HardDrive,
    Loader2,
    Pause,
    Play,
    Plus,
    Search,
    Server,
    Shield,
    Trash2,
    User,
    Users,
    X,
    Zap
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { AdminOrganization, AdminStats, SuperAdminAPI } from "../../services/api";

// Creation Wizard Component
interface WizardStep {
    id: number;
    title: string;
    icon: React.ReactNode;
}

const CreationWizard: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        orgName: "",
        domain: "",
        adminName: "",
        adminEmail: "",
        plan: "PRO" as "FREE" | "PRO" | "ENTERPRISE",
        maxUsers: 50,
        storageLimit: 100
    });

    const steps: WizardStep[] = [
        { id: 1, title: "Organization Details", icon: <Building2 className="w-4 h-4" /> },
        { id: 2, title: "Domain Setup", icon: <Globe className="w-4 h-4" /> },
        { id: 3, title: "Admin Assignment", icon: <Shield className="w-4 h-4" /> },
        { id: 4, title: "Plan Selection", icon: <Zap className="w-4 h-4" /> }
    ];

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await SuperAdminAPI.createOrganization({
                name: formData.orgName,
                domains: [formData.domain],
                plan: formData.plan,
                adminUser: {
                    name: formData.adminName,
                    email: formData.adminEmail
                },
                settings: {
                    maxUsers: formData.maxUsers,
                    storageLimit: formData.storageLimit * 1024 * 1024 * 1024 // Convert to bytes
                }
            });
            onSuccess();
            onClose();
            setCurrentStep(1);
            setFormData({
                orgName: "",
                domain: "",
                adminName: "",
                adminEmail: "",
                plan: "PRO",
                maxUsers: 50,
                storageLimit: 100
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create organization");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-0">
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl overflow-hidden">
                {/* Header */}
                <div className="p-8 bg-gradient-to-r from-brand-500/10 to-purple-500/10 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Create New Organization</h2>
                            <p className="text-sm text-gray-500 mt-1">Follow the steps to onboard a new organization</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-8">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${currentStep === step.id
                                    ? "bg-brand-500 text-white"
                                    : currentStep > step.id
                                        ? "bg-green-500/10 text-green-500"
                                        : "bg-gray-100 dark:bg-white/5 text-gray-500"
                                    }`}>
                                    {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{step.title}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-[2px] w-8 ${currentStep > step.id ? "bg-green-500" : "bg-gray-200 dark:bg-white/10"}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Organization Name</label>
                                <input
                                    type="text"
                                    value={formData.orgName}
                                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                                    placeholder="Enter organization name"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Max Users</label>
                                    <input
                                        type="number"
                                        value={formData.maxUsers}
                                        onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Storage Limit (GB)</label>
                                    <input
                                        type="number"
                                        value={formData.storageLimit}
                                        onChange={(e) => setFormData({ ...formData, storageLimit: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Primary Domain</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        placeholder="example.com"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Cloud className="w-5 h-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-500">Domain Verification Required</p>
                                        <p className="text-[11px] text-blue-400/80 mt-1">After creation, the organization admin will need to verify domain ownership by adding a DNS TXT record.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Admin Full Name</label>
                                <input
                                    type="text"
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    placeholder="John Smith"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Admin Email</label>
                                <input
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-500">First Admin Setup</p>
                                        <p className="text-[11px] text-amber-400/80 mt-1">This admin will receive an email invitation to set up their account and will have full organization management privileges.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                {["FREE", "PRO", "ENTERPRISE"].map((plan) => (
                                    <button
                                        key={plan}
                                        onClick={() => setFormData({ ...formData, plan: plan as any })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.plan === plan
                                            ? "border-brand-500 bg-brand-500/10"
                                            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${plan === "FREE" ? "bg-gray-500/10 text-gray-500" :
                                            plan === "PRO" ? "bg-brand-500/10 text-brand-500" :
                                                "bg-purple-500/10 text-purple-500"
                                            }`}>
                                            {plan === "FREE" ? <User className="w-4 h-4" /> :
                                                plan === "PRO" ? <Users className="w-4 h-4" /> :
                                                    <Building2 className="w-4 h-4" />}
                                        </div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{plan}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {plan === "FREE" ? "Up to 5 users" :
                                                plan === "PRO" ? "Up to 25 users" :
                                                    "Unlimited users"}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="p-4 bg-gray-50 dark:bg-[#2A2A2A]/50 rounded-xl space-y-3">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Summary</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Organization</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formData.orgName || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Domain</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formData.domain || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Admin</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formData.adminName || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Plan</span>
                                        <span className="font-bold text-brand-500">{formData.plan}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-[#161616] border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 1 || isSubmitting}
                        className="px-5 py-3 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Previous
                    </button>
                    {currentStep < 4 ? (
                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="px-5 py-3 bg-brand-500 hover:bg-brand-600 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            Next Step
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-3 bg-green-500 hover:bg-green-600 rounded text-xs font-bold text-white uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            {isSubmitting ? "Creating..." : "Create Organization"}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// Main Component
const OrganizationManagement: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        console.log("SuperAdmin - Starting Data Fetch Sequence...");

        // Fetch Organizations
        try {
            const orgsResponse = await SuperAdminAPI.getOrganizations(1, 100, searchQuery, statusFilter);
            console.log("SuperAdmin - Orgs API Full Response:", orgsResponse);

            if (orgsResponse && orgsResponse.success && orgsResponse.data) {
                // Map the data strictly from API, ensuring we handle different response structures
                const orgs = Array.isArray(orgsResponse.data)
                    ? orgsResponse.data
                    : (orgsResponse.data as any).organizations || [];

                setOrganizations(orgs);
            } else {
                setOrganizations([]);
            }
        } catch (err) {
            console.error("SuperAdmin - Orgs API Error:", err);
            setError("Failed to load organizations from the platform registry.");
            setOrganizations([]);
        }

        // Fetch Stats
        try {
            const statsResponse = await SuperAdminAPI.getStats();
            console.log("SuperAdmin - Stats API success:", statsResponse);
            if (statsResponse && statsResponse.success && statsResponse.data) {
                const statsData = (statsResponse.data as any).stats || statsResponse.data;
                setStats(statsData as AdminStats);
            } else {
                setStats(null);
            }
        } catch (err) {
            console.warn("SuperAdmin - Stats API Error:", err);
            setStats(null); // No fallback as requested
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
        // Debounce search could be added here
    }, [searchQuery, statusFilter]);

    // Handle delete/suspend
    const handleDeleteOrg = async (orgId: string) => {
        if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) return;
        try {
            await SuperAdminAPI.deleteOrganization(orgId);
            fetchData(); // Refresh list
        } catch (err) {
            console.error("Delete Error:", err);
            alert("Failed to delete organization: " + (err instanceof Error ? err.message : "Unknown error"));
        }
    };

    const statusColors = {
        ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
        SUSPENDED: "bg-red-500/10 text-red-500 border-red-500/20",
        PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    };

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Organization Management
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage all organizations in your platform</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 text-gray-500 transition-all"
                    >
                        <AlertCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-brand-500 hover:bg-brand-600 rounded text-sm font-bold text-white tracking-widest transition-all group"
                    >
                        <Plus className="w-4 h-4" />
                        Create Organization
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-3 text-red-500">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                    <button
                        onClick={fetchData}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-md hover:bg-red-600 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-brand-500" />
                            <span className="text-[12px] font-bold text-gray-500 uppercase">Total Orgs</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrganizations}</p>
                    </div>
                    {/* ... other stats ... */}
                    <div className="bg-white dark:bg-[#1C1C1C] border-green-500/20 p-4 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                            <Play className="w-4 h-4 text-green-500" />
                            <span className="text-[12px] font-bold text-gray-500 uppercase">Active</span>
                        </div>
                        <p className="text-2xl font-bold text-green-500">{stats.activeOrganizations}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1C] border-red-500/20 p-4 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                            <Pause className="w-4 h-4 text-red-500" />
                            <span className="text-[12px] font-bold text-gray-500 uppercase">Suspended</span>
                        </div>
                        <p className="text-2xl font-bold text-red-500">{stats.suspendedOrganizations}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-white/5 p-4 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="text-[12px] font-bold text-gray-500 uppercase">Total Users</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-white/5 p-4 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="w-4 h-4 text-amber-500" />
                            <span className="text-[12px] font-bold text-gray-500 uppercase">Storage</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.totalStorage / 1024 / 1024 / 1024).toFixed(1)}<span className="text-sm text-gray-500">GB</span></p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-white/5 p-4 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                            <Server className="w-4 h-4 text-blue-500" />
                            <span className="text-[12px] font-bold text-gray-500 uppercase">Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search organizations..."
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1C1C1C] rounded-md border border-gray-200 dark:border-white/5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded">
                            {["All", "ACTIVE", "SUSPENDED", "PENDING"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === status
                                        ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Organization Cards Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {organizations && organizations.length > 0 ? (
                            organizations.map((org: any) => {
                                // Extract organization data - handle both direct and nested structure
                                const orgData = org.organization || org;
                                const orgId = orgData.id || orgData._id || org.id || org._id;
                                const orgName = orgData.name || orgData.orgName || org.name || org.orgName;
                                const orgSlug = orgData.slug || orgData.domain || org.slug || org.domain;
                                const orgStatus = orgData.status || org.role === "OWNER" ? "ACTIVE" : (org.status || "UNKNOWN");
                                const memberCount = orgData.memberCount || orgData.usersCount || org.memberCount || org.usersCount || 0;

                                // Owner handling
                                const ownerName = orgData.owner?.name || org.adminUser?.name || "System Admin";
                                const ownerEmail = orgData.owner?.email || org.adminUser?.email;

                                return (
                                    <div
                                        key={orgId || Math.random()}
                                        className="group bg-white dark:bg-[#1C1C1C] dark:border-white/5 rounded-md p-6 hover:border-brand-500/30 transition-all duration-300 relative overflow-hidden flex flex-col h-full border border-gray-200"
                                    >
                                        {/* Delete Button (visible on hover) */}
                                        <button
                                            onClick={() => handleDeleteOrg(orgId)}
                                            className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                            title="Delete Organization"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Header */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-md flex items-center justify-center text-brand-500 bg-brand-50 dark:bg-brand-500/10 shrink-0">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0 pr-8">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate" title={orgName}>
                                                    {orgName || "Unnamed Org"}
                                                </h3>
                                                <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5 truncate">
                                                    {orgSlug || "No domain"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Owner Info */}
                                        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg">
                                            <div className="w-8 h-8 rounded-md bg-white dark:bg-white/5 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{ownerName}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{ownerEmail}</p>
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                            <div>
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${statusColors[(orgStatus as keyof typeof statusColors)] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                                    {orgStatus}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Users className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{memberCount} Users</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">No organizations found</h3>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Creation Wizard Modal */}
            <CreationWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setIsWizardOpen(false);
                }}
            />
        </div>
    );
};

export default OrganizationManagement;
