import { ApexOptions } from "apexcharts";
import {
    Activity,
    Banknote,
    CheckCircle,
    ChevronRight,
    CreditCard,
    DollarSign,
    FileText,
    MoreHorizontal,
    PieChart,
    Search,
    Wallet,
    XCircle
} from "lucide-react";
import React from "react";
import Chart from "react-apexcharts";

// Types
interface Expense {
    id: string;
    employee: string;
    category: string;
    amount: number;
    date: string;
    receipt: boolean;
    description: string;
}

interface Budget {
    id: string;
    name: string;
    allocated: number;
    spent: number;
    color: string;
}

// Mock Data
const pendingExpenses: Expense[] = [
    {
        id: "1",
        employee: "John Smith",
        category: "Travel",
        amount: 1250.00,
        date: "2024-03-20",
        receipt: true,
        description: "Flight to London for client meeting"
    },
    {
        id: "2",
        employee: "Sarah Connor",
        category: "Software",
        amount: 299.99,
        date: "2024-03-21",
        receipt: true,
        description: "Adobe Creative Cloud Annual Subscription"
    },
    {
        id: "3",
        employee: "Michael Chen",
        category: "Equipment",
        amount: 2400.00,
        date: "2024-03-18",
        receipt: false,
        description: "MacBook Pro M3 for development team"
    }
];

const budgets: Budget[] = [
    { id: "1", name: "Operations", allocated: 50000, spent: 32000, color: "bg-brand-500" },
    { id: "2", name: "Marketing", allocated: 25000, spent: 18500, color: "bg-purple-500" },
    { id: "3", name: "R&D", allocated: 100000, spent: 45000, color: "bg-green-500" },
    { id: "4", name: "Infrastructure", allocated: 75000, spent: 68000, color: "bg-amber-500" }
];

// Spend Trend Chart
const SpendChart: React.FC = () => {
    const options: ApexOptions = {
        chart: {
            type: "area",
            fontFamily: "Outfit, sans-serif",
            toolbar: { show: false },
            sparkline: { enabled: false }
        },
        stroke: { curve: "smooth", width: 2 },
        fill: {
            type: "gradient",
            gradient: { opacityFrom: 0.4, opacityTo: 0 }
        },
        colors: ["#465fff"],
        grid: {
            borderColor: "rgba(255,255,255,0.05)",
            xaxis: { lines: { show: false } }
        },
        xaxis: {
            categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
            labels: { style: { colors: "#98a2b3", fontSize: "10px" } }
        },
        yaxis: {
            labels: {
                style: { colors: "#98a2b3", fontSize: "10px" },
                formatter: (val) => `$${val / 1000}K`
            }
        },
        tooltip: { theme: "dark" }
    };

    const series = [{ name: "Actual Spend", data: [45000, 52000, 48000, 61000] }];

    return (
        <div className="h-[200px]">
            <Chart options={options} series={series} type="area" height={200} />
        </div>
    );
};

const FinancialsApprovals: React.FC = () => {
    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-600 dark:text-white tracking-tight">
                        Financials & Approvals
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Expense management and budget tracking for your organization
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded text-sm font-bold uppercase tracking-widest transition-all">
                        <Banknote className="w-4 h-4" />
                        Settlement Overview
                    </button>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-brand-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Total Budget</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$250,000</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-purple-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Spend to Date</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$163,500</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-amber-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-500">$3,950</p>
                </div>
                <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <PieChart className="w-4 h-4 text-green-500" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase">Efficiency</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">92%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Approval Queue */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            Approval Queue
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                className="pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingExpenses.map((expense) => (
                            <div key={expense.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-md p-5 group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{expense.employee}</h3>
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-[9px] font-bold text-gray-500 rounded uppercase tracking-widest">
                                                    {expense.category}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                                {expense.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">${expense.amount.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{expense.date}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="w-9 h-9 flex items-center justify-center bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button className="w-9 h-9 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                            <button className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Budget Tracker Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                                Budget Tracker
                            </h3>
                            <button className="text-[10px] font-bold text-brand-500 uppercase tracking-widest hover:underline">View All</button>
                        </div>

                        <div className="space-y-6">
                            {budgets.map((budget) => {
                                const percentage = Math.min(100, Math.round((budget.spent / budget.allocated) * 100));
                                return (
                                    <div key={budget.id}>
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{budget.name}</p>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                                    ${budget.spent.toLocaleString()} / ${budget.allocated.toLocaleString()}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-bold ${percentage > 90 ? "text-red-500" : "text-gray-500"}`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${budget.color}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">Spend Trend (monthly)</h4>
                            <SpendChart />
                        </div>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <DollarSign className="w-16 h-16" />
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-tight mb-1">Treasury Settlement</h4>
                        <p className="text-[10px] text-white/80 uppercase tracking-widest mb-4 font-bold">Next cycle: April 1st, 2024</p>
                        <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            Generate Report <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialsApprovals;
