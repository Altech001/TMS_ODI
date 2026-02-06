import React, { useState, useEffect } from "react";
import {
    Folder,
    Search,
    Filter,
    Users,
    FileText,
    Plus,
    Clock,
    Briefcase,
    Loader2,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import { Link } from "react-router";
import { ProjectAPI, Project as APIProject } from "../../services/api";

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
        fileCount: 0, // API doesn't track files yet
        color: getProjectColor(project.id),
        description: project.description || "No description provided.",
    };
};

const CircularProgress = ({ progress, color }: { progress: number; color: string }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="6"
                    fill="transparent"
                />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke={color}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <span className="absolute text-[11px] font-bold text-gray-900 dark:text-white">{progress}%</span>
        </div>
    );
};

const ProjectCard = ({ project }: { project: ProjectUI }) => (
    <div className="bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 rounded p-0 overflow-hidden hover:border-gray-300 dark:hover:border-white/10 transition-all group hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/40">
        {/* Card Header with Pattern/Gradient */}
        <div
            className="h-24 w-full relative overflow-hidden"
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
        </div>

        {/* Content */}
        <div className="p-5 pt-8">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-500 transition-colors">
                {project.name}
            </h3>
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
                <CircularProgress progress={project.progress} color={project.color} />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-2">
                <Link
                    to={`/tasks?projectId=${project.id}`}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 rounded bg-white/2 hover:bg-white/5 transition-colors group/link"
                >
                    <Folder className="w-4 h-4 text-gray-500 group-hover/link:text-brand-400" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Tasks</span>
                </Link>
                <button className="flex flex-col items-center justify-center gap-1.5 py-2 rounded bg-white/2 hover:bg-white/5 transition-colors group/link">
                    <FileText className="w-4 h-4 text-gray-500 group-hover/link:text-brand-400" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Files</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1.5 py-2 rounded bg-white/2 hover:bg-white/5 transition-colors group/link">
                    <Users className="w-4 h-4 text-gray-500 group-hover/link:text-brand-400" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Team</span>
                </button>
            </div>
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
    const [search, setSearch] = useState("");
    const [projects, setProjects] = useState<ProjectUI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch projects from API
    const fetchProjects = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await ProjectAPI.getAll({
                limit: 50,
                status: "ACTIVE"
            });

            console.log("Projects API response:", response);

            if (response.success && response.data?.projects) {
                // Map API projects to UI format
                const uiProjects = response.data.projects.map(project =>
                    mapProjectToUI(project, project._count?.members || 0)
                );
                setProjects(uiProjects);
            } else if (response.success) {
                // Success but no projects array - set empty
                console.warn("API returned success but no projects array:", response);
                setProjects([]);
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err);
            setError(err instanceof Error ? err.message : "Failed to load projects");
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchProjects();
    }, []);

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

                <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded text-sm font-bold transition-all self-start md:self-auto">
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
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-[#2A2A2A]/40 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded text-sm font-bold transition-all uppercase tracking-widest text-[10px]">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Sort By</span>
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest hidden sm:block">
                        {isLoading ? "Loading..." : `${filteredProjects.length} Projects`}
                    </p>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center justify-center py-12 bg-red-500/5 border border-red-500/20 rounded mb-8">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                    <p className="text-red-500 font-bold text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchProjects}
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
            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#2A2A2A]/10 border border-dashed border-gray-200 dark:border-white/5 rounded mt-8">
                    <Folder className="w-12 h-12 text-gray-800 mb-4" />
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">
                        {search ? "No projects found matching your search" : "No projects yet. Create your first project!"}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Projects;
