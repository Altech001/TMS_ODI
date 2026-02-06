import {
    Clock,
    Download,
    Filter,
    MoreHorizontal,
    Search,
    User,
    Users
} from "lucide-react";
import React, { useState } from "react";

// Types
type EmployeeStatus = "AVAILABLE" | "IN_MEETING" | "AT_LUNCH" | "BUSY" | "AWAY" | "OFFLINE";

interface PresenceEntry {
    id: string;
    name: string;
    status: EmployeeStatus;
    lastUpdate: string;
    department: string;
}

interface AttendanceRecord {
    id: string;
    date: string;
    clockIn: string;
    clockOut: string;
    totalHours: string;
    status: "Ontime" | "Late" | "Early Departure";
}

// Mock Data
const mockPresence: PresenceEntry[] = [
    { id: "1", name: "Jane Doe", status: "AVAILABLE", lastUpdate: "3 mins ago", department: "Engineering" },
    { id: "2", name: "Robert Fox", status: "IN_MEETING", lastUpdate: "12 mins ago", department: "Product" },
    { id: "3", name: "Cody Fisher", status: "AT_LUNCH", lastUpdate: "25 mins ago", department: "Design" },
    { id: "4", name: "Esther Howard", status: "BUSY", lastUpdate: "Just now", department: "Human Resources" },
    { id: "5", name: "David Miller", status: "AVAILABLE", lastUpdate: "5 mins ago", department: "Engineering" },
    { id: "6", name: "Emma Frost", status: "AWAY", lastUpdate: "1 hour ago", department: "Marketing" },
    { id: "7", name: "John Wick", status: "OFFLINE", lastUpdate: "4 hours ago", department: "Security" },
    { id: "8", name: "Sarah Connor", status: "AVAILABLE", lastUpdate: "1 min ago", department: "Operations" }
];

const mockAttendance: AttendanceRecord[] = [
    { id: "1", date: "2024-03-24", clockIn: "08:55 AM", clockOut: "05:05 PM", totalHours: "8h 10m", status: "Ontime" },
    { id: "2", date: "2024-03-23", clockIn: "09:15 AM", clockOut: "06:20 PM", totalHours: "9h 05m", status: "Late" },
    { id: "3", date: "2024-03-22", clockIn: "08:45 AM", clockOut: "04:30 PM", totalHours: "7h 45m", status: "Early Departure" },
    { id: "4", date: "2024-03-21", clockIn: "08:58 AM", clockOut: "05:15 PM", totalHours: "8h 17m", status: "Ontime" }
];

const PresenceMonitor: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"status" | "reports">("status");

    const getStatusColor = (status: EmployeeStatus) => {
        switch (status) {
            case "AVAILABLE": return "bg-green-500";
            case "IN_MEETING": return "bg-blue-500";
            case "AT_LUNCH": return "bg-amber-500";
            case "BUSY": return "bg-red-500";
            case "AWAY": return "bg-gray-400";
            case "OFFLINE": return "bg-gray-800 dark:bg-gray-600";
        }
    };

    const filteredPresence = mockPresence.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Presence & Attendance
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Real-time status tracking and attendance history
                    </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md">
                    <button
                        onClick={() => setActiveTab("status")}
                        className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "status"
                                ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        Live Status
                    </button>
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "reports"
                                ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Reports
                    </button>
                </div>
            </div>

            {activeTab === "status" ? (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees by name or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>
                        <button className="px-6 py-3 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 hover:bg-gray-50 transition-all">
                            <Filter className="w-4 h-4" />
                            Department
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredPresence.map((p) => (
                            <div key={p.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-5 group hover:border-brand-500/30 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1C1C1C] ${getStatusColor(p.status)}`}></div>
                                    </div>
                                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md">
                                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{p.name}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{p.department}</p>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${p.status === "AVAILABLE" ? "bg-green-500/10 text-green-500" : "bg-gray-100 dark:bg-white/5 text-gray-500"
                                        }`}>
                                        {p.status.replace("_", " ")}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{p.lastUpdate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Recent Attendance History</h2>
                        <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                            <Download className="w-3.5 h-3.5" />
                            Export CSV
                        </button>
                    </div>

                    <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Clock In</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Clock Out</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Work Hours</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {mockAttendance.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{rec.date}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{rec.clockIn}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{rec.clockOut}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-brand-500">{rec.totalHours}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${rec.status === "Ontime" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                    rec.status === "Late" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                }`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-[10px] font-bold text-gray-400 hover:text-brand-500 uppercase tracking-widest">Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresenceMonitor;
