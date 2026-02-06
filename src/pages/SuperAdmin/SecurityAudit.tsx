import { ApexOptions } from "apexcharts";
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Cpu,
    Database,
    HardDrive,
    Info,
    Server,
    Shield,
    Terminal,
    XCircle,
    Zap
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";

// Types
type LogLevel = "info" | "warning" | "error" | "success";

interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    source: string;
    message: string;
}

interface HealthMetric {
    label: string;
    value: number;
    max: number;
    unit: string;
    status: "healthy" | "warning" | "critical";
    icon: React.ReactNode;
}

// Mock Log Data Generator
const generateLogEntry = (id: number): LogEntry => {
    const levels: LogLevel[] = ["info", "warning", "error", "success"];
    const sources = ["AUTH", "API", "DB", "CACHE", "SCHEDULER", "SECURITY"];
    const messages = [
        "User authentication successful",
        "API rate limit threshold reached",
        "Database connection pool exhausted",
        "Cache invalidation completed",
        "Scheduled task executed",
        "Suspicious login attempt blocked",
        "New session created",
        "Configuration reloaded",
        "Backup completed successfully",
        "Memory threshold exceeded",
        "SSL certificate renewed",
        "Firewall rule updated"
    ];

    return {
        id: `log-${id}`,
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
    };
};

// Initial logs
const initialLogs: LogEntry[] = Array.from({ length: 15 }, (_, i) => generateLogEntry(i));

// Gauge Chart Component
const GaugeChart: React.FC<{ value: number; max: number; color: string; label: string }> = ({
    value,
    max,
    color,
    label
}) => {
    const percentage = (value / max) * 100;

    const options: ApexOptions = {
        chart: {
            type: "radialBar",
            fontFamily: "Outfit, sans-serif",
            sparkline: { enabled: true }
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    size: "65%"
                },
                track: {
                    background: "rgba(255,255,255,0.05)",
                    strokeWidth: "100%"
                },
                dataLabels: {
                    name: {
                        show: true,
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#98a2b3",
                        offsetY: 20
                    },
                    value: {
                        show: true,
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#fff",
                        offsetY: -10,
                        formatter: () => `${value}${label === "DB Latency" ? "ms" : "%"}`
                    }
                }
            }
        },
        fill: {
            type: "gradient",
            gradient: {
                shade: "dark",
                type: "horizontal",
                gradientToColors: [color],
                stops: [0, 100]
            }
        },
        stroke: { lineCap: "round" },
        colors: [color]
    };

    return (
        <div className="h-[180px]">
            <Chart options={options} series={[percentage]} type="radialBar" height={180} />
        </div>
    );
};

// Log Entry Component
const LogEntryRow: React.FC<{ log: LogEntry; isNew?: boolean }> = ({ log, isNew }) => {
    const levelConfig = {
        info: { icon: <Info className="w-3 h-3" />, color: "text-blue-400", bg: "bg-blue-500/10" },
        warning: { icon: <AlertTriangle className="w-3 h-3" />, color: "text-amber-400", bg: "bg-amber-500/10" },
        error: { icon: <XCircle className="w-3 h-3" />, color: "text-red-400", bg: "bg-red-500/10" },
        success: { icon: <CheckCircle className="w-3 h-3" />, color: "text-green-400", bg: "bg-green-500/10" }
    };

    const config = levelConfig[log.level];
    const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    return (
        <div
            className={`flex items-start gap-3 py-2 px-3 font-mono text-xs border-b border-white/5 transition-all duration-300 ${isNew ? "bg-brand-500/5 animate-pulse" : "hover:bg-white/5"
                }`}
        >
            <span className="text-gray-500 shrink-0">{time}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${config.bg} ${config.color} shrink-0 flex items-center gap-1`}>
                {config.icon}
                {log.level}
            </span>
            <span className="text-purple-400 shrink-0">[{log.source}]</span>
            <span className="text-gray-300 truncate">{log.message}</span>
        </div>
    );
};

// Health Card Component
const HealthCard: React.FC<{ metric: HealthMetric }> = ({ metric }) => {
    const statusColors = {
        healthy: { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
        warning: { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        critical: { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" }
    };

    const gaugeColors = {
        healthy: "#22c55e",
        warning: "#f59e0b",
        critical: "#ef4444"
    };

    const colors = statusColors[metric.status];
    const gaugeColor = gaugeColors[metric.status];

    return (
        <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <span className={colors.text}>{metric.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                            {metric.label}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
                            {metric.status}
                        </span>
                    </div>
                </div>
            </div>
            <GaugeChart
                value={metric.value}
                max={metric.max}
                color={gaugeColor}
                label={metric.label}
            />
            <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-xs text-gray-500">
                    {metric.value}{metric.unit} / {metric.max}{metric.unit}
                </span>
            </div>
        </div>
    );
};

// Main Component
const SecurityAudit: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
    const [isPaused, setIsPaused] = useState(false);
    const [logCounter, setLogCounter] = useState(15);

    // Simulated live log streaming
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setLogCounter(prev => prev + 1);
            const newLog = generateLogEntry(logCounter);
            setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
        }, 2000);

        return () => clearInterval(interval);
    }, [isPaused, logCounter]);

    // Health metrics with simulated values
    const healthMetrics: HealthMetric[] = [
        {
            label: "CPU Usage",
            value: 42,
            max: 100,
            unit: "%",
            status: "healthy",
            icon: <Cpu className="w-5 h-5" />
        },
        {
            label: "Memory",
            value: 67,
            max: 100,
            unit: "%",
            status: "warning",
            icon: <HardDrive className="w-5 h-5" />
        },
        {
            label: "DB Latency",
            value: 23,
            max: 100,
            unit: "ms",
            status: "healthy",
            icon: <Database className="w-5 h-5" />
        }
    ];

    // Summary stats
    const stats = {
        totalEvents: logs.length,
        errors: logs.filter(l => l.level === "error").length,
        warnings: logs.filter(l => l.level === "warning").length,
        uptime: "99.97%"
    };

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        System Audit & Health
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Real-time system monitoring and event logging
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
                            System Online
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-brand-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Events</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEvents}</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Errors</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{stats.errors}</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Warnings</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-500">{stats.warnings}</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-green-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Uptime</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{stats.uptime}</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Live Log Stream */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#1C1C1C] rounded-md overflow-hidden">
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#161616] border-b border-gray-200 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-brand-500" />
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                                    Live Log Stream
                                </h3>
                                <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-amber-500" : "bg-green-500 animate-pulse"}`}></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${isPaused
                                            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                            : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                        }`}
                                >
                                    {isPaused ? "Resume" : "Pause"}
                                </button>
                                <button
                                    onClick={() => setLogs([])}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Log Content */}
                        <div className="h-[400px] overflow-y-auto bg-[#0d0d0d]">
                            {logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Server className="w-12 h-12 text-gray-600 mb-3" />
                                    <p className="text-sm text-gray-500">No log entries</p>
                                    <p className="text-xs text-gray-600 mt-1">Events will appear here</p>
                                </div>
                            ) : (
                                logs.map((log, index) => (
                                    <LogEntryRow key={log.id} log={log} isNew={index === 0 && !isPaused} />
                                ))
                            )}
                        </div>

                        {/* Terminal Footer */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-[#161616] border-t border-gray-200 dark:border-white/5">
                            <span className="text-[10px] text-gray-500 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Last update: {logs[0] ? new Date(logs[0].timestamp).toLocaleTimeString() : "—"}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                {logs.length} entries
                            </span>
                        </div>
                    </div>
                </div>

                {/* Health Dashboard Sidebar */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-brand-500" />
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                            Health Dashboard
                        </h3>
                    </div>

                    {healthMetrics.map((metric, index) => (
                        <HealthCard key={index} metric={metric} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SecurityAudit;
