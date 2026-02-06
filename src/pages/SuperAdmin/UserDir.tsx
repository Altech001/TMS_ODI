import {
    Activity,
    Building2,
    Key,
    Lock,
    MoreHorizontal,
    RefreshCw,
    Search,
    ShieldCheck,
    ShieldOff,
    Unlock,
    User,
    Users,
} from "lucide-react";
import React, { useState } from "react";
import { Modal } from "../../components/ui/modal";

// Types
type UserStatus = "Active" | "Locked" | "Pending";
type UserRole = "SuperAdmin" | "OrgAdmin" | "Manager" | "Employee";

interface SystemUser {
    id: string;
    name: string;
    email: string;
    organization: string;
    role: UserRole;
    status: UserStatus;
    mfaEnabled: boolean;
    lastLogin: string;
}

// Mock Data
const mockUsers: SystemUser[] = [
    {
        id: "1",
        name: "Alexander Tech",
        email: "alex@techcorp.com",
        organization: "TechCorp Industries",
        role: "OrgAdmin",
        status: "Active",
        mfaEnabled: true,
        lastLogin: "2 mins ago"
    },
    {
        id: "2",
        name: "Sarah Connor",
        email: "sarah@startupxyz.io",
        organization: "StartupXYZ",
        role: "Manager",
        status: "Active",
        mfaEnabled: false,
        lastLogin: "1 hour ago"
    },
    {
        id: "3",
        name: "John Wick",
        email: "j.wick@continental.com",
        organization: "Continental",
        role: "Employee",
        status: "Locked",
        mfaEnabled: true,
        lastLogin: "3 days ago"
    },
    {
        id: "4",
        name: "Emma Frost",
        email: "emma@x-telecom.com",
        organization: "X-Telecom",
        role: "OrgAdmin",
        status: "Active",
        mfaEnabled: true,
        lastLogin: "Just now"
    },
    {
        id: "5",
        name: "David Miller",
        email: "d.miller@fintech.io",
        organization: "FinTech Pro",
        role: "Employee",
        status: "Pending",
        mfaEnabled: false,
        lastLogin: "Never"
    }
];

const UserDirectory: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [orgFilter, setOrgFilter] = useState("All Organizations");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

    const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOrg = orgFilter === "All Organizations" || user.organization === orgFilter;
        const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
        return matchesSearch && matchesOrg && matchesRole;
    });

    const stats = {
        total: mockUsers.length,
        admins: mockUsers.filter(u => u.role === "OrgAdmin").length,
        mfa: mockUsers.filter(u => u.mfaEnabled).length,
        locked: mockUsers.filter(u => u.status === "Locked").length
    };

    const handleAction = (user: SystemUser) => {
        setSelectedUser(user);
        setIsActionModalOpen(true);
    };

    const getStatusStyles = (status: UserStatus) => {
        switch (status) {
            case "Active": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "Locked": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "Pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        }
    };

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Global User Directory
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Platform-wide user management and security controls
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-brand-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-purple-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Admins</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.admins}</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-amber-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">MFA Active</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.mfa}</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-red-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Locked</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{stats.locked}</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={orgFilter}
                            onChange={(e) => setOrgFilter(e.target.value)}
                            className="px-4 py-3 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-xs font-bold text-gray-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                        >
                            <option>All Organizations</option>
                            <option>TechCorp Industries</option>
                            <option>StartupXYZ</option>
                            <option>Continental</option>
                        </select>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-3 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-xs font-bold text-gray-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                        >
                            <option>All Roles</option>
                            <option>SuperAdmin</option>
                            <option>OrgAdmin</option>
                            <option>Manager</option>
                            <option>Employee</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Organization</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">MFA</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Login</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-brand-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</div>
                                                    <div className="text-[10px] text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">{user.organization}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user.role}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.mfaEnabled ? (
                                                <div className="flex items-center gap-1 text-green-500">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">ON</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <ShieldOff className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">OFF</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-[10px] text-gray-500 uppercase">{user.lastLogin}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleAction(user)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors group"
                                            >
                                                <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1C1C1C] rounded-md border border-gray-200 dark:border-white/5">
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">No users found</h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Actions Modal */}
            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)}>
                <div className="p-6 space-y-6">
                    {selectedUser && (
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                            <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-brand-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedUser.name}</h4>
                                <p className="text-xs text-gray-500 lowercase">{selectedUser.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded-full">{selectedUser.role}</span>
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{selectedUser.organization}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Password Reset */}
                        <button className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-brand-500/50 hover:bg-brand-500/[0.02] transition-all group text-left">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <RefreshCw className="w-5 h-5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Reset Password</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Send recovery email to user</p>
                            </div>
                        </button>

                        {/* Lock / Unlock */}
                        <button className={`flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-red-500/50 hover:bg-red-500/[0.02] transition-all group text-left`}>
                            <div className={`w-10 h-10 rounded-lg ${selectedUser?.status === "Locked" ? "bg-green-500/10" : "bg-red-500/10"} flex items-center justify-center shrink-0`}>
                                {selectedUser?.status === "Locked" ? (
                                    <Unlock className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Lock className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                    {selectedUser?.status === "Locked" ? "Unlock Account" : "Lock Account"}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                                    {selectedUser?.status === "Locked" ? "Restore access immediately" : "Restrict all platform access"}
                                </p>
                            </div>
                        </button>

                        {/* MFA Management */}
                        <button className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-purple-500/50 hover:bg-purple-500/[0.02] transition-all group text-left">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Manage MFA</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Force reset or disable 2FA</p>
                            </div>
                        </button>

                        {/* Force Logout */}
                        <button className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/[0.02] transition-all group text-left">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Activity className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Force Logout</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Invalidate all active sessions</p>
                            </div>
                        </button>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                        <button
                            onClick={() => setIsActionModalOpen(false)}
                            className="px-6 py-2 bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-500 uppercase tracking-widest rounded-md hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserDirectory;
