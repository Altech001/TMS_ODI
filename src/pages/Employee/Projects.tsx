import {
    AlertCircle,
    Archive,
    Briefcase,
    Clock,
    FileText,
    Folder,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Users
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../context/OrganizationContext";
import { Modal } from "../../components/ui/modal";
import { Project as APIProject, ProjectAPI } from "../../services/api";

// UI Types (mapped from API)
interface ProjectUI {
    id: string;
    name: string;
    role: string;
    progress: number;
    deadline: string;
    teamCount: number;
    fileCount: number;
    color: string;
    description: string;
    status: string;
}

// Color palette for projects
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

// Get consistent color based on project ID
const getProjectColor = (id: string): string => {
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PROJECT_COLORS[hash % PROJECT_COLORS.length];
};

// Calculate deadline text from due date
const getDeadlineText = (project: APIProject): string => {
    if (project.status === "COMPLETED") return "Completed";
    if (project.status === "ARCHIVED") return "Archived";

    // If project has no specific due date, show status-based text
    return project.status === "ACTIVE" ? "Active" : "In Progress";
};

// Map API project to UI format
const mapProjectToUI = (project: APIProject, memberCount: number = 0): ProjectUI => {
    return {
        id: project.id,
        name: project.name,
        role: project.visibility === "ORG_WIDE" ? "Public" : "Private",
        progress: project.status === "COMPLETED" ? 100 : project.status === "ARCHIVED" ? 0 : 50,
        deadline: getDeadlineText(project),
        teamCount: memberCount,
        fileCount: project._count?.members || 0,
        color: getProjectColor(project.id),
        description: project.description || "No description provided.",
        status: project.status,
    };
};
const ProjectCard = ({
    project,
    onArchive,
    onDelete
}: {
    project: ProjectUI;
    onArchive?: (id: string) => void;
    onDelete?: (id: string) => void;
}) => (
    <div className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded p-0 overflow-hidden hover:border-gray-300 dark:hover:border-white/10 transition-all group hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/40">
        {/* Card Header with Pattern/Gradient */}
        <Link
            to={`/projects/${project.id}`}
            className="h-24 w-full relative overflow-hidden block"
            style={{ backgroundColor: `${project.color}15` }}
        >
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${project.color} 1px, transparent 0)`,
                    backgroundSize: '16px 16px'
                }}
            />
            <div className="absolute inset-x-4 bottom-[-20px] bg-white dark:bg-[#1A1A1A] w-12 h-12 rounded flex items-center justify-center border border-gray-200 dark:border-white/5 shadow-xl transition-transform group-hover:scale-110">
                <Briefcase className="w-6 h-6" style={{ color: project.color }} />
            </div>
            <div className="absolute top-4 right-4 bg-gray-900/40 dark:bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                {project.role}
            </div>
        </Link>

        {/* Content */}
        <div className="p-5 pt-8">
            <Link to={`/projects/${project.id}`}>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-500 transition-colors">
                    {project.name}
                </h3>
            </Link>
            <p className="text-xs text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                {project.description}
            </p>

            <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-200 dark:border-white/5">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{project.deadline}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Users className="w-3.5 h-3.5 opacity-60" />
                            <span className="text-[11px] font-medium">{project.teamCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <FileText className="w-3.5 h-3.5 opacity-60" />
                            <span className="text-[11px] font-medium">{project.fileCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2">
                <Link
                    to={`/tasks?projectId=${project.id}`}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 rounded bg-white/2 hover:bg-white/5 transition-colors group/link"
                >
                    <Folder className="w-4 h-4 text-gray-500 group-hover/link:text-brand-400" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Tasks</span>
                </Link>
                <button
                    onClick={() => onDelete?.(project.id)}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 rounded bg-white/2 hover:bg-red-500/10 transition-colors group/link"
                >
                    <Trash2 className="w-4 h-4 text-gray-500 group-hover/link:text-red-500" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase group-hover/link:text-red-500">Delete</span>
                </button>
            </div>

            {project.status === "ACTIVE" && onArchive && (
                <button
                    onClick={() => onArchive(project.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest"
                >
                    <Archive className="w-3.5 h-3.5" />
                    Archive Project
                </button>
            )}
        </div>
    </div>
);

// Loading skeleton for project cards
const ProjectCardSkeleton = () => (
    <div className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded p-0 overflow-hidden animate-pulse">
        <div className="h-24 w-full bg-gray-200 dark:bg-white/5" />
        <div className="p-5 pt-8">
            <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-4" />
            <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-2/3 mb-6" />
            <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-200 dark:border-white/5">
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-20" />
                    <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-16" />
                </div>
                <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="h-12 bg-gray-200 dark:bg-white/5 rounded" />
                <div className="h-12 bg-gray-200 dark:bg-white/5 rounded" />
                <div className="h-12 bg-gray-200 dark:bg-white/5 rounded" />
            </div>
        </div>
    </div>
);

const Projects: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const { currentOrganization } = useOrganization();

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: "", description: "" });

    // Fetch projects query
    const {
        data: projects = [],
        isLoading,
        error: fetchError
    } = useQuery({
        queryKey: ["projects", currentOrganization?.id],
        queryFn: async () => {
            const response = await ProjectAPI.getAll({ limit: 50 });
            if (response.success && Array.isArray(response.data)) {
                return response.data.map(p => mapProjectToUI(p, p._count?.members || 0));
            }
            return [];
        },
        enabled: !!currentOrganization,
    });

    // Create project mutation
    const createMutation = useMutation({
        mutationFn: (data: { name: string; description: string; visibility: "PRIVATE" }) => ProjectAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setShowCreateModal(false);
            setNewProject({ name: "", description: "" });
        }
    });

    // Archive project mutation
    const archiveMutation = useMutation({
        mutationFn: (id: string) => ProjectAPI.archive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        }
    });

    // Delete project mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => ProjectAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        }
    });

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name.trim()) return;
        createMutation.mutate({
            name: newProject.name.trim(),
            description: newProject.description.trim(),
            visibility: "PRIVATE"
        });
    };

    const handleArchiveProject = (id: string) => {
        archiveMutation.mutate(id);
    };

    const handleDeleteProject = (id: string) => {
        if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
        deleteMutation.mutate(id);
    };

    // Filter projects by search
    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Projects</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Overview of projects you are currently leading or part of.</p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded text-sm font-bold transition-all self-start md:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Project</span>
                </button>
            </div>

            {/* Filters/Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pt-6 border-t border-gray-200 dark:border-white/5">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search projects by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-brand-500/50 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">

                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
                    <p className="text-xs font-bold text-gray-600 hidden sm:block">
                        {isLoading ? "Loading..." : `${filteredProjects.length} Projects`}
                    </p>
                </div>
            </div>

            {/* Error State */}
            {fetchError && (
                <div className="flex flex-col items-center justify-center py-12 bg-red-500/5 border border-red-500/20 rounded mb-8">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                    <p className="text-red-500 font-bold text-sm mb-4">{(fetchError as Error).message}</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <ProjectCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Projects Grid */}
            {!isLoading && !fetchError && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onArchive={handleArchiveProject}
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !fetchError && filteredProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#2A2A2A]/10 border border-dashed border-gray-200 dark:border-white/5 rounded mt-8">
                    <Folder className="w-12 h-12 text-gray-800 mb-4" />
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">
                        {search ? "No projects found matching your search" : "No projects yet. Create your first project!"}
                    </p>
                </div>
            )}

            {/* Create Project Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                }}
                className="max-w-lg"
            >
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Create New Project</h2>
                            <p className="text-sm text-gray-500 font-medium">Add a new workspace to your organization</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateProject} className="space-y-6">
                        {createMutation.isError && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-bold uppercase tracking-wider">
                                <AlertCircle className="w-4 h-4" />
                                <span>{(createMutation.error as Error).message}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Project Name
                            </label>
                            <input
                                type="text"
                                value={newProject.name}
                                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Q1 Marketing Campaign"
                                className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 rounded py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500/50 transition-all"
                                disabled={createMutation.isPending}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Description
                            </label>
                            <textarea
                                value={newProject.description}
                                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What is this project about?"
                                rows={4}
                                className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 rounded py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500/50 transition-all resize-none"
                                disabled={createMutation.isPending}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 border border-gray-200 dark:border-white/10 rounded text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 rounded text-white flex items-center justify-center gap-2"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Project</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default Projects;
