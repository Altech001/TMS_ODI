import {
    ArrowUpRight,
    Calendar,
    DollarSign,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Plus,
    TrendingUp,
    Upload,
    Utensils,
    X
} from "lucide-react";
import React, { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

// Types
type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";
type Category = "TRAVEL" | "MEALS" | "UTILITIES" | "EQUIPMENT" | "OTHER";

interface Expense {
    id: string;
    date: string;
    title: string;
    category: Category;
    amount: number;
    currency: string;
    status: ExpenseStatus;
    receiptUrl?: string;
}

const mockExpenses: Expense[] = [
    { id: "EXP-001", date: "Feb 01, 2026", title: "Flight to New York", category: "TRAVEL", amount: 450.00, currency: "USD", status: "PENDING" },
    { id: "EXP-002", date: "Jan 28, 2026", title: "Team Lunch - Client Onboarding", category: "MEALS", amount: 125.50, currency: "USD", status: "APPROVED" },
    { id: "EXP-003", date: "Jan 25, 2026", title: "Office Fiber Internet", category: "UTILITIES", amount: 89.00, currency: "USD", status: "APPROVED" },
    { id: "EXP-004", date: "Jan 20, 2026", title: "New Mechanical Keyboard", category: "EQUIPMENT", amount: 159.00, currency: "USD", status: "REJECTED" },
    { id: "EXP-005", date: "Jan 15, 2026", title: "Uber to Airport", category: "TRAVEL", amount: 45.00, currency: "USD", status: "APPROVED" },
];

const StatusBadge = ({ status }: { status: ExpenseStatus }) => {
    const styles = {
        PENDING: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${styles[status]}`}>
            {status}
        </span>
    );
};

const CategoryIcon = ({ category }: { category: Category }) => {
    switch (category) {
        case "TRAVEL": return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
        case "MEALS": return <Utensils className="w-4 h-4 text-orange-400" />;
        case "UTILITIES": return <TrendingUp className="w-4 h-4 text-yellow-400" />;
        case "EQUIPMENT": return <FileText className="w-4 h-4 text-purple-400" />;
        default: return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
};

const MiniSparkline = ({ color }: { color: string }) => {
    const chartOptions: ApexOptions = {
        chart: {
            type: "area",
            sparkline: { enabled: true },
            animations: { enabled: true }
        },
        stroke: { curve: "smooth", width: 2 },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100, 100, 100]
            }
        },
        colors: [color],
        tooltip: { enabled: false }
    };

    const series = [{
        name: "data",
        data: [31, 40, 28, 51, 42, 109, 100]
    }];

    return <Chart options={chartOptions} series={series} type="area" height={48} width={100} />;
};

const Expense: React.FC = () => {
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Expenses</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage and track your financial claims and reimbursements.</p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded text-sm font-bold transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Expense</span>
                </button>
            </div>

            {/* Status Cards with Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {/* Total Claimed */}
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Claimed</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">$1,245.50</h3>
                            <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+12.5%</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <MiniSparkline color="#465FFF" />
                        </div>
                    </div>
                </div>

                {/* Approved */}
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Approved</p>
                            <h3 className="text-2xl font-bold text-green-500 mb-1">$635.00</h3>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">5 claims processed</p>
                        </div>
                        <div className="pt-2">
                            <MiniSparkline color="#10B981" />
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                            <h3 className="text-2xl font-bold text-orange-500 mb-1">$450.00</h3>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Awaiting review</p>
                        </div>
                        <div className="pt-2">
                            <MiniSparkline color="#F59E0B" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Table */}
            <div className="bg-white dark:bg-[#1C1C1C]/40 border border-gray-200 dark:border-white/5 rounded overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left font-medium">
                        <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">Date & Title</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {mockExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedExpense(exp)}>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-500 transition-colors">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{exp.title}</p>
                                                <p className="text-[10px] text-gray-600 uppercase mt-0.5">{exp.date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2.5">
                                            <CategoryIcon category={exp.category} />
                                            <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase">{exp.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center text-sm font-bold text-gray-900 dark:text-white">
                                            {exp.amount.toFixed(2)} <span className="text-gray-600 text-[11px] ml-1 uppercase">{exp.currency}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusBadge status={exp.status} />
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 text-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-all">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create New Expense Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#0F0F0F] w-full max-w-xl rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#161616]">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Expense</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Submit a new financial claim</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expense Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Flight to Berlin"
                                        className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</label>
                                        <select className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-medium appearance-none cursor-pointer">
                                            <option>TRAVEL</option>
                                            <option>MEALS</option>
                                            <option>UTILITIES</option>
                                            <option>EQUIPMENT</option>
                                            <option>OTHER</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-lg pl-8 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Currency</label>
                                        <select className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-medium appearance-none cursor-pointer">
                                            <option>USD</option>
                                            <option>UGX</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attachment / Receipt</label>
                                    <div className="border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:border-brand-500/50 transition-all cursor-pointer group">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-500 transition-colors">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400">Click or drag to upload receipt</p>
                                        <p className="text-[10px] text-gray-600 uppercase">PDF, JPG, PNG up to 10MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-[#161616] border-t border-gray-200 dark:border-white/5 flex gap-3 justify-end items-center">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#333333] text-gray-600 dark:text-gray-400 text-xs font-bold uppercase rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button className="px-8 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg transition-all">
                                Submit Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Detail Modal Overlay */}
            {selectedExpense && (
                <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 backdrop-blur-sm" onClick={() => setSelectedExpense(null)}></div>
                    <div className="relative bg-[#0F0F0F] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#161616]">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-widest uppercase">{selectedExpense.id}</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{selectedExpense.title}</p>
                            </div>
                            <button onClick={() => setSelectedExpense(null)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Receipt Preview
                                </h3>
                                <div className="aspect-[3/4] bg-[#1C1C1C] rounded-2xl border border-white/5 flex flex-col items-center justify-center p-12 text-center group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none"></div>
                                    <FileText className="w-16 h-16 text-white/5 mb-4 group-hover:scale-110 transition-transform" />
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">OCR Scanned Receipt</p>
                                    <p className="text-[10px] text-gray-600 mt-2 font-medium">Receipt_{selectedExpense.id}_final.pdf</p>
                                    <button className="mt-6 flex items-center gap-2 text-brand-400 text-[10px] font-bold uppercase hover:text-brand-300 transition-colors">
                                        <ExternalLink className="w-4 h-4" /> View Original
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Approval History</h3>
                                    <div className="space-y-6 relative ml-1 pt-1">
                                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/5"></div>
                                        <div className="relative pl-8">
                                            <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-[#0F0F0F]"></span>
                                            <div>
                                                <p className="text-sm font-bold text-white">Expense Created</p>
                                                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">{selectedExpense.date} • 10:45 AM</p>
                                            </div>
                                        </div>
                                        <div className="relative pl-8">
                                            <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-orange-500 border-4 border-[#0F0F0F]"></span>
                                            <div>
                                                <p className="text-sm font-bold text-white">Manager Review (Alex Johnson)</p>
                                                <p className="text-[10px] font-medium text-gray-500 mt-1 leading-relaxed">"Verification of flight dates required. Please ensure no personal stopovers are included in the claim."</p>
                                            </div>
                                        </div>
                                        <div className="relative pl-8">
                                            <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#2A2A2A] border-4 border-[#0F0F0F]"></span>
                                            <div>
                                                <p className="text-sm font-bold text-gray-600 uppercase">Final Processing (Finance)</p>
                                                <p className="text-[10px] text-gray-800 mt-1 uppercase font-bold tracking-widest">Awaiting Approval</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                                        <StatusBadge status={selectedExpense.status} />
                                    </div>
                                    <h4 className="text-4xl font-bold text-white tracking-tighter">
                                        {selectedExpense.amount.toFixed(2)} <span className="text-gray-500 text-sm font-bold">{selectedExpense.currency}</span>
                                    </h4>
                                </section>
                            </div>
                        </div>

                        <div className="p-6 bg-[#161616] border-t border-white/5 flex gap-3 justify-end items-center">
                            <button onClick={() => setSelectedExpense(null)} className="px-6 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-gray-400 text-xs font-bold uppercase rounded-lg transition-all">Close Details</button>
                            <button className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2">
                                <Download className="w-4 h-4" /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expense;
