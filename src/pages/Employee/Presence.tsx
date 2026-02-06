import React, { useState } from "react";
import {
    Calendar,
    Clock,
    Briefcase,
    Plus,
    X,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Video,
    Coffee,
    Utensils
} from "lucide-react";

const Presence: React.FC = () => {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // Mock Data
    const weeklyAttendance = [
        { day: "Mon", date: "Feb 02", in: "09:00 AM", out: "06:00 PM", hours: "9.0h", status: "On Time" },
        { day: "Tue", date: "Feb 03", in: "08:45 AM", out: "05:30 PM", hours: "8.7h", status: "On Time" },
        { day: "Wed", date: "Feb 04", in: "09:15 AM", out: "06:15 PM", hours: "9.0h", status: "Late" },
    ];

    const [status, setStatus] = useState("working");

    const statuses = [
        { id: "available", label: "Available", icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/10" },
        { id: "working", label: "Working", icon: Briefcase, color: "text-blue-500", bgColor: "bg-blue-500/10" },
        { id: "busy", label: "Busy", icon: Clock, color: "text-red-500", bgColor: "bg-red-500/10" },
        { id: "meeting", label: "Meeting", icon: Video, color: "text-purple-500", bgColor: "bg-purple-500/10" },
        { id: "break", label: "Break", icon: Coffee, color: "text-amber-500", bgColor: "bg-amber-500/10" },
        { id: "lunch", label: "Lunch", icon: Utensils, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    ];

    const currentStatus = statuses.find(s => s.id === status) || statuses[1];

    const statusHistory = [
        { time: "09:00 AM", action: "Clocked In", location: "Office / Desk 4", type: "check" },
        { time: "12:30 PM", action: "Status: On Break", location: "N/A", type: "break" },
        { time: "01:30 PM", action: "Status: Active", location: "Meeting Room A", type: "active" },
        { time: "06:00 PM", action: "Clocked Out", location: "N/A", type: "out" },
    ];

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Presence & Attendance</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Monitor your time, availability, and leave requests.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 dark:bg-[#2A2A2A] rounded p-1 border border-gray-200 dark:border-white/5">
                        <div className={`px-3 py-1.5 ${currentStatus.bgColor} ${currentStatus.color} text-[11px] font-bold rounded flex items-center gap-2 transition-colors duration-300`}>
                            <span className={`w-2 h-2 rounded-full ${currentStatus.id === 'available' ? 'bg-green-500' :
                                currentStatus.id === 'working' ? 'bg-blue-500' :
                                    currentStatus.id === 'busy' ? 'bg-red-500' :
                                        currentStatus.id === 'meeting' ? 'bg-purple-500' :
                                            currentStatus.id === 'break' ? 'bg-amber-500' : 'bg-orange-500'} animate-pulse`}></span>
                            {currentStatus.label.toUpperCase()} NOW
                        </div>
                    </div>

                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 rounded text-xs font-bold transition-all active:scale-95 shadow-lg shadow-brand-500/10"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Leave Request</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Columns - Attendance & History */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Weekly Attendance Grid */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4 text-brand-500" />
                            <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Weekly Attendance</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {weeklyAttendance.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded p-4 flex flex-col gap-3 group hover:border-gray-300 dark:hover:border-white/10 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{item.day}</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.date}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <Clock className="w-3 h-3 text-brand-500/60" />
                                            <span>{item.in} - {item.out}</span>
                                        </div>
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${item.status === 'Late' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {item.status}
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-2 border-t border-gray-200 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">{item.hours} Total</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Status History Log */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Today's Activity Log</h2>
                        </div>
                        <div className="bg-white dark:bg-[#2A2A2A]/20 border border-gray-200 dark:border-white/5 rounded divide-y divide-gray-200 dark:divide-white/5">
                            {statusHistory.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.type === 'check' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                            item.type === 'break' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                                'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                            }`}>
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">{item.action}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{item.location}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Leave Requests Table */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Submitted Leave Requests</h2>
                        </div>
                        <div className="bg-white dark:bg-[#2A2A2A]/20 border border-gray-200 dark:border-white/5 rounded overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left font-medium">
                                    <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date Range</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reason</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                        {[
                                            { range: "Feb 15 - Feb 20", type: "Annual Vacation", reason: "Family trip to Mombasa", status: "Pending" },
                                            { range: "Jan 12 - Jan 13", type: "Sick Leave", reason: "Severe migraine", status: "Approved" },
                                            { range: "Dec 20 - Dec 22", type: "Business Trip", reason: "Nairobi Client Meeting", status: "Approved" },
                                        ].map((req, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">{req.range}</p>
                                                    <p className="text-[9px] text-gray-600 mt-0.5 uppercase tracking-tighter">Applied on Feb 01</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-brand-500/40"></div>
                                                        <span className="text-[10px] font-bold text-gray-300 uppercase">{req.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[10px] text-gray-500 max-w-[200px] truncate">{req.reason}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest
                                                        ${req.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                            req.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                                'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column - Balance Summary */}
                <div className="space-y-8">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base text-gray-900 dark:text-white ">Leave Entitlement</h2>
                        </div>

                        {/* Balance Summary */}
                        <div className="bg-brand-500 p-6 rounded mb-4 shadow relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-white/60  mb-1">Total Balance</p>
                                <h3 className="text-3xl font-black text-white mb-6">24 Days</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-3 rounded backdrop-blur-md">
                                        <p className="text-[9px] font-bold text-white/50 uppercase">Vacation</p>
                                        <p className="text-sm font-bold text-white">18 Days</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded backdrop-blur-md">
                                        <p className="text-[9px] font-bold text-white/50 uppercase">Sick Leave</p>
                                        <p className="text-sm font-bold text-white">6 Days</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-[-20px] right-[-20px] opacity-10">
                                <Briefcase className="w-32 h-32" />
                            </div>
                        </div>
                    </section>

                    {/* Status Changer Grid */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base text-gray-900 dark:text-white">Current Availability</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {statuses.map((stat) => (
                                <button
                                    key={stat.id}
                                    onClick={() => setStatus(stat.id)}
                                    className={`relative flex flex-col items-center justify-center p-6 rounded transition-all duration-300 group
                                        ${status === stat.id
                                            ? 'bg-brand-500/5 border-brand-500 shadow-[0_4px_20px_rgba(70,95,255,0.1)] border'
                                            : 'bg-white dark:bg-[#2A2A2A]/40 border-gray-200 dark:border-white/5 border hover:border-gray-300 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-[#2A2A2A]/60'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <span className={`text-sm font-bold ${status === stat.id ? 'text-white' : 'text-gray-500'} transition-colors uppercase tracking-tight`}>
                                        {stat.label}
                                    </span>

                                    {/* Active Indicator Dot */}
                                    {status === stat.id && (
                                        <div className="absolute top-3 right-3">
                                            <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(70,95,255,0.8)]"></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Application Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 backdrop-blur-sm bg-black/40" onClick={() => setIsRequestModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1A1A1A] w-full max-w-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#222222]">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Apply for Leave</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">New absence request</p>
                            </div>
                            <button onClick={() => setIsRequestModalOpen(false)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Type Selection */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Leave Type</label>
                                    <div className="relative">
                                        <select className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-medium appearance-none cursor-pointer">
                                            <option>Annual Vacation</option>
                                            <option>Sick Leave</option>
                                            <option>Business Trip</option>
                                            <option>Maternity/Paternity</option>
                                            <option>Unpaid Leave</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                                        <input type="date" className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                                        <input type="date" className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-medium" />
                                    </div>
                                </div>

                                {/* Reason TextArea */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reason for Request</label>
                                    <textarea
                                        placeholder="Explain the reason for your leave request..."
                                        rows={4}
                                        className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 font-medium"
                                    />
                                </div>

                                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-lg flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        <span className="text-orange-400 font-bold uppercase tracking-wider block mb-1">Notice</span>
                                        Your request will be sent to your manager for approval. Please ensure you have coordinated with your team.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-[#222222] border-t border-gray-200 dark:border-white/5 flex gap-3 justify-end items-center">
                            <button
                                onClick={() => setIsRequestModalOpen(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#333333] text-gray-600 dark:text-gray-400 text-xs font-bold uppercase rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button className="px-8 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-brand-500/20">
                                Apply for Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Presence;
