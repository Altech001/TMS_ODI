import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    MoreHorizontal,
    Star,
    Target,
    User,
    Users
} from "lucide-react";
import React, { useState } from "react";

// Types
interface LeaveRequest {
    id: string;
    name: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
}

interface PerformanceReview {
    id: string;
    name: string;
    role: string;
    progress: number;
    rating?: number;
    status: "Pending" | "In Review" | "Completed";
}

// Mock Data
const mockLeaves: LeaveRequest[] = [
    { id: "1", name: "Jane Doe", type: "Annual Leave", status: "Approved", startDate: "2024-04-01", endDate: "2024-04-10" },
    { id: "2", name: "Robert Fox", type: "Sick Leave", status: "Pending", startDate: "2024-03-25", endDate: "2024-03-26" },
    { id: "3", name: "Cody Fisher", type: "Parental Leave", status: "Approved", startDate: "2024-05-01", endDate: "2024-06-01" }
];

const mockReviews: PerformanceReview[] = [
    { id: "1", name: "Robert Fox", role: "Product VP", progress: 100, rating: 4.8, status: "Completed" },
    { id: "2", name: "David Miller", role: "Sr. Developer", progress: 65, status: "In Review" },
    { id: "3", name: "Emma Frost", role: "Marketing Lead", progress: 20, status: "Pending" },
    { id: "4", name: "Sarah Connor", role: "Ops Manager", progress: 100, rating: 4.5, status: "Completed" }
];

const LeavesPerformance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"leaves" | "performance">("leaves");

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Leaves & Performance
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Track employee absences and performance review cycles
                    </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md">
                    <button
                        onClick={() => setActiveTab("leaves")}
                        className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "leaves"
                                ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Leaves
                    </button>
                    <button
                        onClick={() => setActiveTab("performance")}
                        className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "performance"
                                ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Performance
                    </button>
                </div>
            </div>

            {activeTab === "leaves" ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Calendar View */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">March 2024</h3>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                                    <button className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md text-gray-400"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                    <div key={day} className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 h-[400px]">
                                {Array.from({ length: 31 }).map((_, i) => (
                                    <div key={i} className="border-r border-b border-gray-100 dark:border-white/5 p-2 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors relative">
                                        <span className="text-[10px] font-bold text-gray-500">{i + 1}</span>
                                        {i === 24 && (
                                            <div className="absolute inset-x-1 top-6 py-1 px-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-bold text-amber-500 uppercase tracking-tighter truncate">
                                                Robert Fox • Sick
                                            </div>
                                        )}
                                        {i === 15 && (
                                            <div className="absolute inset-x-1 top-6 py-1 px-1.5 bg-brand-500/10 border border-brand-500/20 rounded text-[8px] font-bold text-brand-500 uppercase tracking-tighter truncate">
                                                Sprint Planning
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Leave Requests Sidebar */}
                    <div className="space-y-6">
                        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-brand-500" />
                            Pending Requests
                        </h2>
                        <div className="space-y-4">
                            {mockLeaves.slice(1, 4).map((leave) => (
                                <div key={leave.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-4 group hover:border-brand-500/30 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                                            <div>
                                                <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{leave.name}</h4>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{leave.type}</p>
                                            </div>
                                        </div>
                                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                                        <span>{leave.startDate} — {leave.endDate}</span>
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded">{leave.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 p-4 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-brand-500" />
                                <span className="text-[12px] font-bold text-gray-500 uppercase">Review Cycles</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">Q1 2024</p>
                        </div>
                        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 p-4 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                <ClipboardCheck className="w-4 h-4 text-purple-500" />
                                <span className="text-[12px] font-bold text-gray-500 uppercase">Participation</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">78%</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Employee Performance Tracker</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/5">
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Position</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Progress</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Average Rating</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {mockReviews.map((rev) => (
                                        <tr key={rev.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{rev.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{rev.role}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 max-w-[100px] h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${rev.progress}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500">{rev.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {rev.rating ? (
                                                    <div className="flex items-center gap-1 text-amber-500">
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        <span className="text-xs font-bold">{rev.rating}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${rev.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        rev.status === "In Review" ? "bg-brand-500/10 text-brand-500 border-brand-500/20" :
                                                            "bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10"
                                                    }`}>
                                                    {rev.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="px-4 py-1.5 bg-gray-50 dark:bg-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest rounded hover:bg-brand-500 hover:text-white transition-all">Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeavesPerformance;
