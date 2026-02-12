import Label from "@/components/form/Label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Cashbook } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BookCheck,
    ChevronDown,
    Copy,
    Loader2,
    LucideTrash2,
    LucideUsersRound,
    Pencil,
    Plus,
    Search,
    Users,
    UserStarIcon
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Cashbooks component using TanStack Query for state management.
 */
const Cashbooks: React.FC = () => {
    const { activeOrg } = useOrg();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("lastUpdated");

    // Modal States
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingCashbook, setEditingCashbook] = useState<Cashbook | null>(null);

    const [newCashbook, setNewCashbook] = useState({
        name: "",
        description: "",
        currency: "USD",
        allowBackdated: false,
        allowOmitted: false
    });

    // --- TanStack Query: Fetch Cashbooks ---
    const { data: cashbooks = [], isLoading: loadingCashbooks } = useQuery<Cashbook[]>({
        queryKey: ["cashbooks", activeOrg?.id],
        queryFn: async () => {
            const { data } = await apiClient.get("/org-finance/cashbooks");
            return data.data || [];
        },
        enabled: !!activeOrg,
    });

    // --- TanStack Query: Fetch All Accounts (to aggregate balances) ---
    const { data: allAccounts = [], isLoading: loadingAccounts } = useQuery<any[]>({
        queryKey: ["all-cashbook-accounts", activeOrg?.id],
        queryFn: async () => {
            const { data } = await apiClient.get("/org-finance/accounts");
            return data.data || [];
        },
        enabled: !!activeOrg,
    });

    const loading = loadingCashbooks || loadingAccounts;

    // --- TanStack Mutation: Create Cashbook ---
    const createMutation = useMutation({
        mutationFn: async (payload: typeof newCashbook) => {
            await apiClient.post("/org-finance/cashbooks", payload);
        },
        onSuccess: () => {
            toast({ title: "Cashbook created successfully" });
            setCreateOpen(false);
            setNewCashbook({
                name: "",
                description: "",
                currency: "USD",
                allowBackdated: false,
                allowOmitted: false,
            });
            queryClient.invalidateQueries({ queryKey: ["cashbooks", activeOrg?.id] });
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Could not create cashbook",
            });
        },
    });

    // --- TanStack Mutation: Delete Cashbook ---
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/org-finance/cashbooks/${id}`);
        },
        onSuccess: () => {
            toast({ title: "Cashbook deleted successfully" });
            queryClient.invalidateQueries({ queryKey: ["cashbooks", activeOrg?.id] });
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Could not delete cashbook",
            });
        },
    });

    // --- TanStack Mutation: Update Cashbook ---
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
            await apiClient.patch(`/org-finance/cashbooks/${id}`, payload);
        },
        onSuccess: () => {
            toast({ title: "Cashbook updated successfully" });
            setEditOpen(false);
            setEditingCashbook(null);
            queryClient.invalidateQueries({ queryKey: ["cashbooks", activeOrg?.id] });
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Could not update cashbook",
            });
        },
    });

    const handleCreateCashbook = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newCashbook);
    };

    const handleUpdateCashbook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCashbook) return;
        updateMutation.mutate({
            id: editingCashbook.id,
            payload: {
                name: editingCashbook.name,
                description: editingCashbook.description,
                allowBackdated: editingCashbook.allowBackdated,
                allowOmitted: editingCashbook.allowOmitted,
            }
        });
    };

    const handleDeleteCashbook = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!id) return;

        if (window.confirm("Are you sure you want to delete this cashbook? All associated accounts and records will be permanently removed.")) {
            deleteMutation.mutate(id);
        }
    };

    // Aggregate balances per cashbook
    const cashbookBalances = useMemo(() => {
        const balances: Record<string, number> = {};
        allAccounts.forEach((acc: any) => {
            if (!acc.cashbookId) return;
            balances[acc.cashbookId] = (balances[acc.cashbookId] || 0) + Number(acc.balance);
        });
        return balances;
    }, [allAccounts]);

    // Apply filtering and sorting
    const filteredAndSortedCashbooks = useMemo(() => {
        let result = cashbooks.map(cb => ({
            ...cb,
            netBalance: cashbookBalances[cb.id] || 0
        })).filter(cb =>
            cb.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortBy === "name") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "netBalanceHigh") {
            result.sort((a, b) => b.netBalance - a.netBalance);
        } else if (sortBy === "netBalanceLow") {
            result.sort((a, b) => a.netBalance - b.netBalance);
        } else if (sortBy === "lastUpdated") {
            result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else if (sortBy === "lastCreated") {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return result;
    }, [cashbooks, cashbookBalances, searchQuery, sortBy]);

    // Placeholder for quick add options
    const quickAddOptions = [
        "February Expenses",
        "Project Book",
        "Payable Book",
        "Cash Journal",
    ];

    const fmtCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    if (!activeOrg) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                    <Users className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2">Workspace Required</h2>
                <p className="text-muted-foreground max-w-sm">Please select a workspace from the sidebar to access financial records.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#0F0F0F] font-outfit text-[#111827] dark:text-white/90 min-h-screen -mt-10 -mx-8 relative z-0">
            {/* --- HEADER --- */}
            <header className="px-10 py-5 mt-2 flex justify-between items-center border-b border-gray-50 dark:border-white/5 bg-white dark:bg-[#0F0F0F] sticky top-0 z-10">
                <h1 className="text-xl font-semibold dark:text-white">{activeOrg?.name}</h1>
                <button className="flex items-center gap-2.5 px-4 py-2 border border-gray-200 dark:border-white/10 rounded text-brand-500 text-[11px] font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Users size={16} />
                    {activeOrg?.name} Team
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
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-12 py-2.5 border border-gray-100 dark:border-white/10 text-sm bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500 transition-all font-medium"
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
                                    defaultValue={sortBy}
                                    placeholder="Sort By: Last Updated"
                                    onChange={(val) => setSortBy(val)}
                                    className="flex items-center gap-2 h-11 px-4 border border-gray-100 dark:border-white/10 rounded-xs text-[11px] rounded-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#1C1C1C]"
                                />
                            </div>
                        </div>

                        {/* Books List Section */}
                        <div className="mb-10 divide-y divide-gray-50 dark:divide-white/5 border-t border-gray-50 dark:border-white/5">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                                    <p className="text-[10px] font-bold text-gray-400 ">Loading books...</p>
                                </div>
                            ) : filteredAndSortedCashbooks.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-full">
                                        <UserStarIcon className="w-10 h-10 text-gray-200 dark:text-white/5" />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 ">No cashbooks found</p>
                                </div>
                            ) : (
                                filteredAndSortedCashbooks.map((book: any) => (
                                    <div
                                        key={book.id}
                                        onClick={() => navigate(`/cashbooks/${book.id}`)}
                                        className="flex items-center justify-between py-6 px-2 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors rounded-none cursor-pointer -mx-2 group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 bg-brand-50/50 dark:bg-brand-500/10 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-500 transition-transform group-hover:scale-110">
                                                <UserStarIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-[14px] text-[#111827] dark:text-white/90 group-hover:text-brand-500 transition-colors">
                                                    {book.name}
                                                </h3>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                                                    {book.currency} • Last Updated {new Date(book.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <span className={`text-[15px] font-black ${(book.netBalance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-500"}`}>
                                                {book.currency} {fmtCurrency(book.netBalance || 0)}
                                            </span>
                                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCashbook(book);
                                                        setEditOpen(true);
                                                    }}
                                                    className="text-brand-600 dark:text-brand-500 hover:scale-110 transition-transform"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button className="text-brand-600 dark:text-brand-500 hover:scale-110 transition-transform">
                                                    <Copy size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/cashbooks/${book.id}/members`);
                                                    }}
                                                    className="text-brand-600 dark:text-brand-500 hover:scale-110 transition-transform"
                                                >
                                                    <LucideUsersRound size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteCashbook(book.id, e)}
                                                    className="text-red-500 hover:scale-110 transition-transform"
                                                >
                                                    <LucideTrash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Quick Add Card */}
                        <div className="border border-gray-100 dark:border-white/5 rounded-sm p-8 bg-white dark:bg-[#1C1C1C] overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <BookCheck size={100} className="text-brand-400" />
                            </div>
                            <div className="flex items-start gap-5 mb-8 relative z-10">
                                <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-white/5 rounded-full flex items-center justify-center">
                                    <BookCheck className="w-6 h-6 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#111827] dark:text-white/90 ">Add New Book</h3>
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 ">Click to quickly add books for your business</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 relative z-10">
                                {quickAddOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setNewCashbook(prev => ({ ...prev, name: option }));
                                            setCreateOpen(true);
                                        }}
                                        className="px-6 py-2.5 bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-500 text-[11px] font-bold  rounded-full hover:bg-brand-500 hover:text-white transition-all"
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
                            <Button
                                onClick={() => setCreateOpen(true)}
                                className="w-full flex items-center justify-center gap-3 bg-brand-500 text-white text-[12px] rounded hover:bg-brand-600 transition-all"
                            >
                                <Plus size={20} strokeWidth={3} />
                                New Business
                            </Button>

                            {/* Help Card */}
                            <div className="border border-gray-100 dark:border-white/5 rounded p-7 bg-white dark:bg-[#1C1C1C] space-y-4">
                                <h3 className="text-[12px] font-bold text-gray-900 dark:text-white  leading-tight">
                                    Need help in business setup?
                                </h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
                                    Our support team is available 24/7 to help you configure your flow.
                                </p>
                                <button
                                    className="flex items-center gap-2.5 text-brand-600 dark:text-brand-500 text-[10px] font-bold  hover:underline group"
                                >
                                    Contact Support
                                    <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            {/* Stats Card */}
                            <div className="p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-none">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-gray-400 ">Total Business Books</span>
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">{cashbooks.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Cashbook Modal - Styled for Flat Design */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                className="sm:max-w-[500px] rounded-none bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 p-0 overflow-hidden"
                showCloseButton={true}
            >
                <div className="p-8 border-b border-gray-50 dark:border-white/5">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white ">Create New Cashbook</h2>
                    <p className="text-[10px] font-bold text-gray-400  mt-1">Create a new cashbook for your business.</p>
                </div>

                <form onSubmit={handleCreateCashbook} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black  text-[#111827] dark:text-gray-400">Business Book Name</Label>
                        <input
                            value={newCashbook.name}
                            onChange={(e) => setNewCashbook(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Business Book, Petty Cash..."
                            required
                            className="w-full h-11 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-none px-4 text-[11px] font-bold  focus:outline-none focus:border-brand-500 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black  text-[#111827] dark:text-gray-400">Currency</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" className="w-full h-11 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-none px-4 text-[10px] font-bold  flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                        {newCashbook.currency} - {
                                            newCashbook.currency === 'USD' ? 'US Dollar' :
                                                newCashbook.currency === 'EUR' ? 'Euro' :
                                                    newCashbook.currency === 'GBP' ? 'British Pound' :
                                                        'Local Currency'
                                        }
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[300px] rounded-none border-gray-100 dark:border-white/5 bg-white dark:bg-[#1C1C1C] p-0 shadow-2xl">
                                    {["USD", "EUR", "GBP", "KES", "UGX"].map(curr => (
                                        <DropdownMenuItem
                                            key={curr}
                                            onClick={() => setNewCashbook(prev => ({ ...prev, currency: curr }))}
                                            className="font-bold text-[10px]  p-4 cursor-pointer hover:bg-brand-500 hover:text-white rounded-none border-b border-gray-50 dark:border-white/5 last:border-none"
                                        >
                                            {curr}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setNewCashbook(p => ({ ...p, allowBackdated: !p.allowBackdated }))}
                            className={cn(
                                "flex items-center justify-between p-4 border rounded-none transition-all",
                                newCashbook.allowBackdated
                                    ? "bg-brand-500/5 border-brand-500/50 text-brand-500"
                                    : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 text-gray-400"
                            )}
                        >
                            <span className="text-[9px] font-bold ">Backdating</span>
                            {newCashbook.allowBackdated ? <Plus size={14} className="rotate-45" /> : <Plus size={14} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setNewCashbook(p => ({ ...p, allowOmitted: !p.allowOmitted }))}
                            className={cn(
                                "flex items-center justify-between p-4 border rounded-none transition-all",
                                newCashbook.allowOmitted
                                    ? "bg-brand-500/5 border-brand-500/50 text-brand-500"
                                    : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 text-gray-400"
                            )}
                        >
                            <span className="text-[9px] font-bold ">Omission</span>
                            {newCashbook.allowOmitted ? <Plus size={14} className="rotate-45" /> : <Plus size={14} />}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black  text-[#111827] dark:text-gray-400"> Description</Label>
                        <Textarea
                            value={newCashbook.description}
                            onChange={(e) => setNewCashbook(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Elaborate on the purpose..."
                            className="min-h-[100px] bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10  p-4 text-[11px] font-bold  resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            className="flex-1 h-11 text-[10px] font-bold  text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 h-11 rounded-none text-[10px] font-bold "
                        >
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initialize"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Cashbook Modal */}
            <Modal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                className="sm:max-w-[500px] rounded-none bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 p-0 overflow-hidden"
                showCloseButton={true}
            >
                <div className="p-8 border-b border-gray-50 dark:border-white/5">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white ">Update Cashbook</h2>
                    <p className="text-[10px] font-bold text-gray-400  mt-1">Modify settings for {editingCashbook?.name}.</p>
                </div>

                <form onSubmit={handleUpdateCashbook} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black  text-[#111827] dark:text-gray-400">Business Book Name</Label>
                        <input
                            value={editingCashbook?.name || ""}
                            onChange={(e) => setEditingCashbook(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                            placeholder="Business Book Name"
                            required
                            className="w-full h-11 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-none px-4 text-[11px] font-bold  focus:outline-none focus:border-brand-500 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setEditingCashbook(p => p ? ({ ...p, allowBackdated: !p.allowBackdated }) : null)}
                            className={cn(
                                "flex items-center justify-between p-4 border rounded-none transition-all",
                                editingCashbook?.allowBackdated
                                    ? "bg-brand-500/5 border-brand-500/50 text-brand-500"
                                    : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 text-gray-400"
                            )}
                        >
                            <span className="text-[9px] font-bold ">Backdating</span>
                            {editingCashbook?.allowBackdated ? <Plus size={14} className="rotate-45" /> : <Plus size={14} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setEditingCashbook(p => p ? ({ ...p, allowOmitted: !p.allowOmitted }) : null)}
                            className={cn(
                                "flex items-center justify-between p-4 border rounded-none transition-all",
                                editingCashbook?.allowOmitted
                                    ? "bg-brand-500/5 border-brand-500/50 text-brand-500"
                                    : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 text-gray-400"
                            )}
                        >
                            <span className="text-[9px] font-bold ">Omission</span>
                            {editingCashbook?.allowOmitted ? <Plus size={14} className="rotate-45" /> : <Plus size={14} />}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black  text-[#111827] dark:text-gray-400"> Description</Label>
                        <Textarea
                            value={editingCashbook?.description || ""}
                            onChange={(e) => setEditingCashbook(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                            placeholder="Elaborate on the purpose..."
                            className="min-h-[100px] bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10  p-4 text-[11px] font-bold  resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setEditOpen(false)}
                            className="flex-1 h-11 text-[10px] font-bold  text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex-1 h-11 rounded-none text-[10px] font-bold "
                        >
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Cashbooks;
