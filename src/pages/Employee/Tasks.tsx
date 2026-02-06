import React, { useState } from "react";
import {
    LayoutGrid,
    List,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";

// Types
type Priority = "High" | "Medium" | "Low";
type Status = "To Do" | "In Progress" | "Review" | "Done";

interface Task {
    id: string;
    title: string;
    description: string;
    project: string;
    projectColor: string;
    priority: Priority;
    dueDate: string;
    status: Status;
    progress: number;
    assignees: { name: string; avatar: string }[];
}

const mockTasks: Task[] = [
    {
        id: "1",
        title: "Implement Dashboard Charts",
        description: "Create interactive charts for the analytics page using Recharts.",
        project: "Internal Hub",
        projectColor: "bg-blue-500",
        priority: "High",
        dueDate: "Feb 12",
        status: "In Progress",
        progress: 65,
        assignees: [
            { name: "Alex", avatar: "AJ" },
            { name: "Sarah", avatar: "SK" }
        ]
    },
    {
        id: "2",
        title: "User Authentication Flow",
        description: "Refactor the login and signup components for better performance.",
        project: "Security",
        projectColor: "bg-purple-500",
        priority: "High",
        dueDate: "Feb 10",
        status: "To Do",
        progress: 0,
        assignees: [{ name: "Alex", avatar: "AJ" }]
    },
    {
        id: "3",
        title: "Email Template Design",
        description: "Design responsive email templates for system notifications.",
        project: "Marketing",
        projectColor: "bg-pink-500",
        priority: "Medium",
        dueDate: "Feb 15",
        status: "Review",
        progress: 100,
        assignees: [{ name: "Kevin", avatar: "KW" }]
    },
    {
        id: "4",
        title: "Database Migration",
        description: "Move the legacy data to the new PostgreSQL instance.",
        project: "Backend",
        projectColor: "bg-orange-500",
        priority: "Low",
        dueDate: "Feb 08",
        status: "Done",
        progress: 100,
        assignees: [{ name: "Alex", avatar: "AJ" }]
    }
];

const PriorityIcon = ({ priority }: { priority: Priority }) => {
    switch (priority) {
        case "High": return <ChevronUp className="w-4 h-4 text-red-500" />;
        case "Medium": return <AlertCircle className="w-4 h-4 text-orange-500" />;
        case "Low": return <ChevronDown className="w-4 h-4 text-blue-500" />;
    }
};

const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded p-4 hover:border-gray-300 dark:hover:border-white/10 transition-all group cursor-grab active:cursor-grabbing">
        <div className="flex justify-between items-start mb-3">
            <span className={`px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider ${task.projectColor}/10 ${task.projectColor.replace('bg-', 'text-')}`}>
                {task.project}
            </span>
            <button className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-500 transition-colors line-clamp-1">
            {task.title}
        </h4>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {task.description}
        </p>

        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                    {task.assignees.map((a, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center text-[10px] font-bold text-gray-400">
                            {a.avatar}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                    <PriorityIcon priority={task.priority} />
                    <span className="text-[10px] font-medium">{task.priority}</span>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-900 dark:text-white">{task.progress}%</span>
                </div>
                <div className="h-1 w-full bg-gray-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-white/5">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="text-[10px] text-gray-500 font-medium">{task.dueDate}</span>
            </div>
        </div>
    </div>
);

const Tasks: React.FC = () => {
    const [view, setView] = useState<"kanban" | "list">("kanban");
    const columns: Status[] = ["To Do", "In Progress", "Review", "Done"];

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Tasks</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage and track your individual workload.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-white dark:bg-[#2A2A2A] p-1 rounded-lg border border-gray-200 dark:border-white/5">
                        <button
                            onClick={() => setView("kanban")}
                            className={`p-1.5 rounded-md transition-all ${view === "kanban" ? "bg-gray-100 dark:bg-[#333333] text-brand-500 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-gray-100 dark:bg-[#333333] text-brand-500 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded text-sm font-bold transition-all">
                        <Plus className="w-4 h-4" />
                        <span>New Task</span>
                    </button>
                </div>
            </div>

            {/* Filters/Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pt-6 border-t border-gray-200 dark:border-white/5">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        className="w-full bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest hidden sm:block">
                        {mockTasks.length} Total Tasks
                    </p>
                </div>
            </div>

            {view === "kanban" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {columns.map(column => (
                        <div key={column} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">{column}</h3>
                                    <span className="bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/5">
                                        {mockTasks.filter(t => t.status === column).length}
                                    </span>
                                </div>
                                <button className="text-gray-600 hover:text-brand-500 transition-colors">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4 min-h-[500px]">
                                {mockTasks.filter(t => t.status === column).map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                                {mockTasks.filter(t => t.status === column).length === 0 && (
                                    <div className="border-2 border-dashed border-gray-200 dark:border-white/5 rounded-xl h-24 flex items-center justify-center text-gray-500 dark:text-gray-700 text-[10px] font-bold uppercase tracking-widest">
                                        No Tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#2A2A2A]/20 border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/2 border-b border-gray-200 dark:border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Task Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Project</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Due Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {mockTasks.map(task => (
                                    <tr key={task.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg ${task.projectColor}/10 flex items-center justify-center text-brand-500`}>
                                                    <CheckCircle2 className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{task.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${task.projectColor}`}></div>
                                                <span className="text-xs font-medium text-gray-400">{task.project}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <PriorityIcon priority={task.priority} />
                                                <span className="text-xs font-medium text-gray-400">{task.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-xs font-medium">{task.dueDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-400 group-hover:text-white transition-colors`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1.5 text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
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

export default Tasks;
