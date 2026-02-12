
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Avatar from "@/components/ui/avatar/Avatar";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Modal } from "@/components/ui/modal";
import apiClient from "@/lib/api-client";
import type { OrgMember, TaskPriority, TaskStatus } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AlertCircle,
    ArrowLeft,
    BellOff,
    Briefcase,
    Calendar,
    CheckCircle2,
    ChevronDown,
    FileText,
    List,
    Loader2,
    MoreVertical,
    Plus,
    TrendingUp,
    Users,
    Zap
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useOrganization } from "../../context/OrganizationContext";
import { CreateTaskRequest, ProjectAPI, TaskAPI } from "../../services/api";
import Select from "@/components/form/Select";

// Custom date formatter since date-fns is not available
const formatDate = (date: Date | string, formatStr: string = "MMM dd, yyyy") => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "OPEN";

    const options: Intl.DateTimeFormatOptions = {};
    if (formatStr.includes("MMM")) options.month = "short";
    if (formatStr.includes("MMMM")) options.month = "long";
    if (formatStr.includes("dd")) options.day = "2-digit";
    if (formatStr.includes("yyyy")) options.year = "numeric";

    return new Intl.DateTimeFormat("en-US", options).format(d);
};

// Color palette for projects (matching Projects.tsx)
const PROJECT_COLORS = [
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EF4444", // red
    "#10B981", // green
    "#F59E0B", // amber
    "#6366F1", // indigo
    "#EC4899", // pink
    "#14B8A6", // teal
];

const getProjectColor = (id: string): string => {
    if (!id) return PROJECT_COLORS[0];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PROJECT_COLORS[hash % PROJECT_COLORS.length];
};

const statusConfig: Record<TaskStatus, { label: string; color: string; dot: string }> = {
    TODO: { label: "To Do", color: "bg-blue-500", dot: "bg-blue-500" },
    IN_PROGRESS: { label: "In Progress", color: "bg-amber-500", dot: "bg-amber-500" },
    IN_REVIEW: { label: "In Review", color: "bg-purple-500", dot: "bg-purple-500" },
    BLOCKED: { label: "Blocked", color: "bg-rose-500", dot: "bg-rose-500" },
    COMPLETED: { label: "Completed", color: "bg-emerald-500", dot: "bg-emerald-500" },
    CANCELLED: { label: "Cancelled", color: "bg-red-500", dot: "bg-red-500" },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; dot: string }> = {
    LOW: { label: "Low", color: "text-slate-500 bg-slate-500/10 border-slate-500/10", dot: "bg-slate-500" },
    MEDIUM: { label: "Medium", color: "text-blue-500 bg-blue-500/10 border-blue-500/10", dot: "bg-blue-500" },
    HIGH: { label: "High", color: "text-amber-500 bg-amber-500/10 border-amber-500/10", dot: "bg-amber-500" },
    URGENT: { label: "Urgent", color: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]", dot: "bg-rose-500" },
};

const CircularProgress = ({ progress, color, size = 16 }: { progress: number; color: string; size?: number }) => {
    const radius = size * 0.45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size * 4, height: size * 4 }}>
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx={size * 2}
                    cy={size * 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="4"
                    fill="transparent"
                />
                <circle
                    cx={size * 2}
                    cy={size * 2}
                    r={radius}
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <span className="absolute text-[10px]  tracking-tighter text-gray-900 dark:text-white">{Math.round(progress)}%</span>
        </div>
    );
};

const ProjectDetails = () => {
    const { projectId } = useParams();
    const queryClient = useQueryClient();
    const { currentOrganization } = useOrganization();
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    // Dropdown states
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [priorityDropOpen, setPriorityDropOpen] = useState(false);

    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "MEDIUM" as TaskPriority,
        status: "TODO" as TaskStatus,
        dueDate: "",
        assigneeIds: [] as string[],
        parentTaskId: ""
    });

    const projectColor = useMemo(() => getProjectColor(projectId || ""), [projectId]);

    // Queries
    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ["project", projectId],
        queryFn: async () => {
            const res = await ProjectAPI.getById(projectId!);
            if (res.success) return res.data;
            throw new Error(res.message);
        },
        enabled: !!projectId && !!currentOrganization,
    });

    const { data: tasks = [], isLoading: tasksLoading } = useQuery({
        queryKey: ["project-tasks", projectId],
        queryFn: async () => {
            const res = await TaskAPI.getAll({ projectId: projectId! });
            return res.success ? res.data || [] : [];
        },
        enabled: !!projectId && !!currentOrganization,
    });

    const { data: members = [] } = useQuery<OrgMember[]>({
        queryKey: ["org-members", currentOrganization?.id],
        queryFn: async () => {
            const res = await apiClient.get("/organizations/current/members");
            return res.data?.data || [];
        },
        enabled: !!currentOrganization,
    });

    // Mutations
    const createTaskMutation = useMutation({
        mutationFn: (data: CreateTaskRequest) => TaskAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
            setCreateTaskOpen(false);
            setNewTask({ title: "", description: "", priority: "MEDIUM", status: "TODO", dueDate: "", assigneeIds: [], parentTaskId: "" });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => TaskAPI.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
            setOpenDropdownId(null);
        }
    });

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title.trim() || !projectId) return;

        createTaskMutation.mutate({
            title: newTask.title,
            description: newTask.description || undefined,
            projectId,
            priority: newTask.priority,
            status: newTask.status,
            dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
            assigneeIds: newTask.assigneeIds.length > 0 ? newTask.assigneeIds : undefined,
            parentTaskId: newTask.parentTaskId || undefined
        });
    };

    const updateTaskStatus = (taskId: string, status: TaskStatus) => {
        updateStatusMutation.mutate({ id: taskId, status });
    };

    const taskStats = useMemo(() => {
        const total = tasks.length;
        if (total === 0) return { total: 0, completed: 0, progress: 0, ongoing: 0, overdue: 0 };
        const completed = tasks.filter(t => t.status === "COMPLETED").length;
        const ongoing = tasks.filter(t => t.status === "IN_PROGRESS").length;
        const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED").length;
        return {
            total,
            completed,
            progress: (completed / total) * 100,
            ongoing,
            overdue
        };
    }, [tasks]);

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!currentOrganization || (projectLoading && !project)) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Syncing with server...</p>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#1A1A1A] animate-in fade-in duration-700 pb-24">
            {/* Ultra Premium Header */}
            <div className="relative mb-10 overflow-hidden">
                {/* Pattern Background */}
                <div
                    className="h-80 w-full relative"
                    style={{ backgroundColor: `${projectColor}15` }}
                >
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, ${projectColor} 2px, transparent 0)`,
                            backgroundSize: '32px 32px'
                        }}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FDFDFD] dark:from-[#1A1A1A] to-transparent" />
                </div>

                {/* Header Content */}
                <div className="absolute inset-x-0 bottom-0 px-10 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-8">
                            <div className="p-6  shadow-3xl transition-all hover:scale-105 duration-700 group">
                                <Briefcase className="w-12 h-12 transition-transform group-hover:rotate-12 duration-700" style={{ color: projectColor }} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-6">
                                    <h1 className="text-2xl md:text-4xl  tracking-tighter text-gray-900 dark:text-white leading-none">
                                        {project.name}
                                    </h1>
                                    <Badge variant="light" className={`h-fit py-1 px-3 border-none bg-gray-100 dark:bg-white/10 text-[8px] border border-brand-500/20   text-gray-500 dark:text-gray-400 `}>
                                        {project.status === "ACTIVE" ? "Executing" : (project.status === "COMPLETED" ? "Resolved" : "Archived")}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-8 text-xs font-normal text-gray-500 dark:text-gray-400 opacity-80">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-brand-500" />
                                        {project._count?.members || 1} Agents Assigned
                                    </span>
                                    <div className="w-2 h-2 bg-gray-300 dark:bg-white/10 " />
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-brand-500" />
                                        Created on {formatDate(project.createdAt, "MMMM dd, yyyy")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end mr-6 space-y-2">
                            <span className="text-[10px]  text-gray-400 opacity-60">Logic Sync Rate</span>
                            <CircularProgress progress={taskStats.completed} color={projectColor} size={16} />
                        </div>
                        <Button
                            onClick={() => setCreateTaskOpen(true)}
                            className="text-white text-[12px] rounded-none font-normal transition-all"
                        >
                            <Plus className="mr-3 h-4 w-4" />
                            Add Task
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation & Context */}
            <div className="px-10 mb-12 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-brand-500 dark:text-gray-500 dark:hover:text-brand-500 px-0 transition-all text-[10px]   gap-4"
                    onClick={() => navigate("/projects")}
                >
                    <ArrowLeft className="w-4.5 h-4.5" />
                    Back to Projects
                </Button>

                <div className="flex items-center gap-3 px-6 py-3 bg-gray-950/5 dark:bg-white/2 rounded-3xl border border-gray-200 dark:border-white/5 backdrop-blur-3xl shadow-sm">
                    <div className="w-2 h-2  bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">Status: Live</span>
                </div>
            </div>

            <div className="px-10 space-y-12 ">
                {/* Quick Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-white dark:bg-[#1C1C1C] border-none p-8  shadow-xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <span className="text-[10px]  text-gray-400 ">Tasks</span>
                            <FileText className="w-6 h-6 text-brand-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-4xl  text-gray-900 dark:text-white leading-none relative z-10">{taskStats.total}</p>
                        <p className="text-[10px] text-gray-400  mt-3  flex items-center gap-2 relative z-10">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Global Horizon
                        </p>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand-500/5  blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    </div>

                    <div className="bg-white dark:bg-[#1C1C1C] border-none p-8  shadow-xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <span className="text-[10px]  text-amber-500 ">In Progress</span>
                            <Zap className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-4xl  text-amber-500 leading-none relative z-10">{taskStats.ongoing}</p>
                        <p className="text-[10px] text-amber-500/60  mt-3  relative z-10">Tasks In Progress</p>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-500/5  blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    </div>

                    <div className="bg-white dark:bg-[#1C1C1C] border-none p-8  shadow-xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <span className="text-[10px]  text-red-500 ">Overdue</span>
                            <AlertCircle className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-4xl  text-red-500 leading-none relative z-10">{taskStats.overdue}</p>
                        <p className="text-[10px] text-red-500/60  mt-3  relative z-10">Tasks Beyond Timeline</p>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-500/5  blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    </div>

                    <div className="bg-white dark:bg-[#1C1C1C] border-none p-8  shadow-xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <span className="text-[10px]  text-emerald-500 ">Completed</span>
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-4xl  text-emerald-500 leading-none relative z-10">{taskStats.completed}</p>
                        <p className="text-[10px] text-emerald-500/60  mt-3  relative z-10">Completed Tasks</p>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/5  blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    </div>
                </div>

                {/* Control Synapse (Search & Tabs) */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-4">
                    <div className="relative flex-1 w-full lg:max-w-md pl-6">

                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks ..."
                            className=" "
                        />
                    </div>

                    <div className="flex items-center gap-6 w-full lg:w-auto">
                        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-white/5  overflow-hidden w-full lg:w-auto border border-gray-200 dark:border-white/5">
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                className={`h-12 flex-1 lg:flex-none gap-3 px-8  text-[10px] border-none transition-all duration-700 ${viewMode === "list" ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-2xl scale-[1.05]" : "text-gray-500 hover:text-gray-700 dark:hover:text-white/80"}`}
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-5 w-5" />
                                Sequence
                            </Button>

                        </div>
                    </div>
                </div>

                {/* Main Task Viewport */}

                <div className="bg-white dark:bg-[#1C1C1C]/60 border-b-1 border-gray-200 dark:border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/2 border-b border-gray-200 dark:border-white/5">
                                <th className="px-12 py-10 text-[10px]   text-gray-400">Task Name</th>
                                <th className="px-8 py-10 text-[10px]   text-gray-400">Status</th>
                                <th className="px-8 py-10 text-[10px]   text-gray-400 text-center">Priority</th>
                                <th className="px-8 py-10 text-[10px]   text-gray-400 text-center">Date</th>
                                <th className="px-8 py-10 text-[10px]   text-gray-400">Assignees</th>
                                <th className="px-12 py-10 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredTasks.map(task => (
                                <tr key={task.id} className="group hover:bg-gray-50/80 dark:hover:bg-white/5 transition-all duration-700 cursor-default">
                                    <td className="px-12 py-10">
                                        <div className="flex items-start gap-6">
                                            <div className={`mt-2.5 h-3 w-3  flex-shrink-0 ${statusConfig[task.status].dot} shadow-xl group-hover:scale-150 transition-all duration-700`} />
                                            <div className="space-y-2">
                                                <div className=" text-lg text-gray-900 dark:text-white leading-none group-hover:text-brand-500 transition-colors duration-500">{task.title}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-lg font-bold opacity-60 border-l-[3px] border-brand-500/10 pl-4">{task.description || "No description"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-10">
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenDropdownId(openDropdownId === task.id ? null : task.id)}
                                                className="dropdown-toggle flex items-center gap-4 px-6 py-3  text-[10px] border-none text-white bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-brand-500/50 transition-all outline-none min-w-[180px]"
                                            >
                                                <span className={`h-2.5 w-2.5  ${statusConfig[task.status].dot}`} />
                                                {statusConfig[task.status].label}
                                                <ChevronDown className={`ml-auto h-4 w-4 opacity-30 transition-transform duration-500 ${openDropdownId === task.id ? 'rotate-180' : ''}`} />
                                            </button>

                                            <Dropdown
                                                isOpen={openDropdownId === task.id}
                                                onClose={() => setOpenDropdownId(null)}
                                                className="w-64 p-3 bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-white/10 shadow-4xl  mt-4 right-0"
                                            >
                                                {(Object.entries(statusConfig) as [TaskStatus, any][]).map(([val, conf]) => (
                                                    <DropdownItem
                                                        key={val}
                                                        onClick={() => updateTaskStatus(task.id, val)}
                                                        className="flex items-center gap-4 text-[10px]   py-5 px-5  transition-all hover:bg-brand-500/5 hover:text-brand-500 border-none"
                                                    >
                                                        <span className={`h-2.5 w-2.5  ${conf.dot}`} />
                                                        {conf.label}
                                                    </DropdownItem>
                                                ))}
                                            </Dropdown>
                                        </div>
                                    </td>
                                    <td className="px-8 py-10 text-center">
                                        <Badge variant="outline" className={`px-5 py-2 text-[10px]  tracking-[0.25em]  border-[2.5px] ${priorityConfig[task.priority].color} shadow-sm`}>
                                            {priorityConfig[task.priority].label}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-10 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="text-sm  text-gray-900 dark:text-white tracking-widest uppercase">{task.dueDate ? formatDate(task.dueDate, "MMM dd, yyyy") : "OPEN"}</span>
                                            <span className="text-[9px]  text-gray-400  opacity-50">Sync Event</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-10">
                                        <div className="flex items-center -space-x-4">
                                            {task.assignees?.map((a, i) => (
                                                <div key={i} className="h-11 w-11 border-[3.5px] rounded-full border-white dark:border-[#1C1C1C] shadow-2xl hover:z-20 transition-all hover:scale-150 duration-500  overflow-hidden">
                                                    {a.user.name ? (
                                                        <Avatar src={a.user.name.charAt(0)} size="large" />
                                                    ) : (
                                                        <div className="bg-brand-50 dark:bg-brand-500/10 text-[11px]  text-brand-500 flex items-center justify-center h-full w-full">
                                                            {a.user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                className="h-11 w-11  border-2 border-dashed border-gray-300 rounded-full dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-brand-500 hover:border-brand-500 transition-all bg-gray-50/50 dark:bg-white/5 hover:bg-brand-500/5 group/add"
                                                onClick={() => {/* Trigger Assign Dialog */ }}
                                            >
                                                <Plus className="w-5 h-5 group-hover/add:rotate-90 rounded-full transition-transform duration-500" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10 text-right">
                                        <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-400 hover:text-brand-500 hover:bg-brand-500/5  group/actions">
                                            <MoreVertical className="h-6 w-6 group-hover/actions:rotate-90 transition-transform duration-500" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


                {/* Empty State */}
                {filteredTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-56 px-12 duration-1000">
                        <div className="h-16 w-16 flex items-center justify-center mb-12 relative z-10">
                            <BellOff className="h-12 w-12 text-gray-200 dark:text-gray-800" />
                        </div>
                        <h3 className="text-4xl text-gray-900 dark:text-white tracking-tighter mb-6 relative z-10">No Tasks Found</h3>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-brand-500/[0.02] to-transparent pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            <Modal
                isOpen={createTaskOpen}
                onClose={() => setCreateTaskOpen(false)}
                className="max-w-2xl rounded-none p-0 overflow-hidden bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 shadow-2xl"
            >
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create New Task</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Add a new task to <span className="text-brand-500 font-semibold">{project.name}</span></p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateTask} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Task Title</Label>
                                <Input
                                    value={newTask.title}
                                    onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                                    placeholder="What needs to be done?"
                                    className="h-12 bg-gray-50/50 dark:bg-black/20 border-gray-200 dark:border-white/5 rounded-xl text-base px-4 focus-visible:ring-brand-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Description</Label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Add more details about this task..."
                                    className="min-h-[120px] w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Priority</Label>
                                    <button
                                        type="button"
                                        onClick={() => setPriorityDropOpen(!priorityDropOpen)}
                                        className="w-full h-12 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-xl px-4 flex items-center justify-between group text-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${priorityConfig[newTask.priority].dot || 'bg-brand-500'}`} />
                                            <span className="text-gray-900 dark:text-white capitalize">{newTask.priority.toLowerCase()}</span>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${priorityDropOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <Dropdown
                                        isOpen={priorityDropOpen}
                                        onClose={() => setPriorityDropOpen(false)}
                                        className="w-full mt-2 p-2 bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-white/10 shadow-xl rounded-xl z-50"
                                    >
                                        {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map(p => (
                                            <DropdownItem
                                                key={p}
                                                onClick={() => {
                                                    setNewTask(prev => ({ ...prev, priority: p }));
                                                    setPriorityDropOpen(false);
                                                }}
                                                className="flex items-center gap-3 py-2 px-3 text-sm rounded-lg hover:bg-brand-500/10 hover:text-brand-500 transition-colors border-none"
                                            >
                                                <div className={`w-2 h-2 rounded-full ${priorityConfig[p].dot || 'bg-brand-500'}`} />
                                                <span className="capitalize">{p.toLowerCase()}</span>
                                            </DropdownItem>
                                        ))}
                                    </Dropdown>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Due Date</Label>
                                    <Input
                                        type="date"
                                        className="h-12 bg-gray-50/50 dark:bg-black/20 border-gray-200 dark:border-white/5 rounded-xl px-4 text-sm focus-visible:ring-brand-500/20"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Parent Task (Optional)</Label>
                                <Select
                                    options={[
                                        { value: "", label: "None (Top-level task)" },
                                        ...tasks.filter(t => t.status !== 'COMPLETED').map(t => ({ value: t.id, label: t.title }))
                                    ]}
                                    defaultValue={newTask.parentTaskId}
                                    placeholder="Select parent task"
                                    onChange={val => setNewTask(p => ({ ...p, parentTaskId: val }))}
                                    className="h-12 bg-gray-50/50 dark:bg-black/20 border-gray-200 dark:border-white/5 rounded-xl text-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Assign To</Label>
                                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                                    {members.map(member => {
                                        const userName = member.user?.name || member.email || "Agent";
                                        const isSelected = newTask.assigneeIds.includes(member.userId);
                                        return (
                                            <button
                                                key={member.userId}
                                                type="button"
                                                onClick={() => {
                                                    setNewTask(p => ({
                                                        ...p,
                                                        assigneeIds: isSelected ? p.assigneeIds.filter(id => id !== member.userId) : [...p.assigneeIds, member.userId]
                                                    }));
                                                }}
                                                className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all ${isSelected
                                                    ? "bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20"
                                                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-brand-500/50"
                                                    }`}
                                            >
                                                <div className="h-6 w-6 rounded-full overflow-hidden border border-white/20">
                                                    {member.user?.avatar ? (
                                                        <Avatar src={member.user.avatar} size="small" />
                                                    ) : (
                                                        <div className="text-[10px] font-bold bg-brand-50 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center h-full w-full uppercase">
                                                            {userName.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium">{userName}</span>
                                            </button>
                                        );
                                    })}
                                    {members.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">No members available to assign.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCreateTaskOpen(false)}
                                className="flex-1 h-12 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createTaskMutation.isPending}
                                className="flex-[2] h-12 rounded-none bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {createTaskMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Create Task"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default ProjectDetails;