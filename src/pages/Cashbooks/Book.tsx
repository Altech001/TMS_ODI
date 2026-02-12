import {
    ArrowLeft,
    ChevronDown,
    CloudUpload,
    Download,
    Plus,
    Search,
    Settings,
    UserPlus,
    X,
    Info,
    Calendar as CalendarIcon,
    Clock,
    Minus,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Checkbox from "../../components/form/input/Checkbox";

const Book: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerType, setDrawerType] = useState<"in" | "out">("in");

    const transactions = [
        {
            id: 1,
            dateTime: "Today, 01:13 AM",
            details: "Altech Albert",
            by: "by You",
            category: "Sale",
            mode: "Cash",
            amount: "1,000",
            balance: "1,000",
            type: "in",
        },
    ];

    const openDrawer = (type: "in" | "out") => {
        setDrawerType(type);
        setIsDrawerOpen(true);
    };

    console.log("Viewing book:", id);

    return (
        <div className="bg-white dark:bg-[#0F0F0F] min-h-screen font-outfit text-[#111827] dark:text-white/90 relative">
            {/* --- HEADER --- */}
            <header className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#0F0F0F] z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/cashbooks")}
                        className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full transition-colors text-gray-600 dark:text-gray-400"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Business Book</h1>
                    <div className="flex items-center gap-3.5 ml-2">
                        <button className="text-brand-500 hover:text-brand-600 transition-colors">
                            <Settings size={18} />
                        </button>
                        <button className="text-brand-500 hover:text-brand-600 transition-colors">
                            <UserPlus size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-brand-500 text-[13px] font-bold hover:opacity-80 transition-opacity">
                        <CloudUpload size={18} />
                        Add Bulk Entries
                    </button>
                    <button className="flex items-center gap-2 bg-white dark:bg-white/5 px-5 py-2 rounded-xs text-brand-500 text-[13px] font-bold border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                        <Download size={16} />
                        Reports
                    </button>
                </div>
            </header>

            <main className={`px-6 py-6 transition-opacity duration-300 ${isDrawerOpen ? "opacity-40 pointer-events-none" : ""}`}>
                {/* --- FILTERS --- */}
                <div className="flex flex-row items-center gap-2.5 mb-6">
                    {[
                        { label: "Duration: All Time", width: "160px" },
                        { label: "Types: All", width: "120px" },
                        { label: "Contacts: All", width: "140px" },
                        { label: "Members: All", width: "140px" },
                        { label: "Payment Modes: All", width: "170px" },
                        { label: "Categories: All", width: "150px" },
                    ].map((filter) => (
                        <Select
                            key={filter.label}
                            options={[{ value: "all", label: "All" }]}
                            placeholder={filter.label}
                            onChange={() => { }}
                            className={`min-w-[${filter.width}] border-gray-100 rounded-sm text-[12px] font-medium h-9`}
                        />
                    ))}
                </div>

                {/* --- SEARCH & ACTIONS --- */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="relative flex-1 max-w-[450px]">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search by remark or amount..."
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-100 dark:border-white/10 rounded-xs shadow-none text-[13px] font-medium bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <span className="text-[11px] text-gray-300 dark:text-gray-500 border border-gray-100 dark:border-white/10 px-2 rounded-xs font-mono bg-gray-50 dark:bg-white/5">
                                /
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => openDrawer("in")}
                            className="flex items-center gap-2.5 px-8 rounded-sm transition-all transform"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Cash In
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => openDrawer("out")}
                            className="flex items-center gap-2.5 px-8 rounded-sm transition-all transform"
                        >
                            <Minus size={18} strokeWidth={3} />
                            Cash Out
                        </Button>
                    </div>
                </div>

                {/* --- STATS CARDS --- */}
                <div className="grid grid-cols-3 gap-0 border border-gray-100 dark:border-white/10 rounded-xs mb-10 overflow-hidden divide-x divide-gray-100 dark:divide-white/10">
                    <div className="p-5 flex items-center gap-4 bg-white dark:bg-[#1C1C1C]">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
                            <Plus size={15} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 mb-1">Cash In</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">1,000</p>
                        </div>
                    </div>
                    <div className="p-5 flex items-center gap-4 bg-white dark:bg-[#1C1C1C]">
                        <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center">
                            <Minus size={15} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 mb-1">Cash Out</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">0</p>
                        </div>
                    </div>
                    <div className="p-5 flex items-center gap-4 bg-white dark:bg-[#1C1C1C]">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-500 flex items-center justify-center font-bold text-xl">
                            =
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 mb-1">Net Balance</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">1,000</p>
                        </div>
                    </div>
                </div>

                {/* --- TABLE HEADER --- */}
                <div className="flex items-center justify-between mb-5">
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">Showing 1 - 1 of 1 entry</p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border border-gray-100 dark:border-white/10 rounded-xs px-2 py-1 bg-white dark:bg-[#1C1C1C]">
                            <span className="text-[12px] font-medium text-gray-600 dark:text-gray-400">Page 1</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                        <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">of 1</span>
                        <div className="flex border border-gray-100 dark:border-white/10 rounded-xs bg-white dark:bg-[#1C1C1C]">
                            <button className="p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 border-r border-gray-100 dark:border-white/10 text-gray-400 transition-colors">
                                <ChevronDown className="rotate-90" size={16} />
                            </button>
                            <button className="p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                <ChevronDown className="-rotate-90" size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- TABLE --- */}
                <div className="overflow-hidden bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-xs">
                    <table className="w-full text-left font-normal">
                        <thead className="border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                            <tr className="text-[8px] text-gray-500 dark:text-gray-400 font-normal">
                                <th className="pl-6 pr-4 py-4 w-12 text-center">
                                    <Checkbox checked={false} onChange={() => { }} />
                                </th>
                                <th className="px-5 py-4">Date & Time</th>
                                <th className="px-5 py-4">Details</th>
                                <th className="px-5 py-4">Category</th>
                                <th className="px-5 py-4">Mode</th>
                                <th className="px-10 py-4 text-center">Bill</th>
                                <th className="px-5 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="text-[14px] hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                    <td className="pl-6 pr-4 py-5 text-center">
                                        <Checkbox checked={false} onChange={() => { }} />
                                    </td>
                                    <td className="px-5 py-5">
                                        <p className="font-semi text-[#111827] dark:text-white/90">Today</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-[11px] font-semibold mt-0.5">{tx.dateTime.split(", ")[1]}</p>
                                    </td>
                                    <td className="px-5 py-5">
                                        <p className="font-bold text-[#111827] dark:text-white/90">{tx.details}</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-[11px] font-semibold mt-1">--</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-[11px] font-semibold">by You</p>
                                    </td>
                                    <td className="px-5 py-5 text-gray-500 dark:text-gray-400 font-bold text-[13px]">{tx.category}</td>
                                    <td className="px-5 py-5 text-gray-500 dark:text-gray-400 font-bold text-[13px]">{tx.mode}</td>
                                    <td className="px-10 py-5 text-center border-none">
                                        {/* Bill placeholder */}
                                    </td>
                                    <td className="px-5 py-5 text-right font-bold text-emerald-600 dark:text-emerald-500 text-base">
                                        {tx.amount}
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-[#111827] dark:text-white/90 text-base">
                                        {tx.balance}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* --- SIDE DRAWER --- */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[99999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-[#374151]/20 backdrop-blur-[1px] transition-all duration-300"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div className="relative w-full max-w-[480px] bg-white dark:bg-[#1C1C1C] h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h2 className={`text-xl font-bold tracking-tight ${drawerType === "in" ? "text-emerald-600" : "text-red-500"}`}>
                                Add {drawerType === "in" ? "Cash In" : "Cash Out"} Entry
                            </h2>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-7 no-scrollbar pb-32">
                            <div className="flex bg-gray-50/50 dark:bg-white/5 p-1.5 rounded-full w-fit">
                                <button
                                    onClick={() => setDrawerType("in")}
                                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${drawerType === "in" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-500"}`}
                                >
                                    Cash In
                                </button>
                                <button
                                    onClick={() => setDrawerType("out")}
                                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${drawerType === "out" ? "bg-red-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-500"}`}
                                >
                                    Cash Out
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                        Date <span className="text-red-500 font-black">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-emerald-600">
                                            <CalendarIcon size={16} />
                                        </div>
                                        <Input
                                            type="text"
                                            value="11 Feb, 2026"
                                            onChange={() => { }}
                                            className="pl-11 rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A] focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-700">Time</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Clock size={16} />
                                        </div>
                                        <Input
                                            type="text"
                                            value="03:54 PM"
                                            onChange={() => { }}
                                            className="pl-11 rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                        Amount <span className="text-red-500 font-black">*</span>
                                    </label>
                                    <Info size={14} className="text-gray-300 cursor-help" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="eg. 890 or 100 + 200*3"
                                    className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A] focus:border-emerald-500 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Contact Name</label>
                                    <Settings size={14} className="text-brand-500 cursor-pointer hover:rotate-45 transition-transform" />
                                </div>
                                <Select
                                    options={[]}
                                    placeholder="Search or Select"
                                    onChange={() => { }}
                                    className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] h-11 bg-white dark:bg-[#2A2A2A] flex items-center"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Remarks</label>
                                <textarea
                                    placeholder="e.g. Enter Details (Name, Bill No, Item Name, Quantity etc)"
                                    className="w-full h-24 p-4 border border-gray-100 dark:border-white/10 rounded-sm text-[13px] bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-brand-500 transition-all font-medium resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-12 gap-5">
                                <div className="col-span-12 lg:col-span-7 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-gray-700">Category</label>
                                        <Settings size={14} className="text-brand-500 cursor-pointer hover:rotate-45 transition-transform" />
                                    </div>
                                    <Select
                                        options={[]}
                                        placeholder="Search or Select"
                                        onChange={() => { }}
                                        className="rounded-sm border-gray-100 text-[13px] h-11 bg-white flex items-center"
                                    />
                                </div>
                                <div className="col-span-12 lg:col-span-5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-gray-700">Payment Mode</label>
                                        <Settings size={14} className="text-brand-500 cursor-pointer hover:rotate-45 transition-transform" />
                                    </div>
                                    <div className="relative">
                                        <Select
                                            options={[{ value: "cash", label: "Cash" }]}
                                            placeholder="Cash"
                                            onChange={() => { }}
                                            className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] h-11 bg-white dark:bg-[#2A2A2A] flex items-center pr-10"
                                        />
                                        <X size={14} className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button className="flex items-center gap-2.5 text-brand-600 text-[13px] font-bold hover:bg-brand-50/50 px-5 py-2.5 rounded-sm border border-brand-100 transition-colors">
                                    <span className="text-lg">🔗</span>
                                    Attach Bills
                                </button>
                                <p className="text-[11px] text-emerald-600 font-bold mt-2.5">Attach up to 4 images or PDF files</p>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 px-8 py-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1C1C1C] grid grid-cols-2 gap-4">
                            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3.5 rounded-sm font-bold shadow-none border-none text-[14px]">
                                Save & Add New
                            </Button>
                            <Button variant="outline" className="hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/10 py-3.5 rounded-sm font-bold shadow-none text-[14px]">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Book;
