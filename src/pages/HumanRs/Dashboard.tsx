import {
    ChevronRight,
    Download,
    FileText,
    Mail,
    MapPin,
    Network,
    Phone,
    Search,
    User,
    Users
} from "lucide-react";
import React, { useState } from "react";

// Types
interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    location: string;
    reportsTo?: string;
    status: "Active" | "On Leave" | "Offboarded";
}

// Mock Data
const mockEmployees: Employee[] = [
    {
        id: "1",
        name: "Jane Doe",
        role: "Senior Software Engineer",
        department: "Engineering",
        email: "jane.doe@techcorp.io",
        phone: "+1 (555) 001-2233",
        location: "New York, USA",
        status: "Active"
    },
    {
        id: "2",
        name: "Robert Fox",
        role: "Product Manager",
        department: "Product",
        email: "robert.fox@techcorp.io",
        phone: "+1 (555) 001-4455",
        location: "London, UK",
        reportsTo: "Jane Doe",
        status: "Active"
    },
    {
        id: "3",
        name: "Cody Fisher",
        role: "UI/UX Designer",
        department: "Design",
        email: "cody.fisher@techcorp.io",
        phone: "+1 (555) 001-7788",
        location: "Remote",
        reportsTo: "Jane Doe",
        status: "On Leave"
    },
    {
        id: "4",
        name: "Esther Howard",
        role: "HR Manager",
        department: "Human Resources",
        email: "esther.howard@techcorp.io",
        phone: "+1 (555) 001-9900",
        location: "New York, USA",
        status: "Active"
    }
];

const EmployeeDirectory: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeView, setActiveView] = useState<"directory" | "org-chart">("directory");
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const filteredEmployees = mockEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Employee Directory
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Manage personnel information and organizational structure
                    </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md">
                    <button
                        onClick={() => setActiveView("directory")}
                        className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === "directory"
                            ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        Directory
                    </button>
                    <button
                        onClick={() => setActiveView("org-chart")}
                        className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === "org-chart"
                            ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Network className="w-3.5 h-3.5" />
                        Org Chart
                    </button>
                </div>
            </div>

            {activeView === "directory" ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main List */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, role, or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredEmployees.map((emp) => (
                                <div
                                    key={emp.id}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`bg-white dark:bg-[#1C1C1C] border ${selectedEmployee?.id === emp.id ? "border-brand-500/50" : "border-gray-200 dark:border-white/5"
                                        } rounded-md p-5 hover:border-brand-500/30 transition-all cursor-pointer group`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                            <User className="w-6 h-6 text-gray-400 group-hover:text-brand-500 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate">
                                                {emp.name}
                                            </h3>
                                            <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                                                {emp.role}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${emp.status === "Active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    }`}>
                                                    {emp.status}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">• {emp.department}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Details Sidebar */}
                    <div className="space-y-6">
                        {selectedEmployee ? (
                            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 dark:border-white/5">
                                    <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                                        <User className="w-12 h-12 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedEmployee.name}</h3>
                                    <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mt-1">{selectedEmployee.role}</p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact Info</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{selectedEmployee.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{selectedEmployee.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{selectedEmployee.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Documents</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {["Employment_Contract.pdf", "Identity_Doc.jpg", "Tax_Declaration.pdf"].map((doc) => (
                                            <div key={doc} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 group hover:border-brand-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight truncate max-w-[120px]">{doc}</span>
                                                </div>
                                                <button className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md transition-all">
                                                    <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-10 text-center flex flex-col items-center justify-center">
                                <Users className="w-12 h-12 text-gray-200 mb-4" />
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select an employee to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-8 min-h-[500px] flex flex-col items-center animate-in zoom-in-95 duration-500">
                    <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-12 flex items-center gap-2">
                        <Network className="w-4 h-4 text-brand-500" />
                        Visual Organizational Hierarchy
                    </h2>

                    <div className="space-y-12 w-full max-w-4xl flex flex-col items-center">
                        {/* CEO / Top Level */}
                        <div className="relative flex flex-col items-center">
                            <div className="px-6 py-4 bg-gray-50 dark:bg-[#2A2A2A] border-2 border-brand-500 rounded-xl shadow-lg relative z-10 w-64">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-brand-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Jane Doe</h4>
                                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Founder & CEO</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-12 w-0.5 bg-gray-200 dark:bg-white/10 mt-0"></div>
                        </div>

                        {/* Second level */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gray-200 dark:bg-white/10 -mt-12"></div>

                            {[
                                { name: "Robert Fox", role: "Product VP", dept: "Product" },
                                { name: "Cody Fisher", role: "Design Director", dept: "Design" },
                                { name: "Esther Howard", role: "HR Director", dept: "Human Resources" }
                            ].map((member, idx) => (
                                <div key={idx} className="flex flex-col items-center relative">
                                    <div className="h-12 w-0.5 bg-gray-200 dark:bg-white/10 -mt-12 absolute top-0"></div>
                                    <div className="px-5 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl relative z-10 w-full mt-4 hover:border-brand-500 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{member.name}</h4>
                                                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">{member.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDirectory;
