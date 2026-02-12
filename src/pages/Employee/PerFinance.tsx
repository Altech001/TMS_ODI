import {
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Loader2,
    PieChart,
    Plus,
    RefreshCw,
    Target,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    X
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";
import {
    PersonalAccount,
    PersonalCategory,
    PersonalFinanceAPI,
    PersonalTransaction
} from "../../services/api";

const StatusBadge = ({ type }: { type: "INCOME" | "EXPENSE" }) => {
    const styles = {
        INCOME: "bg-green-500/10 text-green-500 border-green-500/20",
        EXPENSE: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${styles[type]}`}>
            {type}
        </span>
    );
};

const FinanceCard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
    <div className="bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-white/5 p-6 rounded-none relative overflow-hidden group">
        <div className="flex justify-between items-start">
            <div className="z-10">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">{title}</p>
                <h3 className={`text-3xl  ${colorClass} tracking-tighter mb-1`}>
                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <div className="flex items-center gap-1.5 mt-2">
                    {trend && (
                        <div className={`flex items-center gap-0.5 text-[10px]  uppercase ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                    <span className="text-[10px] text-gray-500 font-semibold tracking-wider">{subtext}</span>
                </div>
            </div>
            <div className={`p-3 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-[0.02] dark:opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Icon className="w-32 h-32" />
        </div>
    </div>
);

export default function PersonalFinance() {
    const [accounts, setAccounts] = useState<PersonalAccount[]>([]);
    const [categories, setCategories] = useState<PersonalCategory[]>([]);
    const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"accounts" | "transactions" | "categories">("accounts");

    // Modal states
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [accountName, setAccountName] = useState("");
    const [accountType, setAccountType] = useState("BANK");
    const [accountBalance, setAccountBalance] = useState("");

    const [transAmount, setTransAmount] = useState("");
    const [transType, setTransType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [transDesc, setTransDesc] = useState("");
    const [transAccount, setTransAccount] = useState("");
    const [transCategory, setTransCategory] = useState("");

    const [catName, setCatName] = useState("");
    const [catType, setCatType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [catColor, setCatColor] = useState("#3B82F6");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [accRes, catRes, transRes] = await Promise.all([
                PersonalFinanceAPI.getAccounts(),
                PersonalFinanceAPI.getCategories(),
                PersonalFinanceAPI.getTransactions({ limit: 50 })
            ]);

            if (accRes.success) setAccounts(accRes.data);
            if (catRes.success) setCategories(catRes.data);
            if (transRes.success) setTransactions(transRes.data);
        } catch (err) {
            console.error("Failed to fetch finance data:", err);
            setError("Connectivity issue. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountName.trim() || !accountBalance) return;

        try {
            setIsSubmitting(true);
            const response = await PersonalFinanceAPI.createAccount({
                name: accountName.trim(),
                type: accountType,
                initialBalance: parseFloat(accountBalance),
                currency: "USD"
            });

            if (response.success) {
                setAccounts(prev => [...prev, response.data]);
                setShowAccountModal(false);
                setAccountName("");
                setAccountBalance("");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create account");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transAmount || !transAccount || !transCategory) return;

        try {
            setIsSubmitting(true);
            const response = await PersonalFinanceAPI.createTransaction({
                accountId: transAccount,
                categoryId: transCategory,
                amount: parseFloat(transAmount),
                type: transType,
                note: transDesc.trim(),
                transactionAt: new Date().toISOString()
            });

            if (response.success) {
                fetchData();
                setShowTransactionModal(false);
                setTransAmount("");
                setTransDesc("");
                setTransAccount("");
                setTransCategory("");
            }
        } catch (err: any) {
            setError(err.message || "Failed to record transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName.trim()) return;

        try {
            setIsSubmitting(true);
            const response = await PersonalFinanceAPI.createCategory({
                name: catName.trim(),
                type: catType,
                color: catColor
            });

            if (response.success) {
                setCategories(prev => [...prev, response.data]);
                setShowCategoryModal(false);
                setCatName("");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm("Delete this account? This action cannot be undone.")) return;
        try {
            const res = await PersonalFinanceAPI.deleteAccount(id);
            if (res.success) {
                setAccounts(prev => prev.filter(a => a.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);

    return (
        <div className="min-h-screen p-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-2xl  text-gray-900  dark:text-white tracking-tighter mb-2">Personal Finance</h1>
                    <p className="text-[11px] font-medium text-gray-500">Wealth management & expense tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white px-5 py-2.5 rounded text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <Target className="w-4 h-4" /> New Category
                    </button>
                    <button
                        onClick={() => setShowAccountModal(true)}
                        className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white px-5 py-2.5 rounded text-[11px]  uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <CreditCard className="w-4 h-4" /> New Account
                    </button>
                    <button
                        onClick={() => setShowTransactionModal(true)}
                        className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded text-[11px]  uppercase tracking-wider transition-all flex items-center gap-2  "
                    >
                        <Plus className="w-4 h-4" /> Record Transaction
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <FinanceCard
                    title="Total Net Worth"
                    value={totalBalance}
                    subtext="Combined account balances"
                    icon={Wallet}
                    colorClass="text-brand-500"
                    trend={8.4}
                />
                <FinanceCard
                    title="Monthly Income"
                    value={totalIncome}
                    subtext="Total deposits recorded"
                    icon={ArrowUpRight}
                    colorClass="text-green-500"
                />
                <FinanceCard
                    title="Monthly Expenses"
                    value={totalExpenses}
                    subtext="Total spending recorded"
                    icon={TrendingDown}
                    colorClass="text-red-500"
                />
            </div>

            {/* Tabs System */}
            <div className="mb-8">
                <div className="flex border-b border-gray-200 dark:border-white/5">
                    {[
                        { id: "accounts", label: "Accounts", icon: Wallet },
                        { id: "transactions", label: "Transactions", icon: RefreshCw },
                        { id: "categories", label: "Categories", icon: Target }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-8 py-4 text-[11px]  uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                ? "text-brand-500"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 animate-in fade-in slide-in-from-bottom-1" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 gap-6">
                {activeTab === "accounts" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {isLoading ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] border border-dashed border-white/10 rounded-none">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-4" />
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loading Accounts...</p>
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] border border-dashed border-white/10 rounded-none">
                                <PieChart className="w-12 h-12 text-gray-200 dark:text-white/5 mb-4" />
                                <p className="text-gray-500 font-medium">No accounts linked yet.</p>
                                <button onClick={() => setShowAccountModal(true)} className="mt-4 text-brand-500 font-bold text-[11px] hover:underline">Connect Now</button>
                            </div>
                        ) : (
                            accounts.map(account => (
                                <div key={account.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 p-6 rounded-2xl group relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-sm  text-gray-900 dark:text-white uppercase tracking-tight">{account.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-tighter">{account.type}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAccount(account.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <p className="text-2xl  text-brand-500 tracking-tighter">${Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        <div className="w-10 h-10 rounded-full bg-brand-500/5 flex items-center justify-center">
                                            <Wallet className="w-4 h-4 text-brand-500" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "transactions" && (
                    <div className="bg-white dark:bg-[#1C1C1C]  border-gray-200 dark:border-white/5 rounded-none overflow-hidden animate-in fade-in duration-300">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px]  text-gray-500 uppercase tracking-widest">Transaction</th>
                                    <th className="px-6 py-4 text-[10px]  text-gray-500 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px]  text-gray-500 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px]  text-gray-500 uppercase tracking-widest text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center italic text-gray-500">No activity recorded for this period.</td>
                                    </tr>
                                ) : (
                                    transactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded border ${t.type === 'INCOME' ? 'bg-green-500/5 border-green-500/10 text-green-500' : 'bg-red-500/5 border-red-500/10 text-red-500'}`}>
                                                        {t.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t.note || "Unspecified Record"}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{t.account?.name || "Cash / General"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                                    <span className="text-[10px]  text-gray-900 dark:text-white uppercase tracking-wider">{t.category?.name || "General"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <p className={`text-sm  tracking-tight ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {t.type === 'INCOME' ? '+' : '-'}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date(t.transactionAt).toLocaleDateString()}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "categories" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 p-6 rounded-2xl group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded" style={{ backgroundColor: cat.color ? `${cat.color}10` : '#3B82F610', color: cat.color || '#3B82F6' }}>
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <StatusBadge type={cat.type as any} />
                                </div>
                                <h4 className="text-sm  text-gray-900 dark:text-white uppercase tracking-widest">{cat.name}</h4>
                                {cat.budget && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                                            <span className="text-gray-500 tracking-widest">Monthly Budget</span>
                                            <span className="text-brand-500">${cat.budget}</span>
                                        </div>
                                        <div className="w-full h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-500 w-[65%]" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Account Modal */}
            <Modal
                isOpen={showAccountModal}
                onClose={() => setShowAccountModal(false)}
                className="max-w-md"
            >
                <div className="bg-white dark:bg-[#0F0F0F] rounded-2xl">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg  text-gray-900 dark:text-white uppercase tracking-tight">Create Account</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Connect a new financial pool</p>
                        </div>
                        <button onClick={() => setShowAccountModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateAccount} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Name</label>
                            <input
                                type="text"
                                required
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                placeholder="e.g. Primary Savings"
                                className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded py-3 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:font-normal"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</label>
                                <Select
                                    options={[
                                        { value: "BANK", label: "Bank Account" },
                                        { value: "SAVINGS", label: "Savings" },
                                        { value: "INVESTMENT", label: "Investment" },
                                        { value: "CREDIT_CARD", label: "Credit Card" },
                                        { value: "CASH", label: "Cash" },
                                        { value: "MOBILE_MONEY", label: "Mobile Money" },
                                        { value: "OTHER", label: "Other" }
                                    ]}
                                    defaultValue={accountType}
                                    placeholder="Select type"
                                    onChange={val => setAccountType(val)}
                                    className="h-[46px] bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-none text-sm font-bold uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Initial Balance</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <input
                                        type="number"
                                        required
                                        value={accountBalance}
                                        onChange={(e) => setAccountBalance(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded py-3 pl-8 pr-4 text-sm text-gray-900 dark:text-white "
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowAccountModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white text-[10px]  uppercase tracking-widest rounded transition-all">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-brand-500 text-white text-[10px]  uppercase tracking-widest rounded transition-all   disabled:opacity-50">
                                {isSubmitting ? "Linking..." : "Create Account"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Create Transaction Modal */}
            <Modal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                className="max-w-md"
            >
                <div className="bg-white dark:bg-[#0F0F0F] rounded-2xl">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg  text-gray-900 dark:text-white uppercase tracking-tight">Record Transaction</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Manual activity override</p>
                        </div>
                        <button onClick={() => setShowTransactionModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateTransaction} className="p-8 space-y-5">
                        <div className="flex gap-2">
                            {(["EXPENSE", "INCOME"] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setTransType(type)}
                                    className={`flex-1 py-2.5 rounded text-[10px]  uppercase tracking-[0.2em] border transition-all ${transType === type
                                        ? type === 'INCOME' ? "bg-green-500 border-green-500 text-white  " : "bg-red-500 border-red-500 text-white  "
                                        : "bg-transparent border-gray-200 dark:border-white/10 text-gray-400 hover:bg-white/5"
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account</label>
                                <Select
                                    options={accounts.map(a => ({ value: a.id, label: a.name }))}
                                    defaultValue={transAccount}
                                    placeholder="Select account"
                                    onChange={val => setTransAccount(val)}
                                    className="h-[46px] bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-none text-sm font-bold uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
                                <Select
                                    options={categories.filter(c => c.type === transType).map(c => ({ value: c.id, label: c.name }))}
                                    defaultValue={transCategory}
                                    placeholder="Select category"
                                    onChange={val => setTransCategory(val)}
                                    className="h-[46px] bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-none text-sm font-bold uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="number"
                                    required
                                    value={transAmount}
                                    onChange={(e) => setTransAmount(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white "
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</label>
                            <input
                                type="text"
                                required
                                value={transDesc}
                                onChange={(e) => setTransDesc(e.target.value)}
                                placeholder="e.g. Monthly Rent"
                                className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded py-3 px-4 text-sm text-gray-900 dark:text-white font-bold"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowTransactionModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white text-[10px]  uppercase tracking-widest rounded transition-all">Dismiss</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-brand-500 text-white text-[10px]  uppercase tracking-widest rounded transition-all  ">
                                {isSubmitting ? "Saving..." : "Record Entry"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
            {/* Create Category Modal */}
            <Modal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                className="max-w-md"
            >
                <div className="bg-white dark:bg-[#0F0F0F] rounded-2xl">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg text-gray-900 dark:text-white uppercase tracking-tight">Create Category</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Organize your spending & income</p>
                        </div>
                        <button onClick={() => setShowCategoryModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateCategory} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category Name</label>
                            <input
                                type="text"
                                required
                                value={catName}
                                onChange={(e) => setCatName(e.target.value)}
                                placeholder="e.g. Groceries"
                                className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded py-3 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:font-normal"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</label>
                            <div className="flex gap-2">
                                {(["EXPENSE", "INCOME"] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setCatType(type)}
                                        className={`flex-1 py-2.5 rounded text-[10px] uppercase tracking-[0.2em] border transition-all ${catType === type
                                            ? type === 'INCOME' ? "bg-green-500 border-green-500 text-white" : "bg-red-500 border-red-500 text-white"
                                            : "bg-transparent border-gray-200 dark:border-white/10 text-gray-400 hover:bg-white/5"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Color Theme</label>
                            <div className="flex flex-wrap gap-3">
                                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCatColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${catColor === c ? "border-white scale-125 shadow-lg shadow-white/10" : "border-transparent opacity-60 hover:opacity-100"}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={catColor}
                                    onChange={(e) => setCatColor(e.target.value)}
                                    className="w-8 h-8 rounded-full bg-transparent border-none p-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white text-[10px] uppercase tracking-widest rounded transition-all">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-brand-500 text-white text-[10px] uppercase tracking-widest rounded transition-all disabled:opacity-50">
                                {isSubmitting ? "Creating..." : "Save Category"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
