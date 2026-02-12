import { ApexOptions } from "apexcharts";
import {
    ArrowUpRight,
    Calendar,
    CheckCircle,
    DollarSign,
    ExternalLink,
    Eye,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
    TrendingUp,
    Upload,
    Utensils,
    X,
    XCircle
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";
import { useOrganization } from "../../context/OrganizationContext";
import { Expense as APIExpense, ExpenseAPI, ExpenseCategory, ExpenseStatus } from "../../services/api";

interface ExpenseUI {
    id: string;
    date: string;
    title: string;
    category: ExpenseCategory;
    amount: number;
    currency: string;
    status: ExpenseStatus;
    receiptUrl?: string;
    description?: string;
}

// Helper to map API expense to UI expense
const mapExpenseToUI = (exp: APIExpense): ExpenseUI => {
    return {
        id: exp.id,
        date: new Date(exp.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        title: exp.title,
        category: exp.category,
        amount: typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount || 0,
        currency: exp.currency,
        status: exp.status,
        receiptUrl: exp.receiptUrl,
        description: exp.description
    };
};

const StatusBadge = ({ status }: { status: ExpenseStatus }) => {
    const styles = {
        PENDING: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
        REIMBURSED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${styles[status]}`}>
            {status}
        </span>
    );
};

const CategoryIcon = ({ category }: { category: ExpenseCategory }) => {
    switch (category) {
        case "TRAVEL": return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
        case "MEALS": return <Utensils className="w-4 h-4 text-orange-400" />;
        case "EQUIPMENT": return <FileText className="w-4 h-4 text-purple-400" />;
        case "SUPPLIES": return <TrendingUp className="w-4 h-4 text-yellow-400" />;
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

const Expenses: React.FC = () => {
    const [selectedExpense, setSelectedExpense] = useState<ExpenseUI | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [expenses, setExpenses] = useState<ExpenseUI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { currentOrganization } = useOrganization();

    // Form state
    const [newTitle, setNewTitle] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newCategory, setNewCategory] = useState<ExpenseCategory>("OTHER");
    const [newDesc, setNewDesc] = useState("");

    const fetchExpenses = useCallback(async () => {
        if (!currentOrganization) {
            setExpenses([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await ExpenseAPI.getAll({ limit: 100 });
            if (response.success && Array.isArray(response.data)) {
                setExpenses(response.data.map(mapExpenseToUI));
            } else {
                setExpenses([]);
            }
        } catch (err) {
            console.error("Failed to fetch expenses:", err);
            setError(err instanceof Error ? err.message : "Failed to load expenses");
        } finally {
            setIsLoading(false);
        }
    }, [currentOrganization]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newAmount) return;

        try {
            setIsCreating(true);
            const response = await ExpenseAPI.create({
                title: newTitle.trim(),
                amount: parseFloat(newAmount),
                category: newCategory,
                description: newDesc.trim(),
                currency: "USD"
            });

            if (response.success && response.data) {
                setExpenses(prev => [mapExpenseToUI(response.data), ...prev]);
                setIsCreateModalOpen(false);
                setNewTitle("");
                setNewAmount("");
                setNewCategory("OTHER");
                setNewDesc("");
            }
        } catch (err) {
            console.error("Failed to create expense:", err);
            setError(err instanceof Error ? err.message : "Failed to create expense");
        } finally {
            setIsCreating(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const response = await ExpenseAPI.approve(id);
            if (response.success) {
                setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: "APPROVED" } : e));
                if (selectedExpense?.id === id) setSelectedExpense(null);
            }
        } catch (err) {
            console.error("Failed to approve expense:", err);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Enter rejection reason:");
        if (reason === null) return;
        try {
            const response = await ExpenseAPI.reject(id, reason || "No reason provided");
            if (response.success) {
                setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: "REJECTED" } : e));
                if (selectedExpense?.id === id) setSelectedExpense(null);
            }
        } catch (err) {
            console.error("Failed to reject expense:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense claim?")) return;
        try {
            const response = await ExpenseAPI.delete(id);
            if (response.success) {
                setExpenses(prev => prev.filter(e => e.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete expense:", err);
        }
    };

    const totalClaimedValue = expenses.reduce((sum, e) => sum + e.amount, 0);
    const approvedValue = expenses.filter(e => e.status === "APPROVED" || e.status === "REIMBURSED").reduce((sum, e) => sum + e.amount, 0);
    const pendingValue = expenses.filter(e => e.status === "PENDING").reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">My Expenses</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage and track your financial claims and reimbursements.</p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-none text-sm font-semibold transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Expense</span>
                </button>
            </div>

            {/* Status Cards with Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {/* Total Claimed */}
                <div className="bg-white dark:bg-[#1C1C1C] p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Claimed</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">${totalClaimedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Recent</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <MiniSparkline color="#465FFF" />
                        </div>
                    </div>
                </div>

                {/* Approved */}
                <div className="bg-white dark:bg-[#1C1C1C] p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Approved</p>
                            <h3 className="text-2xl font-semibold text-green-500 mb-1">${approvedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{expenses.filter(e => e.status === "APPROVED").length} claims processed</p>
                        </div>
                        <div className="pt-2">
                            <MiniSparkline color="#10B981" />
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white dark:bg-[#1C1C1C] p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                            <h3 className="text-2xl font-semibold text-orange-500 mb-1">${pendingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Awaiting review</p>
                        </div>
                        <div className="pt-2">
                            <MiniSparkline color="#F59E0B" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Table */}
            <div className="bg-white dark:bg-[#1C1C1C]/40 border-t border-gray-200 dark:border-white/5 rounded overflow-hidden">
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-4" />
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loading Expenses...</p>
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <DollarSign className="w-12 h-12 text-gray-200 dark:text-white/5 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium italic">No expenses found.</p>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map(exp => (
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
                                                {Number(exp.amount || 0).toFixed(2)} <span className="text-gray-600 text-[11px] ml-1 uppercase">{exp.currency}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={exp.status} />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {exp.status === "PENDING" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(exp.id);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className="p-2 text-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-all">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create New Expense Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setError(null);
                }}
                className="max-w-xl"
            >
                <form onSubmit={handleCreateExpense} className="flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#161616]">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Expense</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Submit a new financial claim</p>
                        </div>
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px]  uppercase tracking-widest">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expense Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Flight to Berlin"
                                    className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded py-3 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 font-medium"
                                    disabled={isCreating}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</label>
                                    <Select
                                        options={["TRAVEL", "MEALS", "SUPPLIES", "EQUIPMENT", "SOFTWARE", "SERVICES", "MARKETING", "OTHER"].map(cat => ({ value: cat, label: cat }))}
                                        defaultValue={newCategory}
                                        placeholder="Select category"
                                        onChange={val => setNewCategory(val as ExpenseCategory)}
                                        className="h-[46px] bg-gray-50 dark:bg-[#161616] border-gray-200 dark:border-white/10 rounded-none text-sm font-bold uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={newAmount}
                                            onChange={(e) => setNewAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded pl-8 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 font-bold"
                                            disabled={isCreating}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Add some details about this claim..."
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all resize-none font-medium leading-relaxed"
                                    disabled={isCreating}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attachment / Receipt</label>
                                <div className="border-2 border-dashed border-gray-200 dark:border-white/5 rounded p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:border-brand-500/50 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 rounded bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-500 transition-colors">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400">OCR Support Enabled</p>
                                    <p className="text-[10px] text-gray-600 uppercase">PDF, JPG, PNG up to 10MB</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-[#161616] border-t border-gray-200 dark:border-white/5 flex gap-3 justify-end items-center">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#333333] text-gray-600 dark:text-gray-400 text-xs  uppercase rounded transition-all"
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-[11px]  uppercase tracking-widest rounded transition-all flex items-center gap-2"
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <span>Submit Claim</span>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Expense Detail Modal Overlay */}
            {selectedExpense && (
                <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 backdrop-blur-sm" onClick={() => setSelectedExpense(null)}></div>
                    <div className="relative bg-white dark:bg-[#0F0F0F] w-full max-w-4xl max-h-[90vh] rounded border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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
                                <div className="aspect-[3/4] border border-white/5 flex flex-col items-center justify-center p-12 text-center group relative overflow-hidden">
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
                                                <p className="text-sm font-bold text-white">Expense Submitted</p>
                                                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">{selectedExpense.date}</p>
                                            </div>
                                        </div>
                                        {selectedExpense.status === "PENDING" ? (
                                            <div className="relative pl-8">
                                                <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-orange-500 border-4 border-[#0F0F0F] dark:border-white/5"></span>
                                                <div>
                                                    <p className="text-sm font-bold text-white uppercase tracking-widest">Awaiting Manager Review</p>
                                                    <p className="text-[10px] font-medium text-gray-500 mt-1 leading-relaxed italic">"Claims are typically reviewed within 24-48 hours."</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative pl-8">
                                                <span className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-[#0F0F0F] ${selectedExpense.status === "APPROVED" ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <div>
                                                    <p className="text-sm font-bold text-white uppercase tracking-widest">{selectedExpense.status}</p>
                                                    <p className="text-[10px] font-medium text-gray-500 mt-1 leading-relaxed">Processed by the organization management.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="bg-white/[0.02] p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                                        <StatusBadge status={selectedExpense.status} />
                                    </div>
                                    <h4 className="text-4xl font-bold text-white tracking-tighter">
                                        {Number(selectedExpense.amount || 0).toFixed(2)} <span className="text-gray-500 text-sm  uppercase">{selectedExpense.currency}</span>
                                    </h4>
                                </section>

                                {selectedExpense.status === "PENDING" && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReject(selectedExpense.id)}
                                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px]  uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 border border-red-500/20"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedExpense.id)}
                                            className="flex-1 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[10px]  uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 border border-green-500/20"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
