import { ApexOptions } from "apexcharts";
import {
    AlertCircle,
    Calendar,
    Coffee,
    FileText,
    LogOut,
    Play,
    User,
    Utensils,
    Zap
} from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import Chart from "react-apexcharts";
import ActivityTimeline from "../../components/Employee/ActivityTimeline";
import { useAuth } from "../../context/AuthContext";
import { useOrganization } from "../../context/OrganizationContext";
import { TaskAPI, Task, PresenceStatus, NotificationAPI, Notification } from "../../services/api";
import { usePresence } from "../../context/PresenceContext";

// Types
interface ActivityItem {
    id: string;
    user: string;
    action: string;
    target: string;
    time: string;
    type: "comment" | "upload" | "status" | "task";
}

// Chart Components
const PerformanceChart: React.FC<{ series: { name: string; data: number[] }[] }> = ({ series }) => {
    const options: ApexOptions = {
        colors: ["#465fff", "rgba(70, 95, 255, 0.1)"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "area",
            height: 250,
            toolbar: { show: false },
            sparkline: { enabled: false }
        },
        stroke: { curve: "smooth", width: 2 },
        fill: {
            type: "solid",
            opacity: [0.4, 0.1]
        },
        grid: {
            show: true,
            borderColor: "rgba(255,255,255,0.05)",
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: "#98a2b3", fontSize: "10px" } }
        },
        yaxis: {
            labels: {
                style: { colors: "#98a2b3", fontSize: "10px" }
            }
        },
        tooltip: { theme: "dark" }
    };

    return <Chart options={options} series={series} type="area" height={250} />;
};

const AllocationChart: React.FC<{ series: { name: string; data: number[] }[] }> = ({ series }) => {
    const options: ApexOptions = {
        colors: ["#465fff"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "bar",
            height: 250,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: "45%",
            }
        },
        grid: {
            show: true,
            borderColor: "rgba(255,255,255,0.05)",
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ["Work", "Break", "Lunch", "Meeting"],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: "#98a2b3", fontSize: "10px" } }
        },
        yaxis: {
            labels: {
                style: { colors: "#98a2b3", fontSize: "10px" }
            }
        },
        tooltip: { theme: "dark" }
    };

    return <Chart options={options} series={series} type="bar" height={250} />;
};

const DashboardSkeleton: React.FC = () => (
    <div className="min-h-screen animate-pulse space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
                <div className="h-7 w-64 bg-gray-200 dark:bg-white/5 rounded-md"></div>
                <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded-md"></div>
            </div>
            <div className="flex items-center gap-4">
                <div className="h-10 w-32 bg-gray-200 dark:bg-white/5 rounded-md"></div>
                <div className="h-10 w-40 bg-gray-100 dark:bg-white/5 rounded-md"></div>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
                <div className="h-48 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                    <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                    <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                    <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                </div>
            </div>
            <div className="h-[600px] bg-gray-100 dark:bg-white/5 rounded-md"></div>
        </div>
    </div>
);

const EmployeeDashboard: React.FC = () => {
    const { user } = useAuth();
    const { currentOrganization, isSwitching } = useOrganization();
    const {
        currentStatus: status,
        secondsElapsed: seconds,
        updateStatus,
        history: presenceHistory,
        refreshMyPresence,
        refreshMyHistory
    } = usePresence();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isCheckedIn = status !== "OFFLINE";

    useEffect(() => {
        const fetchInitialData = async () => {
            if (isSwitching || !currentOrganization) return;
            // Only set loading on initial fetch, not on background refreshes
            if (tasks.length === 0 && presenceHistory.length === 0) {
                setIsLoading(true);
            }

            try {
                await Promise.all([
                    refreshMyPresence(),
                    refreshMyHistory(),
                    (async () => {
                        const tasksRes = await TaskAPI.getAll({ limit: 100 });
                        console.log("Dashboard: Tasks fetch result:", tasksRes);
                        if (tasksRes.success && Array.isArray(tasksRes.data)) {
                            setTasks(tasksRes.data);
                        } else if (tasksRes.success && (tasksRes.data as any)?.tasks) {
                            setTasks((tasksRes.data as any).tasks);
                        }
                    })(),
                    (async () => {
                        const notifRes = await NotificationAPI.getAll({ limit: 10 });
                        if (notifRes.success && notifRes.data?.notifications) {
                            setNotifications(notifRes.data.notifications);
                        }
                    })()
                ]);
            } catch (err) {
                console.error("Dashboard: Data fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();

        // Real-time refresh every 60 seconds
        const refreshInterval = setInterval(() => {
            fetchInitialData();
        }, 60000);

        return () => clearInterval(refreshInterval);
    }, [currentOrganization?.id, isSwitching, refreshMyPresence, refreshMyHistory]);


    const handleStatusChange = async (newStatus: PresenceStatus) => {
        await updateStatus(newStatus);
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const taskStats = useMemo(() => {
        const now = new Date();
        return {
            total: tasks.length,
            overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED").length,
            ongoing: tasks.filter(t => t.status === "IN_PROGRESS").length,
            completed: tasks.filter(t => t.status === "COMPLETED").length
        };
    }, [tasks]);

    const chartData = useMemo(() => {
        // Performance Chart: Group by day for last 7 days
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            return d;
        });

        const completedData = last7Days.map(date => {
            return tasks.filter(t =>
                t.status === "COMPLETED" &&
                t.completedAt &&
                new Date(t.completedAt).toDateString() === date.toDateString()
            ).length;
        });

        const plannedData = last7Days.map(date => {
            return tasks.filter(t =>
                new Date(t.createdAt).toDateString() === date.toDateString()
            ).length;
        });

        const performanceSeries = [
            { name: "Completed Tasks", data: completedData },
            { name: "Planned Tasks", data: plannedData }
        ];

        // Allocation Chart Logic (Based on history)
        const statusMinutes = {
            WORK: 0,
            BREAK: 0,
            LUNCH: 0,
            MEETING: 0
        };

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        presenceHistory.forEach(item => {
            const itemDate = new Date(item.startedAt);
            if (itemDate < weekAgo) return;

            let duration = item.duration || 0;
            if (!duration && item.endedAt) {
                duration = Math.floor((new Date(item.endedAt).getTime() - itemDate.getTime()) / 60000);
            }

            if (duration <= 0) return;

            // Map status to chart buckets
            switch (item.status) {
                case "WORKING":
                case "AVAILABLE":
                case "BUSY":
                    statusMinutes.WORK += duration;
                    break;
                case "ON_BREAK":
                    statusMinutes.BREAK += duration;
                    break;
                case "AT_LUNCH":
                    statusMinutes.LUNCH += duration;
                    break;
                case "IN_MEETING":
                    statusMinutes.MEETING += duration;
                    break;
            }
        });

        const allocationSeries = [{
            name: "Hours Allocated",
            data: [
                Math.round(statusMinutes.WORK / 60 * 10) / 10,
                Math.round(statusMinutes.BREAK / 60 * 10) / 10,
                Math.round(statusMinutes.LUNCH / 60 * 10) / 10,
                Math.round(statusMinutes.MEETING / 60 * 10) / 10
            ]
        }];

        return { performanceSeries, allocationSeries };
    }, [tasks, presenceHistory]);

    const activities: ActivityItem[] = useMemo(() => {
        if (notifications.length === 0) return [
            { id: "1", user: "System", action: "welcome", target: "Start your day with ODI", time: "Just now", type: "status" }
        ];

        return notifications.map(n => ({
            id: n.id,
            user: n.title,
            action: n.message.length > 30 ? n.message.substring(0, 30) + "..." : n.message,
            target: "",
            time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: n.type.toLowerCase().includes("comment") ? "comment" : "task"
        }));
    }, [notifications]);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight uppercase">
                        Welcome, <span className="text-brand-500">{user?.name || "Member"}</span> 👋
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-500" />
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/10"></div>
                        <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">
                            {taskStats.ongoing} tasks ongoing
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => updateStatus(isCheckedIn ? "OFFLINE" : "WORKING")}
                        className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border ${isCheckedIn
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20"
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? "bg-green-500 animate-pulse" : "bg-white"}`}></div>
                        {isCheckedIn ? "Checked In" : "Check In Now"}
                    </button>

                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-white/10">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">Team Member</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Active Organization</p>
                        </div>
                        <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                            <User className="w-5 h-5 text-brand-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Presence Controller */}
                    <div className="bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-white/5 rounded-md p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-xl rounded-full translate-x-16 -translate-y-16"></div>

                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            {/* Visual Timer */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-36 h-36 flex flex-col items-center justify-center border-4 border-gray-100 dark:border-white/5 rounded-full">
                                    <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-[spin_3s_linear_infinite]"></div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Session</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono tracking-tight">{formatTime(seconds)}</span>
                                </div>
                                <div className={`mt-4 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${status === 'WORKING' ? 'bg-blue-500/10 text-blue-500' :
                                    status === 'ON_BREAK' ? 'bg-amber-500/10 text-amber-500' :
                                        status === 'AT_LUNCH' ? 'bg-orange-500/10 text-orange-500' :
                                            'bg-red-500/10 text-red-500'
                                    }`}>
                                    {status.replace('_', ' ')}
                                </div>
                            </div>

                            {/* Status Toggles */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                                {[
                                    { id: 'WORKING', icon: <Play className="w-5 h-5" />, label: 'Work', color: 'blue' },
                                    { id: 'ON_BREAK', icon: <Coffee className="w-5 h-5" />, label: 'Break', color: 'amber' },
                                    { id: 'AT_LUNCH', icon: <Utensils className="w-5 h-5" />, label: 'Lunch', color: 'orange' },
                                    { id: 'OFFLINE', icon: <LogOut className="w-5 h-5" />, label: 'Stop', color: 'red' }
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        onClick={() => handleStatusChange(btn.id as PresenceStatus)}
                                        className={`flex flex-col items-center justify-center p-5 rounded-md border transition-all duration-300 ${status === btn.id
                                            ? `bg-${btn.color}-500/10 border-${btn.color}-500/20`
                                            : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20"
                                            }`}
                                    >
                                        <div className={`mb-3 transition-colors ${status === btn.id ? `text-${btn.color}-500` : "text-gray-400"}`}>
                                            {btn.icon}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${status === btn.id ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                                            {btn.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1C1C1C] bold dark:border-white/5 p-5 rounded-md">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Tasks</span>
                                <FileText className="w-4 h-4 text-brand-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{taskStats.total}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Assignments</p>
                        </div>
                        <div className="bg-white dark:bg-[#1C1C1C] border-red-500/10 p-5 rounded-md border">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Overdue</span>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <p className="text-2xl font-bold text-red-500 uppercase tracking-tight">{taskStats.overdue}</p>
                            <p className="text-[9px] text-red-500/60 font-bold uppercase mt-1">Requires Attention</p>
                        </div>
                        <div className="bg-white dark:bg-[#1C1C1C] border-green-500/10 p-5 rounded-md border">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ongoing</span>
                                <Zap className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-green-500 uppercase tracking-tight">{taskStats.ongoing}</p>
                            <p className="text-[9px] text-green-500/60 font-bold uppercase mt-1">In progress</p>
                        </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-[#1C1C1C] bold dark:border-white/5 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">

                                    Performance
                                </h3>
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">Weekly</div>
                            </div>
                            <PerformanceChart series={chartData.performanceSeries} />
                        </div>
                        <div className="bg-white dark:bg-[#1C1C1C] bold dark:border-white/5 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    Allocation
                                </h3>
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">Hours</div>
                            </div>
                            <AllocationChart series={chartData.allocationSeries} />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <ActivityTimeline activities={activities} />
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
