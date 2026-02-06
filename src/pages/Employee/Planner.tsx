import {
    ArrowLeft,
    Calendar,
    ChevronRight,
    Clock,
    ExternalLink,
    Grid,
    LayoutList,
    Play,
    Search,
    User,
    Users,
    Video
} from "lucide-react";
import React, { useState } from "react";

// Types
type MeetingStatus = "LIVE" | "ENDED" | "CANCELLED" | "UPCOMING";
type ViewMode = "GRID" | "LIST";

interface Meeting {
    id: string;
    title: string;
    description: string;
    host: string;
    date: string;
    time: string;
    duration: string;
    status: MeetingStatus;
    attendees: number;
    link?: string;
}

const Planner: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>("GRID");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

    const meetings: Meeting[] = [
        {
            id: "MT-101",
            title: "Weekly Product Sync",
            description: "Reviewing the current progress of the Q1 roadmap and addressing any blockers in the frontend development cycle. This meeting will cover the deployment strategies and the integration of the new design system components.",
            host: "Sarah Konnor",
            date: "Feb 05, 2026",
            time: "09:00 AM",
            duration: "45 mins",
            status: "LIVE",
            attendees: 12,
            link: "https://zoom.us/j/12345678"
        },
        {
            id: "MT-102",
            title: "Design System Workshop",
            description: "Collaborative session to refine the new dark theme components and accessibility guidelines for the mobile app.",
            host: "Michael Chen",
            date: "Feb 05, 2026",
            time: "11:30 AM",
            duration: "1 hour",
            status: "UPCOMING",
            attendees: 5
        },
        {
            id: "MT-103",
            title: "Frontend Tech Spill",
            description: "Discussing the migration plan for the new state management library and performance optimization techniques.",
            host: "Alex Altech",
            date: "Feb 04, 2026",
            time: "03:00 PM",
            duration: "30 mins",
            status: "ENDED",
            attendees: 8
        }
    ];

    const filteredMeetings = meetings.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.host.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const StatusBadge = ({ status }: { status: MeetingStatus }) => {
        const styles = {
            LIVE: "bg-red-500/10 text-red-500 border-red-500/20",
            UPCOMING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            ENDED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
            CANCELLED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        };

        return (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 text-[12px] uppercase  ${styles[status]}`}>
                {status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                {status}
            </div>
        );
    };


    // Meeting Details Wizard Page
    if (selectedMeeting) {
        return (
            <div className="min-h-screen animate-in slide-in-from-right duration-500 pb-10 flex flex-col items-center">
                <div className="w-full max-w-5xl space-y-8">
                    {/* Navigation */}
                    <button
                        onClick={() => setSelectedMeeting(null)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Planner
                    </button>

                    {/* Main Content Card */}
                    <div className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-2 pointer-events-none">
                            <Video className="w-64 h-64 text-white" />
                        </div>

                        <div className="relative z-10 space-y-10">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 flex items-center justify-center text-brand-500">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.6428 2.3972 15.2294 3.1449 16.6502L2.02855 20.9386C1.99198 21.0791 1.99199 21.2266 2.02858 21.367C2.1469 21.8213 2.6111 22.0937 3.06538 21.9753L7.35578 20.8583C8.77516 21.6039 10.3596 22 12 22C17.5228 22 22 17.5228 22 12ZM12 8C13.1046 8 14 8.89543 14 10V14C14 15.1046 13.1046 16 12 16H9C7.89543 16 7 15.1046 7 14V10C7 8.89543 7.89543 8 9 8H12ZM15 13.1619V10.8382L16.7344 9.19628C17.2125 8.7437 18 9.08261 18 9.74093V14.2591C18 14.9174 17.2125 15.2563 16.7344 14.8037L15 13.1619Z" fill="#ffffff" />
                                            </svg>
                                        </div>
                                        <StatusBadge status={selectedMeeting.status} />
                                    </div>
                                    <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">
                                        {selectedMeeting.title}
                                    </h1>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        Meeting ID: <span className="text-gray-900 dark:text-white">{selectedMeeting.id}</span>
                                    </p>
                                </div>

                                {selectedMeeting.status === 'LIVE' && (
                                    <button className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-5 transition-all hover:scale-105 active:scale-95 text-sm self-start">
                                        <Play className="w-5 h-5 fill-current" />
                                        Join Live Meeting
                                    </button>
                                )}

                                {selectedMeeting.status === 'UPCOMING' && (
                                    <button className="flex items-center gap-3 bg-brand-500 hover:bg-brand-600 text-white px-8 py-5 transition-all hover:scale-105 active:scale-95 text-sm self-start">
                                        <Calendar className="w-5 h-5" />
                                        Sync to Calendar
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Left Side - Info */}
                                <div className="lg:col-span-7 space-y-10">
                                    {/* Description */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                                            Agenda & Objectives
                                        </div>
                                        <div className="text-sm text-gray-300 leading-relaxed">
                                            {selectedMeeting.description}
                                        </div>
                                    </div>

                                    {/* Attendees Stack */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-600">

                                            Confirmed Participants ({selectedMeeting.attendees})
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2A2A2A] border-4 border-white dark:border-[#1C1C1C] flex items-center justify-center overflow-hidden">
                                                        <User className="w-6 h-6 text-gray-600" />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs font-bold text-gray-500">
                                                <span className="text-gray-900 dark:text-white">Sarah, Michael, Alex</span> and 9 others are attending
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Details Card */}
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="space-y-8">
                                        {selectedMeeting.link && (
                                            <div className="pt-6 ">
                                                <p className="text-[9px] font-bold text-gray-500 uppercase mb-3">Instant Join Shortcut</p>
                                                <div className="flex items-center justify-between p-3 rounded group cursor-pointer hover:bg-gray-100 dark:hover:bg-black/30 transition-all border border-gray-200 dark:border-white/5">
                                                    <span className="text-[10px] font-mono text-brand-400 select-all truncate max-w-[200px]">{selectedMeeting.link}</span>
                                                    <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border rounded-lg flex gap-3">
                                        <p className="text-[10px] text-gray-400 leading-relaxed">
                                            This meeting is being recorded for auditing and documentation purposes. Please notify the host if you have any concerns.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Meeting Planner</h1>
                    <p className="text-sm text-gray-500 mt-1 ">Schedule and manage your daily collaborative sessions.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            type="text"
                            placeholder="Search meetings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md py-2 px-10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-gray-400 dark:placeholder:text-gray-700"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-white dark:bg-[#1C1C1C] p-1 rounded border border-gray-200 dark:border-white/5">
                        <button
                            onClick={() => setViewMode("GRID")}
                            className={`p-1.5 rounded transition-all ${viewMode === 'GRID' ? 'bg-gray-100 dark:bg-[#2A2A2A] text-brand-500 border border-gray-200 dark:border-white/5' : 'text-gray-600 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("LIST")}
                            className={`p-1.5 rounded transition-all ${viewMode === 'LIST' ? 'bg-gray-100 dark:bg-[#2A2A2A] text-brand-500 border border-gray-200 dark:border-white/5' : 'text-gray-600 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === "GRID" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredMeetings.map((meeting) => (
                        <div
                            key={meeting.id}
                            onClick={() => setSelectedMeeting(meeting)}
                            className="bg-white dark:bg-[#1C1C1C] rounded overflow-hidden hover:border-brand-500/30 transition-all group cursor-pointer relative shadow border border-gray-200 dark:border-transparent"
                        >
                            {/* Card Hero / Media Section (Matching your design) */}
                            <div className="relative">
                                <div className="h-44 bg-gray-100 dark:bg-[#2A2A2A]/40 flex items-center justify-center border-b border-gray-200 dark:border-white/5 overflow-hidden">
                                    {/* Large Centered Icon */}
                                    <div className="">
                                        <svg width="54" height="54" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.0001 15.5V13.5L19.6001 10.0333C19.8519 9.69759 20.2471 9.5 20.6667 9.5C21.4031 9.5 22.0001 10.097 22.0001 10.8333V18.1667C22.0001 18.903 21.4031 19.5 20.6667 19.5C20.2471 19.5 19.8519 19.3024 19.6001 18.9667L17.0001 15.5Z" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M10.4694 6.02506C10.4762 5.99165 10.5239 5.99165 10.5308 6.02506C10.8853 7.75942 12.2406 9.11481 13.975 9.4693C14.0084 9.47613 14.0084 9.52387 13.975 9.5307C12.2406 9.88519 10.8853 11.2406 10.5308 12.9749C10.5239 13.0084 10.4762 13.0084 10.4694 12.9749C10.1149 11.2406 8.75948 9.88519 7.02512 9.5307C6.99171 9.52387 6.99171 9.47613 7.02512 9.4693C8.75948 9.11481 10.1149 7.75942 10.4694 6.02506Z" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M5.55169 6.99951C4.64946 7.11727 3.99393 7.34391 3.46243 7.78011C3.25989 7.94632 3.07418 8.13204 2.90796 8.33458C2 9.44093 2 11.0848 2 14.3723C2 17.6598 2.00005 19.4314 2.908 20.5377C3.07422 20.7402 3.25994 20.926 3.46247 21.0922C4.56882 22.0001 6.21257 22.0001 9.50005 22.0001C12.7875 22.0001 14.4313 22.0001 15.5376 21.0922C15.7402 20.926 15.9259 20.7402 16.0921 20.5377C17 19.4314 17 17.7876 17 14.5001C17 12.3181 17 10.8601 16.7345 9.80283" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M15.1207 2.30967C15.2051 1.89678 15.795 1.89678 15.8794 2.30967C16.0658 3.22159 16.7785 3.93424 17.6904 4.12063C18.1033 4.20503 18.1033 4.79497 17.6904 4.87937C16.7785 5.06576 16.0658 5.77841 15.8794 6.69033C15.795 7.10322 15.2051 7.10322 15.1207 6.69033C14.9343 5.77841 14.2217 5.06576 13.3097 4.87937C12.8968 4.79497 12.8968 4.20503 13.3097 4.12063C14.2217 3.93424 14.9343 3.22159 15.1207 2.30967Z" fill="#ffffff" />
                                        </svg>
                                    </div>

                                    {/* Status Overlay */}
                                    <div className="absolute top-4 right-4">
                                        <StatusBadge status={meeting.status} />
                                    </div>
                                </div>

                                {/* Initials Badge - Bottom Right (Exactly matching your design) */}
                                <div className="absolute -bottom-6 right-6 w-12 h-12 rounded-full bg-[#8BA1C7] flex items-center justify-center z-20 shadow-xl border-[3px] border-white dark:border-[#1C1C1C] ring-4 ring-gray-200 dark:ring-white/5 transition-transform group-hover:scale-110">
                                    <span className="text-white font-black text-[11px] tracking-tighter uppercase">
                                        {meeting.host.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>

                                {/* Background Status Glow */}
                                <div className={`absolute bottom-0 left-0 h-[2px] w-full z-10 ${meeting.status === 'LIVE' ? 'bg-red-500' :
                                    meeting.status === 'UPCOMING' ? 'bg-brand-500' : 'bg-white/10'
                                    }`}></div>
                            </div>

                            <div className="p-6 pt-10 space-y-4 bg-transparent">
                                <div>
                                    <h3 className="text-base text-gray-900 dark:text-white leading-tight group-hover:text-brand-500 transition-colors">{meeting.title}</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Host Organizer: {meeting.host}</p>
                                </div>

                                <div className="flex items-center gap-4 py-3 border-y border-gray-200 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                        <Calendar className="w-3.5 h-3.5 text-brand-500/60" />
                                        <span>{meeting.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                        <Clock className="w-3.5 h-3.5 text-brand-500/60" />
                                        <span>{meeting.time}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#2A2A2A] border-2 border-white dark:border-[#1C1C1C] flex items-center justify-center">
                                                    <User className="w-3 h-3 text-gray-600" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600 uppercase">+{meeting.attendees - 3}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-brand-500 text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Details
                                        <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1C1C1C]/40 border border-gray-200 dark:border-white/5 rounded overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-medium">
                            <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Meeting & Host</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timeframe</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Attendees</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {filteredMeetings.map((meeting) => (
                                    <tr
                                        key={meeting.id}
                                        onClick={() => setSelectedMeeting(meeting)}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded bg-gray-100 dark:bg-[#2A2A2A] flex items-center justify-center text-brand-500 border border-gray-200 dark:border-white/5">
                                                    <Video className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{meeting.title}</p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{meeting.host}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{meeting.date}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{meeting.time} ({meeting.duration})</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={meeting.status} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-tight">
                                                <Users className="w-3.5 h-3.5 text-brand-500/60" />
                                                <span>{meeting.attendees} Members</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="px-4 py-1.5 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white rounded text-[9px] font-black uppercase tracking-widest transition-all">
                                                View
                                            </button>
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

export default Planner;
