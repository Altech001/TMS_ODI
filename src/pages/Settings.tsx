import {
    Bell,
    Camera,
    ChevronRight,
    Download,
    History,
    Home,
    Lock,
    Mail,
    Shield,
    Globe,
    Calendar,
    User
} from "lucide-react";
import React, { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";
import Notifications from "./Settings/Notifications";
import OrgSettings from "./Settings/OrgSettings";
import Invitations from "./Settings/Invitations";
import AuditLogs from "./Settings/Auditlogs";

type TabType = "profile" | "organisation" | "invitation" | "audit-logs" | "notifications" | "password" | "security";

interface SecurityLog {
    id: string;
    time: string;
    details: string;
    device: string;
    location: string;
}

const Settings: React.FC = () => {
    const { user } = useAuth();
    const { currentOrganization } = useOrganization();
    const [activeTab, setActiveTab] = useState<TabType>("profile");

    const securityLogs: SecurityLog[] = [
        { id: "1", time: "09 Feb 2026 11:39AM", details: "Account Login", device: "Browser Chrome 143.0.0.0 on Linux", location: "Kampala, UG" },
        { id: "2", time: "09 Feb 2026 09:35AM", details: "Account Login", device: "Browser Mobile Chrome 144.0.0.0 with K (SM-A256E) on Android 14.0.0", location: "Kampala, UG" },
        { id: "3", time: "09 Feb 2026 09:28AM", details: "Account Login", device: "Browser Chrome 143.0.0.0 on Linux", location: "Kampala, UG" },
        { id: "4", time: "09 Feb 2026 09:09AM", details: "Account Login", device: "Browser Mobile Chrome 144.0.0.0 with K (SM-A256E) on Android 14.0.0", location: "Kampala, UG" },
        { id: "5", time: "08 Feb 2026 10:13AM", details: "Account Login", device: "Browser Chrome 143.0.0.0 on Linux", location: "Entebbe, UG" },
        { id: "6", time: "05 Feb 2026 09:37AM", details: "Account Login", device: "Browser Mobile Chrome 144.0.0.0 with K (SM-A256E) on Android 14.0.0", location: "Kampala, UG" },
    ];

    return (
        <>
            <PageMeta
                title="Settings | TMS"
                description="Manage your account settings, security, and profile."
            />
            <div className="min-h-screen pb-10 space-y-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-500">
                    <Home className="w-3 h-3" />
                    <ChevronRight className="w-3 h-3" />
                    <span>Settings</span>
                </div>

                <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-white tracking-tight uppercase">Settings</h1>

                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-md overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                    {/* Left Sidebar Tabs */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 py-8">
                        <nav className="space-y-1">
                            {[
                                { id: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
                                { id: "organisation", label: "Organisation", icon: <Lock className="w-4 h-4" /> },
                                { id: "invitation", label: "Invitation", icon: <Mail className="w-4 h-4" /> },
                                { id: "audit-logs", label: "Audit Logs", icon: <Shield className="w-4 h-4" /> },
                                { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`w-full text-left px-8 py-4 text-[10px] font-semibold uppercase tracking-widest transition-all relative flex items-center gap-3 ${activeTab === tab.id
                                        ? "text-brand-500 bg-brand-50/50 dark:bg-brand-500/5"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                                        }`}
                                >
                                    {activeTab === tab.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
                                    )}
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        {/* Decoration Icon inside sidebar area */}
                        <div className="mt-auto pt-20 px-8 flex justify-center opacity-5 dark:opacity-10 pointer-events-none select-none">
                            {activeTab === 'profile' && <User className="w-32 h-32" />}
                            {activeTab === 'password' && <Lock className="w-32 h-32" />}
                            {activeTab === 'security' && <History className="w-32 h-32" />}
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 p-8 md:p-12">
                        {activeTab === "profile" && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">My Profile</h2>
                                </div>

                                {/* Profile Header Card */}
                                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 p-8 rounded-none flex flex-col sm:flex-row items-center justify-between gap-8">
                                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-none overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                                                {user?.name ? (
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${user.name}&background=465fff&color=fff&size=200`}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-10 h-10 text-brand-500" />
                                                )}
                                            </div>
                                            <button className="absolute -bottom-1 -right-1 border p-2 bg-brand-500 text-white rounded-none shadow-lg hover:scale-110 transition-transform dark:border-gray-900 border-white">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">{user?.name || "User Name"}</h3>
                                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">
                                                {currentOrganization?.role || "Member"} at {currentOrganization?.name || "Direct Organisation"}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-6 py-3 text-[10px] font-bold bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white uppercase tracking-widest hover:border-brand-500 hover:text-brand-500 transition-all flex items-center gap-2 rounded-none">
                                        <Download className="w-4 h-4" />
                                        Change Avatar
                                    </button>
                                </div>

                                {/* Personal Info Grid */}
                                <div className="space-y-8 bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 p-8 rounded-none">
                                    <div className="border-b border-gray-100 dark:border-white/5 pb-4">
                                        <h3 className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Personal Information</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{user?.name || "—"}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-brand-500" />
                                                <p className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">{user?.email || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organisation ID</label>
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5 text-brand-500" />
                                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{currentOrganization?.id || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organisation Name</label>
                                            <div className="flex items-center gap-2">
                                                <Home className="w-3.5 h-3.5 text-brand-500" />
                                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{currentOrganization?.name || "Direct Organisation"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</label>
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-3.5 h-3.5 text-brand-500" />
                                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{currentOrganization?.role || "Member"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Created</label>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "password" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-lg">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Change Password</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Update your account password regularly to stay secure.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-md p-4 text-xs font-bold focus:outline-none focus:border-brand-500 transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">New Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-md p-4 text-xs font-bold focus:outline-none focus:border-brand-500 transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confirm Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-md p-4 text-xs font-bold focus:outline-none focus:border-brand-500 transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <button className="w-full py-4 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-md shadow-lg shadow-brand-500/20 hover:scale-[1.01] active:scale-95 transition-all">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Security Logs</h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Review your recent account activity.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase tracking-widest border border-brand-500/20 rounded hover:bg-brand-500 hover:text-white transition-all">
                                        Export All
                                    </button>
                                </div>

                                <div className="border dark:border-white/5 rounded-md overflow-hidden bg-white dark:bg-[#1C1C1C]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                                                    <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">#</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {securityLogs.map((log, idx) => (
                                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                                        <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{idx + 1}</td>
                                                        <td className="px-6 py-4 text-[10px] font-bold text-gray-600 dark:text-gray-400 w-48">{log.time}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{log.details}</p>
                                                                <p className="text-[9px] font-medium text-gray-400">{log.device}</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === "notifications" && <Notifications />}
                        {activeTab === "organisation" && <OrgSettings />}
                        {activeTab === "invitation" && <Invitations />}
                        {activeTab === "audit-logs" && <AuditLogs />}

                        {/* Placeholder for other tabs */}
                        {["password", "security"].includes(activeTab) && (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                                <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-full">
                                    <Shield className="w-12 h-12 text-gray-200 dark:text-white/5" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">{activeTab.replace('-', ' ')}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">This section is coming soon</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;
