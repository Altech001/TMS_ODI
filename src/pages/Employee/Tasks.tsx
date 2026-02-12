import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Clock,
    Filter,
    LayoutGrid,
    List,
    Loader2,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Trash2
} from "lucide-react";
import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../context/OrganizationContext";
import { Task as APITask, TaskAPI, TaskStatus, TaskPriority, CreateTaskRequest } from "../../services/api";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// UI Types
interface TaskUI {
    id: string;
    title: string;
    description: string;
    project: string;
    projectColor: string;
    priority: TaskPriority;
    dueDate: string;
    status: TaskStatus;
    progress: number;
    assignees: { name: string; avatar: string }[];
}

// Helper to map API task to UI task
const mapTaskToUI = (task: APITask): TaskUI => {
    return {
        id: task.id,
        title: task.title,
        description: task.description || "",
        project: task.project?.name || "No Project",
        projectColor: task.projectId ? `bg-brand-500` : "bg-gray-400",
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "No Date",
        status: task.status,
        progress: task.status === "COMPLETED" ? 100 : task.status === "TODO" ? 0 : 50,
        assignees: task.assignees?.map(a => ({
            name: a.user.name,
            avatar: a.user.name.substring(0, 2).toUpperCase()
        })) || []
    };
};

const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
    switch (priority) {
        case "URGENT":
        case "HIGH": return <ChevronUp className="w-4 h-4 text-red-500" />;
        case "MEDIUM": return <AlertCircle className="w-4 h-4 text-orange-500" />;
        case "LOW": return <ChevronDown className="w-4 h-4 text-blue-500" />;
        default: return <ChevronDown className="w-4 h-4 text-gray-400" />;
    }
};

const TaskCard = ({
    task,
    onDelete,
    onStatusUpdate
}: {
    task: TaskUI;
    onDelete?: (id: string) => void;
    onStatusUpdate?: (id: string, status: TaskStatus) => void;
}) => (
    <div className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded p-4 hover:border-gray-300 dark:hover:border-white/10 transition-all group cursor-grab active:cursor-grabbing">
        <div className="flex justify-between items-start mb-3">
            <span className={`px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider ${task.projectColor}`}>
                {task.project}
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onDelete?.(task.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-32 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 rounded-lg shadow-xl p-1">
                        {["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"].map((s) => (
                            <DropdownMenuItem
                                key={s}
                                onClick={() => onStatusUpdate?.(task.id, s as TaskStatus)}
                                className={`w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${task.status === s ? 'text-brand-500 bg-brand-500/5' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                {s.replace('_', ' ')}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
                        <div key={i} title={a.name} className="w-6 h-6 rounded-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center text-[10px] font-bold text-gray-400">
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
                    <span className="text-gray-900 dark:text-white">{task.progress}%</span>
                </div>
                <div className="w-full h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1 float-right">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="text-[10px] text-gray-500 font-medium">{task.dueDate}</span>
            </div>
        </div>
    </div>
);

const Tasks: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const filterProjectId = searchParams.get("projectId");

    const [view, setView] = useState<"kanban" | "list">("kanban");
    const [search, setSearch] = useState("");
    const { currentOrganization } = useOrganization();

    // Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "MEDIUM" as TaskPriority,
    });

    const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "BLOCKED", "CANCELLED"];

    // Fetch tasks query
    const {
        data: tasks = [],
        isLoading,
        error: fetchError
    } = useQuery({
        queryKey: ["tasks", currentOrganization?.id, filterProjectId],
        queryFn: async () => {
            const response = await TaskAPI.getAll({
                limit: 100,
                projectId: filterProjectId || undefined
            });
            if (response.success && Array.isArray(response.data)) {
                return response.data.map(mapTaskToUI);
            }
            return [];
        },
        enabled: !!currentOrganization,
    });

    // Create task mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateTaskRequest) => TaskAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setCreateModalOpen(false);
            setNewTask({ title: "", description: "", priority: "MEDIUM" });
        }
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => TaskAPI.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
    });

    // Delete task mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => TaskAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
    });

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;
        createMutation.mutate({
            ...newTask,
            status: "TODO",
            projectId: filterProjectId || undefined
        });
    };

    const handleUpdateStatus = (id: string, status: TaskStatus) => {
        updateStatusMutation.mutate({ id, status });
    };

    const handleDeleteTask = (id: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        deleteMutation.mutate(id);
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Tasks</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage and track your individual workload.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-white dark:bg-[#2A2A2A] p-1 rounded border border-gray-200 dark:border-white/5">
                        <button
                            onClick={() => setView("kanban")}
                            className={`p-1.5 rounded transition-all ${view === "kanban" ? "bg-gray-100 dark:bg-[#333333] text-brand-500 " : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={`p-1.5 rounded transition-all ${view === "list" ? "bg-gray-100 dark:bg-[#333333] text-brand-500 " : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded text-base transition-all font-bold"
                    >
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
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-brand-500/50 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg text-sm transition-all font-medium">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
                    <p className="text-xs font-black text-gray-600 tracking-widest hidden sm:block uppercase">
                        {isLoading ? "Loading..." : `${filteredTasks.length} Total Tasks`}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                    <p className="text-sm text-gray-500 font-medium">Fetching your tasks...</p>
                </div>
            ) : fetchError ? (
                <div className="flex flex-col items-center justify-center py-12 bg-red-500/5 border border-red-500/20 rounded">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                    <p className="text-red-500 font-bold text-sm mb-4">{(fetchError as Error).message}</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            ) : view === "kanban" ? (
                <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
                    {columns.map(column => (
                        <div key={column} className="flex flex-col gap-4 min-w-[300px] flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{column.replace('_', ' ')}</h3>
                                    <span className="bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/5">
                                        {filteredTasks.filter(t => t.status === column).length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="text-gray-400 hover:text-brand-500 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4 min-h-[500px]">
                                {filteredTasks.filter(t => t.status === column).map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onDelete={handleDeleteTask}
                                        onStatusUpdate={handleUpdateStatus}
                                    />
                                ))}
                                {filteredTasks.filter(t => t.status === column).length === 0 && (
                                    <div className="border border-dashed border-gray-200 dark:border-white/5 rounded-xl h-24 flex items-center justify-center text-gray-400 dark:text-gray-700 text-[10px] font-bold uppercase tracking-widest">
                                        No Tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#2A2A2A]/20 border border-gray-200 dark:border-white/5 rounded overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-screen text-left border-collapse">
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
                                {filteredTasks.map(task => (
                                    <tr key={task.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500`}>
                                                    <CheckCircle2 className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[300px]">{task.title}</span>
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
                                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-xs">{task.dueDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-400 group-hover:text-white transition-colors`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium italic">
                                            No tasks found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => {
                    setCreateModalOpen(false);
                }}
                className="max-w-xl"
            >
                <div className="p-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-brand-500/10 rounded flex items-center justify-center">
                            <CheckSquare className="w-7 h-7 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
                            <p className="text-sm text-gray-400 font-medium mt-1">Add a new action item to your workflow</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateTask} className="space-y-8">
                        {createMutation.isError && (
                            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider">
                                <AlertCircle className="w-4 h-4" />
                                <span>{(createMutation.error as Error).message}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] tracking-widest text-gray-400 dark:text-gray-500">
                                Task Title
                            </label>
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g. Design System Documentation"
                                className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 rounded py-4 px-5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500/50 transition-all"
                                disabled={createMutation.isPending}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] tracking-widest text-gray-400 dark:text-gray-500">
                                Description
                            </label>
                            <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What needs to be done?"
                                rows={4}
                                className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500/50 transition-all resize-none font-medium leading-relaxed"
                                disabled={createMutation.isPending}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    Priority Level
                                </label>
                                <Select
                                    options={[
                                        { value: "LOW", label: "Low" },
                                        { value: "MEDIUM", label: "Medium" },
                                        { value: "HIGH", label: "High" },
                                        { value: "URGENT", label: "Urgent" }
                                    ]}
                                    defaultValue={newTask.priority}
                                    placeholder="Select priority"
                                    onChange={val => setNewTask(prev => ({ ...prev, priority: val as TaskPriority }))}
                                    className="h-14 bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-white/5 rounded-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="flex-1 py-4 border border-gray-200 dark:border-white/10 rounded text-[11px] text-gray-500 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 bg-brand-500 hover:bg-brand-600 rounded text-[11px] text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin font-black" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Create Task</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default Tasks;
