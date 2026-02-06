import { ApexOptions } from "apexcharts";
import {
    AlertCircle,
    BarChart3,
    Calendar,
    CheckCircle2,
    Clock,
    FolderKanban,
    MoreHorizontal,
    Search,
    TrendingUp,
    Users
} from "lucide-react";
import React from "react";
import Chart from "react-apexcharts";

// Types
type ProjectHealth = "On Track" | "At Risk" | "Delayed";

interface Project {
    id: string;
    name: string;
    client: string;
    startDate: string;
    endDate: string;
    budget: number;
    completion: number;
    health: ProjectHealth;
    teamSize: number;
}

interface Resource {
    name: string;
    assigned: number;
    capacity: number;
}

// Mock Data
const mockProjects: Project[] = [
    {
        id: "1",
        name: "Cloud Infrastructure Migration",
        client: "TechCorp Industries",
        startDate: "2024-01-10",
        endDate: "2024-06-15",
        budget: 450000,
        completion: 75,
        health: "On Track",
        teamSize: 12
    },
    {
        id: "2",
        name: "Mobile App Refactoring",
        client: "StartupXYZ",
        startDate: "2024-02-01",
        endDate: "2024-04-30",
        budget: 85000,
        completion: 40,
        health: "At Risk",
        teamSize: 5
    },
    {
        id: "3",
        name: "Enterprise CRM Implementation",
        client: "Global Finance",
        startDate: "2023-11-20",
        endDate: "2024-08-10",
        budget: 1200000,
        completion: 60,
        health: "On Track",
        teamSize: 24
    },
    {
        id: "4",
        name: "Core Security Audit",
        client: "Internal IT",
        startDate: "2024-03-15",
        endDate: "2024-04-15",
        budget: 25000,
        completion: 15,
        health: "Delayed",
        teamSize: 3
    }
];

const mockResources: Resource[] = [
    { name: "Development", assigned: 45, capacity: 50 },
    { name: "Design", assigned: 12, capacity: 15 },
    { name: "DevOps", assigned: 8, capacity: 10 },
    { name: "QA/Testing", assigned: 20, capacity: 20 },
    { name: "Management", assigned: 5, capacity: 8 }
];

// Resource Allocation Chart
const ResourceChart: React.FC = () => {
    const options: ApexOptions = {
        chart: {
            type: "bar",
            fontFamily: "Outfit, sans-serif",
            toolbar: { show: false },
            stacked: false
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: "60%",
                borderRadius: 4
            }
        },
        colors: ["#465fff", "rgba(70, 95, 255, 0.1)"],
        dataLabels: { enabled: false },
        xaxis: {
            categories: mockResources.map(r => r.name),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: { colors: "#98a2b3", fontSize: "10px" }
            }
        },
        yaxis: {
            labels: {
                style: { colors: "#98a2b3", fontSize: "10px" }
            }
        },
        grid: {
            borderColor: "rgba(255,255,255,0.05)",
            xaxis: { lines: { show: true } }
        },
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "right",
            fontFamily: "Outfit",
            fontSize: "10px",
            labels: { colors: "#98a2b3" }
        },
        tooltip: { theme: "dark" }
    };

    const series = [
        {
            name: "Assigned (Hours/Week)",
            data: mockResources.map(r => r.assigned)
        },
        {
            name: "Available Capacity",
            data: mockResources.map(r => r.capacity - r.assigned)
        }
    ];

    return (
        <div className="h-[300px]">
            <Chart options={options} series={series} type="bar" height={300} />
        </div>
    );
};

const ProjectPortfolio: React.FC = () => {
    const getHealthStyles = (health: ProjectHealth) => {
        switch (health) {
            case "On Track": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "At Risk": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "Delayed": return "bg-red-500/10 text-red-500 border-red-500/20";
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            {mockProjects.map((project) => (
                <div key={project.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-5 hover:border-brand-500/30 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                                <FolderKanban className="w-6 h-6 text-brand-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-brand-500 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                    Client: {project.client}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="text-center md:text-right">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Timeline</p>
                                <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-white font-medium">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="w-32">
                                <div className="flex justify-between items-end mb-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Progress</p>
                                    <span className="text-[10px] font-bold text-brand-500">{project.completion}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${project.completion}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getHealthStyles(project.health)}`}>
                                    {project.health}
                                </span>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProjectOversight: React.FC = () => {
    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Project Oversight
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        High-level monitoring of organization-wide project portfolio
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-bold uppercase tracking-widest transition-all">
                        <TrendingUp className="w-4 h-4" />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <FolderKanban className="w-4 h-4 text-brand-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Active Projects</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Resources</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">48<span className="text-xs text-gray-500"> FTE</span></p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Healthy</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">9</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">At Risk</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">3</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Project Portfolio */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-brand-500" />
                            Project Portfolio
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter projects..."
                                    className="pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                                />
                            </div>
                        </div>
                    </div>
                    <ProjectPortfolio />
                </div>

                {/* Resource Allocation Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-md">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    Resource Allocation
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Capacity vs. Assigned</p>
                            </div>
                        </div>
                        <ResourceChart />
                        <div className="mt-6 space-y-4">
                            <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-4 h-4 text-brand-500" />
                                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">Critical Load</p>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed uppercase">
                                    QA/Testing is at 100% capacity. New projects will require additional resource requisition.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectOversight;
