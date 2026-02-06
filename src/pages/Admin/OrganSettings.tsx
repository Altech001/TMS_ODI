import {
    Building2,
    Calendar,
    ChevronRight,
    Clock,
    Globe,
    Layout,
    Lock,
    Palette,
    Plus,
    Save,
    Settings2,
    Shield,
    Upload,
    Wallet
} from "lucide-react";
import React, { useState } from "react";

const OrganizationSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"branding" | "policies">("branding");

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Organization Settings
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Configure your organization's branding, policies, and global rules
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded text-sm font-bold uppercase tracking-widest transition-all">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 inline-flex rounded-md">
                <button
                    onClick={() => setActiveTab("branding")}
                    className={`px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "branding"
                            ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                >
                    <Palette className="w-3.5 h-3.5" />
                    Branding
                </button>
                <button
                    onClick={() => setActiveTab("policies")}
                    className={`px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "policies"
                            ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                >
                    <Shield className="w-3.5 h-3.5" />
                    Policies
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === "branding" ? (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                            {/* Logo & Visuals */}
                            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-6">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Layout className="w-4 h-4 text-brand-500" />
                                    Identity & Visuals
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Organization Logo</p>
                                        <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center group hover:border-brand-500 transition-colors cursor-pointer">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-brand-500" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Click to upload logo</p>
                                            <p className="text-[10px] text-gray-500 mt-1">PNG, SVG or JPG (max. 2MB)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Primary Brand Color</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-brand-500 ring-4 ring-brand-500/10 shadow-lg cursor-pointer"></div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        defaultValue="#465FFF"
                                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Accent Color</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-purple-500 ring-4 ring-purple-500/10 shadow-lg cursor-pointer"></div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        defaultValue="#A855F7"
                                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Domain Management */}
                            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-6">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-brand-500" />
                                    Custom Domain
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="tms.yourcompany.com"
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button className="px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-all">
                                            Verify DNS
                                        </button>
                                    </div>
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                        <p className="text-[11px] text-blue-500/80 font-bold uppercase tracking-tight">Active Domain: app.techcorp.io</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            {/* Working Hours */}
                            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-brand-500" />
                                        Standard Working Hours
                                    </h3>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-all">
                                        <Settings2 className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {["Start Time", "End Time", "Lunch Start", "Lunch Duration"].map((label) => (
                                        <div key={label}>
                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
                                            <div className="px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-900 dark:text-white text-center">
                                                {label.includes("Time") ? "09:00 AM" : label.includes("Duration") ? "45 mins" : "01:00 PM"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-purple-500" />
                                            Expense Categories
                                        </h3>
                                        <Plus className="w-4 h-4 text-brand-500 cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        {["Travel", "Software", "Equipment", "Logistics", "Client Meals"].map((cat) => (
                                            <div key={cat} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg group transition-all">
                                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-tight">{cat}</span>
                                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-green-500" />
                                            Leave Types
                                        </h3>
                                        <Plus className="w-4 h-4 text-brand-500 cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        {["Annual Leave", "Sick Leave", "Self-Study", "Parental Leave", "Unpaid Leave"].map((cat) => (
                                            <div key={cat} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg group transition-all">
                                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-tight">{cat}</span>
                                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info/Status */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-brand-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">TechCorp Industries</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Enterprise Plan</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Current Storage</p>
                                    <span className="text-[10px] font-bold text-gray-900 dark:text-white">1.2 TB / 5 TB</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-[24%] bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Seats</p>
                                    <span className="text-[10px] font-bold text-gray-900 dark:text-white">156 / 200</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-[78%] bg-brand-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0f172a] rounded-xl p-6 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <Lock className="w-8 h-8 text-blue-400 mb-4" />
                            <h4 className="text-sm font-bold uppercase tracking-tight mb-2">Global Security Mode</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-tighter mb-4 font-bold">
                                Security policies are managed at the organization level. This overrides individual employee settings.
                            </p>
                            <button className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-1">
                                Review Audit Logs <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationSettings;
