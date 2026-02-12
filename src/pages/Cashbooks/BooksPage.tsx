import {
    Copy,
    LucideTrash2,
    LucideUsersRound,
    Pencil,
    Plus,
    Search,
    Users,
    UserStarIcon
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

/**
 * BooksPage component for managing cashbooks.
 * Highly accurate flat design based on provided images.
 */

const BooksPage: React.FC = () => {
    const navigate = useNavigate();
    const books = [
        {
            id: 1,
            name: "Business Book",
            members: 2,
            updatedAt: "Updated about 14 hours ago",
            value: "1,000",
            valueColor: "text-emerald-500",
        },
        {
            id: 2,
            name: "Tresa",
            members: 2,
            updatedAt: "Updated about 15 hours ago",
            value: "0",
            valueColor: "text-emerald-500",
        },
        {
            id: 3,
            name: "Tresa",
            members: 4,
            updatedAt: "Updated about 15 hours ago",
            value: "-30,000,000",
            valueColor: "text-red-500",
        },
    ];

    const quickAddOptions = [
        "February Expenses",
        "Project Book",
        "Payable Book",
        "Cash Journal",
    ];

    return (
        <div className="bg-white dark:bg-[#0F0F0F] font-outfit text-[#111827] dark:text-white/90 min-h-screen">
            {/* --- HEADER --- */}
            <header className="px-10 py-5 flex justify-between items-center border-b border-gray-50 dark:border-white/5">
                <h1 className="text-xl font-bold dark:text-white">Tresa</h1>
                <button className="flex items-center gap-2.5 px-4 py-2 border border-gray-200 dark:border-white/10 rounded text-brand-500 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Users size={18} />
                    Business Team
                </button>
            </header>

            <main className="max-w-[1400px] mx-auto px-10 py-10">
                <div className="grid grid-cols-12 gap-10">

                    {/* --- LEFT COLUMN (9/12) --- */}
                    <div className="col-span-12 lg:col-span-9">

                        {/* Search and Sort Row */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative w-[450px]">
                                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Search size={18} />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Search by book name..."
                                    className="w-full pl-11 pr-12 py-2.5 border border-gray-100 dark:border-white/10 rounded-xs shadow-none text-sm bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500 transition-all font-medium"
                                />
                                <div className="absolute inset-y-0 right-3.5 flex items-center">
                                    <span className="text-[11px] text-gray-300 dark:text-gray-500 border border-gray-100 dark:border-white/10 px-2 rounded-xs font-mono bg-gray-50 dark:bg-white/5">
                                        /
                                    </span>
                                </div>
                            </div>

                            <div className="relative">
                                <Select
                                    options={[
                                        { value: "lastUpdated", label: "Last Updated" },
                                        { value: "name", label: "Name (A to Z)" },
                                        { value: "netBalanceHigh", label: "Net Balance (High to Low)" },
                                        { value: "netBalanceLow", label: "Net Balance (Low to High)" },
                                        { value: "lastCreated", label: "Last Created" },
                                    ]}
                                    placeholder="Sort By: Name (A to Z)"
                                    onChange={(label) => console.log(label)}
                                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 dark:border-white/10 rounded-xs text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#1C1C1C]"
                                />
                            </div>
                        </div>

                        {/* Books List Section */}
                        <div className="mb-10 divide-y divide-gray-50 dark:divide-white/5 border-t border-gray-50 dark:border-white/5">
                            {books.map((book) => (
                                <div
                                    key={book.id}
                                    onClick={() => navigate(`/cashbooks/${book.id}`)}
                                    className="flex items-center justify-between py-6 px-2 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors rounded-none cursor-pointer -mx-2"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 bg-brand-50/50 dark:bg-brand-500/10 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-500">
                                            <UserStarIcon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] font-medium text-[#111827] dark:text-white/90">
                                                {book.name}
                                            </h3>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                {book.members} members • {book.updatedAt}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <span className={`text-[15px] font-bold ${book.valueColor}`}>
                                            {book.value}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <button className="text-brand-600 dark:text-brand-500 hover:opacity-75 transition-opacity">
                                                <Pencil size={18} />
                                            </button>
                                            <button className="text-brand-600 dark:text-brand-500 hover:opacity-75 transition-opacity">
                                                <Copy size={18} />
                                            </button>
                                            <button className="text-brand-600 dark:text-brand-500 hover:opacity-75 transition-opacity">
                                                <LucideUsersRound size={18} />
                                            </button>
                                            <button className="text-[#EF4444] hover:opacity-75 transition-opacity">
                                                <LucideTrash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Add Card */}
                        <div className="border border-gray-100 dark:border-white/5 rounded-md p-8 bg-white dark:bg-[#1C1C1C] overflow-hidden">
                            <div className="flex items-start gap-5 mb-8">
                                <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-white/5 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 bg-white dark:bg-[#1C1C1C] border-2 border-brand-500 rounded-md flex flex-col gap-0.5 p-0.5 shadow-inner">
                                        <div className="h-0.5 bg-brand-500 w-full rounded-full"></div>
                                        <div className="h-0.5 bg-brand-500 w-full rounded-full"></div>
                                        <div className="h-0.5 bg-brand-500 w-3/4 rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-[#111827] dark:text-white/90">Add New Book</h3>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-normal">Click to quickly add books for</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {quickAddOptions.map((option) => (
                                    <button
                                        key={option}
                                        className="px-6 py-2 bg-[#F0F2FF] dark:bg-brand-500/10 border border-brand-300 dark:border-brand-500/20 text-brand-600 dark:text-brand-500 text-[13px] font-medium rounded-full hover:bg-[#E0E7FF] dark:hover:bg-brand-500/20 transition-all"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN (3/12) --- */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="flex flex-col gap-6">

                            {/* Primary Add Button */}
                            <Button className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#4F46E5] text-white text-[15px] font-semibold rounded-sm hover:bg-[#4338CA] transition-all">
                                <Plus size={20} strokeWidth={3} className="text-xs" />
                                Add New Book
                            </Button>

                            {/* Help Card */}
                            <div className="border border-gray-100 dark:border-white/5 rounded-md p-7 bg-white dark:bg-[#1C1C1C]">
                                <h3 className="text-[14px] font-semibold text-gray-800 dark:text-gray-200 mb-2 leading-tight">
                                    Need help in business setup?
                                </h3>
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-8 leading-tight font-medium">
                                    Our support team will help you
                                </p>
                                <a
                                    href="#"
                                    className="flex items-center gap-2.5 text-brand-600 dark:text-brand-500 text-[12px] font-semibold hover:underline"
                                >
                                    Contact Us

                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BooksPage;
