import React, { useEffect, useMemo } from "react";
import {
    Calendar,
    Clock,
    Briefcase,
    CheckCircle2,
    Video,
    Coffee,
    Utensils,
    LogOut,
    Activity,
    Timer,
    Loader2,
    AlertCircle,
    Moon,
    PowerOff
} from "lucide-react";
import { usePresence } from "../../context/PresenceContext";
import { PresenceStatus } from "../../services/api";

// ==========================================
// Status Configuration
// ==========================================

interface StatusConfig {
    id: PresenceStatus;
    label: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    bgColor: string;
    dotColor: string;
}

const statusConfigs: StatusConfig[] = [
    { id: "AVAILABLE", label: "Available", icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/10", dotColor: "bg-green-500" },
    { id: "WORKING", label: "Working", icon: Briefcase, color: "text-blue-500", bgColor: "bg-blue-500/10", dotColor: "bg-blue-500" },
    { id: "BUSY", label: "Busy", icon: Clock, color: "text-red-500", bgColor: "bg-red-500/10", dotColor: "bg-red-500" },
    { id: "IN_MEETING", label: "In Meeting", icon: Video, color: "text-purple-500", bgColor: "bg-purple-500/10", dotColor: "bg-purple-500" },
    { id: "ON_BREAK", label: "On Break", icon: Coffee, color: "text-amber-500", bgColor: "bg-amber-500/10", dotColor: "bg-amber-500" },
    { id: "AT_LUNCH", label: "At Lunch", icon: Utensils, color: "text-orange-500", bgColor: "bg-orange-500/10", dotColor: "bg-orange-500" },
    { id: "AWAY", label: "Away", icon: Moon, color: "text-gray-500", bgColor: "bg-gray-500/10", dotColor: "bg-gray-500" },
];

// ==========================================
// Helper Functions
// ==========================================

const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatDuration = (minutes: number | undefined, startedAt?: string, endedAt?: string | null): string => {
    // If duration is provided, use it
    if (minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    }

    // Otherwise calculate from startedAt and endedAt
    if (startedAt) {
        const start = new Date(startedAt);
        const end = endedAt ? new Date(endedAt) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return "<1m";
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    }

    return "—";
};

const calculateSessionTime = (startDate: Date | null): string => {
    if (!startDate || isNaN(startDate.getTime())) return "00:00:00";
    const now = new Date();
    const diff = Math.max(0, now.getTime() - startDate.getTime());
    if (isNaN(diff)) return "00:00:00";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const getStatusConfig = (status: PresenceStatus): StatusConfig => {
    return statusConfigs.find(s => s.id === status) || statusConfigs[0];
};

// ==========================================
// Presence Component
// ==========================================

const Presence: React.FC = () => {
    const {
        currentStatus,
        history,
        isLoading,
        error,
        sessionStartedAt,
        updateStatus,
        goOffline,
        goOnline,
        refreshMyHistory,
        clearError,
    } = usePresence();

    // Fetch history on mount
    useEffect(() => {
        refreshMyHistory();
    }, [refreshMyHistory]);

    // Session timer state
    const [sessionTime, setSessionTime] = React.useState("00:00:00");

    // Update session timer every second
    useEffect(() => {
        // If offline or no session start, reset timer
        if (currentStatus === "OFFLINE" || !sessionStartedAt) {
            setSessionTime("00:00:00");
            return;
        }

        // Check if sessionStartedAt is a valid date
        if (isNaN(sessionStartedAt.getTime())) {
            setSessionTime("00:00:00");
            return;
        }

        // Calculate immediately on mount
        setSessionTime(calculateSessionTime(sessionStartedAt));

        // Then update every second
        const interval = setInterval(() => {
            setSessionTime(calculateSessionTime(sessionStartedAt));
        }, 1000);

        return () => clearInterval(interval);
    }, [currentStatus, sessionStartedAt]);

    // Get current status config
    const currentStatusConfig = useMemo(() => getStatusConfig(currentStatus), [currentStatus]);

    // Today's activity from history
    const todaysActivity = useMemo(() => {
        const today = new Date().toDateString();
        return history.filter(h => new Date(h.startedAt).toDateString() === today);
    }, [history]);

    // Weekly summary from history
    const weeklySummary = useMemo(() => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weeklyData = history.filter(h => new Date(h.startedAt) >= weekAgo);

        // Group by day
        const byDay: Record<string, { total: number; statuses: PresenceStatus[] }> = {};
        weeklyData.forEach(h => {
            const day = new Date(h.startedAt).toDateString();
            if (!byDay[day]) {
                byDay[day] = { total: 0, statuses: [] };
            }
            byDay[day].total += h.duration || 0;
            byDay[day].statuses.push(h.status);
        });

        return Object.entries(byDay)
            .map(([day, data]) => ({
                day: new Date(day).toLocaleDateString("en-US", { weekday: "short" }),
                date: new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hours: (data.total / 60).toFixed(1) + "h",
                mainStatus: data.statuses[0] || "OFFLINE",
            }))
            .slice(0, 5);
    }, [history]);

    // Handle status change - don't block on loading, optimistic update handles UI
    const handleStatusChange = async (status: PresenceStatus) => {
        if (status === currentStatus) return;
        await updateStatus(status);
        // Refresh history after a delay
        setTimeout(() => refreshMyHistory(), 1000);
    };

    // Handle go offline
    const handleGoOffline = async () => {
        await goOffline();
        setTimeout(() => refreshMyHistory(), 1000);
    };

    const isOffline = currentStatus === "OFFLINE";

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-10">
            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                    <button onClick={clearError} className="text-red-500 hover:text-red-400 text-sm font-medium">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Presence & Attendance</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Monitor your time and availability status.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Current Status Badge */}
                    <div className="flex bg-gray-100 dark:bg-[#2A2A2A] rounded p-1 border border-gray-200 dark:border-white/5">
                        <div className={`px-3 py-1.5 ${currentStatusConfig.bgColor} ${currentStatusConfig.color} text-[11px] font-bold rounded flex items-center gap-2 transition-colors duration-300`}>
                            {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <span className={`w-2 h-2 ${currentStatusConfig.dotColor} ${!isOffline ? 'animate-pulse' : ''}`}></span>
                            )}
                            {currentStatusConfig.label.toUpperCase()} {!isOffline && "NOW"}
                        </div>
                    </div>

                    {/* Go Offline Button */}
                    {!isOffline && (
                        <button
                            onClick={handleGoOffline}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded text-xs font-bold transition-all active:scale-95 shadow-lg"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            <span>Go Offline</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Columns - Session Timer & History */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Session Timer Card */}
                    <section className={`${currentStatusConfig.bgColor} ${currentStatusConfig.color} p-6 xl relative overflow-hidden`}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Timer className="w-5 h-5 text-black dark:text-white/60" />
                                <p className="text-sm font-bold text-black dark:text-white/60 uppercase tracking-wider">Current Session</p>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-black dark:text-white/60 font-mono tracking-wider">
                                        {sessionTime}
                                    </h3>
                                    {sessionStartedAt && !isNaN(sessionStartedAt.getTime()) && (
                                        <p className="text-xs text-black mt-2 dark:text-white/60">
                                            Started at {formatTime(sessionStartedAt.toISOString())}
                                        </p>
                                    )}
                                </div>
                                <div className={`px-4 py-2  ${currentStatusConfig.bgColor} backdrop-blur-sm`}>
                                    <span className={`text-sm font-bold ${currentStatusConfig.color}`}>
                                        {currentStatusConfig.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-[-20px] right-[-20px] opacity-10">
                            <Activity className="w-40 h-40 text-white" />
                        </div>
                    </section>

                    {/* Weekly Summary Grid */}
                    {weeklySummary.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-4 h-4 text-brand-500" />
                                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Weekly Summary</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {weeklySummary.map((item, idx) => {
                                    const statusCfg = getStatusConfig(item.mainStatus as PresenceStatus);
                                    return (
                                        <div key={idx} className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded p-4 flex flex-col gap-3 group hover:border-gray-300 dark:hover:border-white/10 transition-all">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{item.day}</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.date}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${statusCfg.bgColor} ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-2 border-t border-gray-200 dark:border-white/5">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">{item.hours} Total</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Today's Activity Log */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Today's Activity Log</h2>
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
                        </div>
                        <div className="bg-white dark:bg-[#2A2A2A]/20 border border-gray-200 dark:border-white/5 rounded divide-y divide-gray-200 dark:divide-white/5">
                            {todaysActivity.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No activity recorded today</p>
                                    <p className="text-xs text-gray-400 mt-1">Select a status above to start tracking</p>
                                </div>
                            ) : (
                                todaysActivity.map((item, idx) => {
                                    const statusCfg = getStatusConfig(item.status);
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 full flex items-center justify-center border ${statusCfg.bgColor} border-current/20`}>
                                                    <statusCfg.icon className={`w-4 h-4 ${statusCfg.color}`} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">
                                                        Status: {statusCfg.label}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-medium">
                                                        Duration: {formatDuration(item.duration, item.startedAt, item.endedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-gray-400">{formatTime(item.startedAt)}</span>
                                                {item.endedAt && (
                                                    <p className="text-[10px] text-gray-500">→ {formatTime(item.endedAt)}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* Full History */}
                    {history.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Presence History</h2>
                            </div>
                            <div className="bg-white dark:bg-[#2A2A2A]/20 border border-gray-200 dark:border-white/5 rounded overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-medium">
                                        <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Time</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                            {history.slice(0, 10).map((item, idx) => {
                                                const statusCfg = getStatusConfig(item.status);
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                                                                {formatDate(item.startedAt)}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest ${statusCfg.bgColor} ${statusCfg.color} border-current/20`}>
                                                                {statusCfg.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[10px] text-gray-500">
                                                                {formatTime(item.startedAt)}
                                                                {item.endedAt && ` → ${formatTime(item.endedAt)}`}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[10px] font-bold text-gray-400">
                                                                {formatDuration(item.duration, item.startedAt, item.endedAt)}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column - Status Selector */}
                <div className="space-y-8">
                    {/* Status Changer Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base text-gray-900 dark:text-white font-semibold">
                                {isOffline ? "You're Offline" : "Set Your Status"}
                            </h2>
                        </div>

                        {isOffline ? (
                            /* Show Go Online button when offline */
                            <button
                                onClick={() => goOnline()}
                                className="w-full flex items-center justify-center gap-3 p-6 xl bg-green-500/10 border-2 border-green-500 hover:bg-green-500/20 transition-all duration-300 active:scale-95"
                            >
                                <div className="w-12 h-12 bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                </div>
                                <div className="text-left">
                                    <span className="text-lg font-bold text-green-500 block">Go Online</span>
                                    <span className="text-xs text-gray-500">Start your session</span>
                                </div>
                            </button>
                        ) : (
                            /* Show status grid when online */
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {statusConfigs.map((stat) => {
                                        const isActive = currentStatus === stat.id;
                                        const StatusIcon = stat.icon;
                                        return (
                                            <button
                                                key={stat.id}
                                                onClick={() => handleStatusChange(stat.id)}
                                                className={`relative flex flex-col items-center justify-center p-6 rounded transition-all duration-300 group active:scale-95
                                                    ${isActive
                                                        ? 'bg-brand-500/10 border-brand-500 shadow-[0_4px_20px_rgba(70,95,255,0.1)] border-2'
                                                        : 'bg-white dark:bg-[#2A2A2A]/40 border-gray-200 dark:border-white/5 border hover:border-gray-300 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-[#2A2A2A]/60'}`}
                                            >
                                                <div className={`w-12 h-12 ${stat.bgColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                                    <StatusIcon className={`w-6 h-6 ${stat.color}`} />
                                                </div>
                                                <span className={`text-sm font-bold ${isActive ? 'text-brand-500' : 'text-gray-600 dark:text-gray-400'} transition-colors uppercase tracking-tight`}>
                                                    {stat.label}
                                                </span>

                                                {/* Active Indicator Dot */}
                                                {isActive && (
                                                    <div className="absolute top-3 right-3">
                                                        <div className="w-2 h-2 bg-brand-500 shadow-[0_0_8px_rgba(70,95,255,0.8)] animate-pulse"></div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Go Offline Button */}
                                <button
                                    onClick={handleGoOffline}
                                    className="w-full flex items-center justify-center gap-2 p-3 xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 active:scale-95"
                                >
                                    <PowerOff className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-bold text-red-500">Go Offline</span>
                                </button>
                            </>
                        )}
                    </section>

                    {/* Quick Stats */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base text-gray-900 dark:text-white font-semibold">Quick Stats</h2>
                        </div>
                        <div className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Today's Sessions</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{todaysActivity.length}</span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-white/5"></div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Total Records</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{history.length}</span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-white/5"></div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Current Status</span>
                                <span className={`text-sm font-bold ${currentStatusConfig.color}`}>{currentStatusConfig.label}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Presence;
