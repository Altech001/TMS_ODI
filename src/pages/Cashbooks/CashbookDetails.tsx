import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import type { Cashbook, CashbookAccount, CashbookEntry, Contact } from "@/types";
import { format } from "date-fns";
import {
    ArrowLeft,
    ArrowRightLeft,
    Building2,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    CloudUpload,
    Download,
    Eye,
    FileText,
    Info,
    Loader2,
    Minus,
    MoreHorizontal,
    Paperclip,
    Plus,
    RefreshCw,
    Search,
    Settings,
    Trash2,
    UserPlus,
    Users,
    LucideUsersRound,
    Wallet,
    X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DatePicker from "@/components/form/date-picker";

const ITEMS_PER_PAGE = 15;

const ACCOUNT_TYPES = [
    { value: "CASH", label: "Cash" },
    { value: "BANK", label: "Bank" },
    { value: "MOBILE_MONEY", label: "Mobile Money" },
    { value: "PETTY_CASH", label: "Petty Cash" },
    { value: "SAVINGS", label: "Savings" },
    { value: "OTHER", label: "Other" },
];

const CONTACT_TYPES = [
    { value: "CUSTOMER", label: "Customer" },
    { value: "SUPPLIER", label: "Supplier" },
    { value: "EMPLOYEE", label: "Employee" },
    { value: "OTHER", label: "Other" },
];

const CashbookDetails: React.FC = () => {
    const { id: cashbookId } = useParams<{ id: string }>();
    const { activeOrg } = useOrg();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerType, setDrawerType] = useState<"in" | "out">("in");

    // Entry form state
    const [newEntry, setNewEntry] = useState({
        accountId: "",
        amount: "",
        description: "",
        reference: "",
        transactionDate: format(new Date(), "yyyy-MM-dd"),
        contactId: "none",
        attachments: [] as any[],
    });

    // Account creation state
    const [createAccountOpen, setCreateAccountOpen] = useState(false);
    const [newAccount, setNewAccount] = useState({
        name: "",
        type: "CASH" as string,
        description: "",
        currency: "USD",
    });

    // Contact creation state
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [newContact, setNewContact] = useState({
        name: "",
        type: "CUSTOMER" as string,
        email: "",
        phone: "",
    });

    // Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Selected entries for bulk actions
    const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

    // --- TanStack Query: Fetch Cashbook Details ---
    const { data: cashbook, isLoading: loadingCashbook } = useQuery<Cashbook | null>({
        queryKey: ["cashbook", cashbookId, activeOrg?.id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/org-finance/cashbooks/${cashbookId}`);
            return data.data;
        },
        enabled: !!activeOrg && !!cashbookId,
    });

    // --- TanStack Query: Fetch Accounts ---
    const { data: accounts = [] } = useQuery<CashbookAccount[]>({
        queryKey: ["cashbook-accounts", cashbookId, activeOrg?.id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/org-finance/accounts?cashbookId=${cashbookId}`);
            return data.data || [];
        },
        enabled: !!activeOrg && !!cashbookId,
    });

    // --- TanStack Query: Fetch Entries ---
    const { data: entries = [], isLoading: loadingEntries } = useQuery<CashbookEntry[]>({
        queryKey: ["cashbook-entries", cashbookId, activeOrg?.id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/org-finance/entries?cashbookId=${cashbookId}&limit=100`);
            return data.data || [];
        },
        enabled: !!activeOrg && !!cashbookId,
    });

    // --- TanStack Query: Fetch Contacts ---
    const { data: contacts = [] } = useQuery<Contact[]>({
        queryKey: ["cashbook-contacts", activeOrg?.id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/org-finance/contacts`);
            return data.data || [];
        },
        enabled: !!activeOrg,
    });

    const loading = loadingCashbook || loadingEntries;

    // --- Computed Stats ---
    const stats = useMemo(() => {
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        const inflow = entries
            .filter((e) => e.type === "INFLOW")
            .reduce((s, e) => s + Number(e.amount), 0);
        const outflow = entries
            .filter((e) => e.type === "OUTFLOW")
            .reduce((s, e) => s + Number(e.amount), 0);
        return { inflow, outflow, balance: totalBalance };
    }, [accounts, entries]);

    // Sync currency when cashbook loads
    useEffect(() => {
        if (cashbook) setNewAccount((prev) => ({ ...prev, currency: cashbook.currency }));
    }, [cashbook]);

    // --- Filtered & Paginated Entries ---
    const filteredEntries = useMemo(() => {
        if (!searchQuery.trim()) return entries;
        const q = searchQuery.toLowerCase();
        return entries.filter(
            (e) =>
                e.description?.toLowerCase().includes(q) ||
                e.reference?.toLowerCase().includes(q) ||
                String(e.amount).includes(q)
        );
    }, [entries, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEntries, currentPage]);

    const showingFrom = filteredEntries.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, filteredEntries.length);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // --- Handlers ---
    // Helper to invalidate all cashbook-related queries
    const invalidateCashbookQueries = () => {
        queryClient.invalidateQueries({ queryKey: ["cashbook", cashbookId] });
        queryClient.invalidateQueries({ queryKey: ["cashbook-accounts", cashbookId] });
        queryClient.invalidateQueries({ queryKey: ["cashbook-entries", cashbookId] });
        queryClient.invalidateQueries({ queryKey: ["cashbook-contacts"] });
    };

    const openDrawer = (type: "in" | "out") => {
        setDrawerType(type);
        setNewEntry({
            accountId: accounts[0]?.id || "",
            amount: "",
            description: "",
            reference: "",
            transactionDate: format(new Date(), "yyyy-MM-dd"),
            contactId: "none",
            attachments: [],
        });
        setIsDrawerOpen(true);
    };

    // --- TanStack Mutation: Create Entry ---
    const createEntryMutation = useMutation({
        mutationFn: async (payload: any) => {
            await apiClient.post("/org-finance/entries", payload);
        },
        onSuccess: () => {
            toast({
                title: `${drawerType === "in" ? "Cash In" : "Cash Out"} entry recorded`,
                description: "Transaction saved successfully.",
            });
            setIsDrawerOpen(false);
            invalidateCashbookQueries();
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Entry Failed",
                description: err.response?.data?.message || "Could not save the entry.",
            });
        },
    });

    const handleCreateEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...newEntry,
            type: drawerType === "in" ? "INFLOW" : "OUTFLOW",
            amount: Number(newEntry.amount),
            contactId: newEntry.contactId === "none" ? null : newEntry.contactId,
        };
        createEntryMutation.mutate(payload);
    };

    // --- TanStack Mutation: Create Account ---
    const createAccountMutation = useMutation({
        mutationFn: async (payload: any) => {
            await apiClient.post("/org-finance/accounts", payload);
        },
        onSuccess: () => {
            toast({ title: "Account created successfully" });
            setCreateAccountOpen(false);
            setNewAccount({ name: "", type: "CASH", description: "", currency: cashbook?.currency || "USD" });
            invalidateCashbookQueries();
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Could not create account.",
            });
        },
    });

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cashbookId) return;
        createAccountMutation.mutate({ ...newAccount, cashbookId });
    };

    // --- TanStack Mutation: Create Contact ---
    const createContactMutation = useMutation({
        mutationFn: async (payload: any) => {
            await apiClient.post("/org-finance/contacts", payload);
        },
        onSuccess: () => {
            toast({ title: "Contact created successfully" });
            setShowAddContactModal(false);
            setNewContact({ name: "", type: "CUSTOMER", email: "", phone: "" });
            invalidateCashbookQueries();
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Could not create contact.",
            });
        },
    });

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        createContactMutation.mutate(newContact);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const { data } = await apiClient.post("/org-finance/uploads", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setNewEntry((prev) => ({ ...prev, attachments: [...prev.attachments, data.data] }));
            toast({ title: "File attached successfully" });
        } catch {
            toast({ variant: "destructive", title: "Upload failed", description: "Could not upload file." });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeAttachment = (index: number) => {
        setNewEntry((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
    };

    const toggleEntrySelection = (id: string) => {
        setSelectedEntries((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAllOnPage = () => {
        const allOnPage = paginatedEntries.map((e) => e.id);
        const allSelected = allOnPage.every((id) => selectedEntries.has(id));
        setSelectedEntries((prev) => {
            const next = new Set(prev);
            allOnPage.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const fmtCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    // --- Loading State ---
    if (loading && !cashbook) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white dark:bg-[#0F0F0F] min-h-screen">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-t-2 border-brand-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-brand-500" />
                    </div>
                </div>
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 animate-pulse">Loading cashbook...</p>
            </div>
        );
    }

    if (!cashbook) return null;

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
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{cashbook.name}</h1>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                            {cashbook.description || "Cashbook"} · {cashbook.currency}
                        </p>
                    </div>
                    <div className="flex items-center gap-3.5 ml-4">
                        <button
                            className="text-brand-500 hover:text-brand-600 transition-colors"
                            onClick={() => navigate(`/cashbooks/${cashbookId}/members`)}
                            title="Manage Members"
                        >
                            <LucideUsersRound size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => invalidateCashbookQueries()}
                        className="flex items-center gap-2 text-brand-500 text-[13px] font-bold hover:opacity-80 transition-opacity"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 text-brand-500 text-[13px] font-bold hover:opacity-80 transition-opacity">
                        <CloudUpload size={18} />
                        Bulk Import
                    </button>
                    <button className="flex items-center gap-2 bg-white dark:bg-white/5 px-5 py-2 rounded-xs text-brand-500 text-[13px] font-bold border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                        <Download size={16} />
                        Reports
                    </button>
                </div>
            </header>

            <main className={`px-6 py-6 transition-opacity duration-300 ${isDrawerOpen ? "opacity-40 pointer-events-none" : ""}`}>
                {/* --- ACCOUNTS ROW --- */}
                {accounts.length > 0 && (
                    <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
                        {accounts.map((acc) => (
                            <div
                                key={acc.id}
                                className="flex items-center gap-3 px-4 py-3 border border-gray-100 dark:border-white/10 rounded-xs bg-white dark:bg-[#1C1C1C] min-w-[200px] hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-500 flex items-center justify-center">
                                    <Building2 size={14} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{acc.name}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                                        {fmtCurrency(acc.balance)} <span className="text-[10px] text-gray-400 font-medium">{acc.currency}</span>
                                    </p>
                                </div>
                                <Badge variant="outline" color="light" size="sm" className="ml-auto text-[8px]">{acc.type.replace("_", " ")}</Badge>
                            </div>
                        ))}
                        <button
                            onClick={() => setCreateAccountOpen(true)}
                            className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-200 dark:border-white/10 rounded-xs text-brand-500 text-[12px] font-bold hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-colors min-w-[140px] justify-center"
                        >
                            <Plus size={14} /> Add Account
                        </button>
                    </div>
                )}

                {/* --- SEARCH & ACTIONS --- */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="relative flex-1 max-w-[450px]">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search by description or amount..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-100 dark:border-white/10 rounded-xs shadow-none text-[13px] font-medium bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-500">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button onClick={() => openDrawer("in")} className="flex items-center gap-2.5 bg-green-800 hover:bg-green-900 px-8 rounded-sm transition-all transform">
                            <Plus size={18} strokeWidth={3} />
                            Cash In
                        </Button>
                        <Button variant="danger" onClick={() => openDrawer("out")} className="flex items-center gap-2.5 px-8 rounded-sm transition-all transform">
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
                            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 mb-1">Total Cash In</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{fmtCurrency(stats.inflow)}</p>
                        </div>
                    </div>
                    <div className="p-5 flex items-center gap-4 bg-white dark:bg-[#1C1C1C]">
                        <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center">
                            <Minus size={15} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 mb-1">Total Cash Out</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{fmtCurrency(stats.outflow)}</p>
                        </div>
                    </div>
                    <div className="p-5 flex items-center gap-4 bg-white dark:bg-[#1C1C1C]">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-500 flex items-center justify-center font-bold text-xl">
                            =
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-300 mb-1">Net Balance</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{fmtCurrency(stats.balance)}</p>
                        </div>
                    </div>
                </div>

                {/* --- PAGINATION HEADER --- */}
                <div className="flex items-center justify-between mb-5">
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">
                        {filteredEntries.length === 0
                            ? "No entries found"
                            : `Showing ${showingFrom} - ${showingTo} of ${filteredEntries.length} entries`}
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600 dark:text-gray-400">
                            <span>Page</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1.5 border border-gray-100 dark:border-white/10 rounded-xs px-2.5 py-1 bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        {currentPage}
                                        <ChevronDown size={12} className="text-gray-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-h-[200px] overflow-y-auto w-[80px]">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                        <DropdownMenuItem key={pg} onClick={() => setCurrentPage(pg)} className="font-bold text-center justify-center cursor-pointer">
                                            {pg}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <span>of {totalPages}</span>
                        </div>
                        <div className="flex border border-gray-100 dark:border-white/10 rounded-xs bg-white dark:bg-[#1C1C1C]">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 border-r border-gray-100 dark:border-white/10 text-gray-400 transition-colors disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 transition-colors disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
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
                                    <Checkbox checked={paginatedEntries.length > 0 && paginatedEntries.every((e) => selectedEntries.has(e.id))} onChange={toggleAllOnPage} />
                                </th>
                                <th className="px-5 py-4">Date & Time</th>
                                <th className="px-5 py-4">Description</th>
                                <th className="px-5 py-4">Reference</th>
                                <th className="px-5 py-4">Type</th>
                                <th className="px-5 py-4 text-center">Attachments</th>
                                <th className="px-5 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {paginatedEntries.map((entry) => (
                                <tr key={entry.id} className="text-[14px] hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                    <td className="pl-6 pr-4 py-5 text-center">
                                        <Checkbox checked={selectedEntries.has(entry.id)} onChange={() => toggleEntrySelection(entry.id)} />
                                    </td>
                                    <td className="px-5 py-5">
                                        <p className="font-semibold text-[#111827] dark:text-white/90 text-[13px]">
                                            {format(new Date(entry.transactionDate), "dd MMM yyyy")}
                                        </p>
                                        <p className="text-gray-400 dark:text-gray-500 text-[11px] font-semibold mt-0.5">
                                            {format(new Date(entry.createdAt), "hh:mm a")}
                                        </p>
                                    </td>
                                    <td className="px-5 py-5">
                                        <p className="font-bold text-[#111827] dark:text-white/90 text-[13px] truncate max-w-[220px]">{entry.description}</p>
                                        {entry.contact && (
                                            <p className="text-gray-400 dark:text-gray-500 text-[11px] font-semibold mt-0.5">{entry.contact.name}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-5 text-gray-500 dark:text-gray-400 font-medium text-[12px]">
                                        {entry.reference || "—"}
                                    </td>
                                    <td className="px-5 py-5">
                                        <Badge
                                            variant="light"
                                            color={entry.type === "INFLOW" ? "success" : "error"}
                                            size="sm"
                                        >
                                            {entry.type === "INFLOW" ? "Cash In" : "Cash Out"}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        {entry.attachments && entry.attachments.length > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-brand-500 text-[11px] font-bold">
                                                <Paperclip size={12} /> {entry.attachments.length}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600 text-[11px]">—</span>
                                        )}
                                    </td>
                                    <td className={`px-5 py-5 text-right font-bold text-base ${entry.type === "INFLOW" ? "text-emerald-600 dark:text-emerald-500" : "text-red-500"}`}>
                                        {entry.type === "INFLOW" ? "+" : "-"}{fmtCurrency(entry.amount)}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                                    <Eye size={14} className="opacity-50" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                                    <ArrowRightLeft size={14} className="opacity-50" /> Reverse Entry
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="flex items-center gap-2 text-red-500 cursor-pointer">
                                                    <Trash2 size={14} className="opacity-50" /> Delete Entry
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {paginatedEntries.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Wallet size={32} className="text-gray-200 dark:text-gray-700" />
                                            <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
                                                {searchQuery ? "No entries match your search" : "No entries yet — start by adding Cash In or Cash Out"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- BOTTOM PAGINATION --- */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-[12px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                        >
                            First
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - currentPage) <= 2)
                            .reduce<(number | "...")[]>((acc, pg, idx, arr) => {
                                if (idx > 0 && pg - (arr[idx - 1] as number) > 1) acc.push("...");
                                acc.push(pg);
                                return acc;
                            }, [])
                            .map((pg, i) =>
                                pg === "..." ? (
                                    <span key={`dot-${i}`} className="px-1 text-gray-300 dark:text-gray-600">…</span>
                                ) : (
                                    <button
                                        key={pg}
                                        onClick={() => setCurrentPage(pg as number)}
                                        className={`w-8 h-8 rounded-sm text-[12px] font-bold transition-colors ${currentPage === pg
                                            ? "bg-brand-500 text-white"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                                            }`}
                                    >
                                        {pg}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-[12px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                        >
                            Last
                        </button>
                    </div>
                )}
            </main>

            {/* --- SIDE DRAWER: Cash In / Cash Out --- */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[99999] flex justify-end">
                    <div className="absolute inset-0 bg-[#374151]/20 backdrop-blur-[1px] transition-all duration-300" onClick={() => setIsDrawerOpen(false)} />
                    <div className="relative w-full max-w-[480px] bg-white dark:bg-[#1C1C1C] h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        {/* Drawer Header */}
                        <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h2 className={`text-xl font-bold tracking-tight ${drawerType === "in" ? "text-emerald-600" : "text-red-500"}`}>
                                Add {drawerType === "in" ? "Cash In" : "Cash Out"} Entry
                            </h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <form onSubmit={handleCreateEntry} className="flex-1 overflow-y-auto px-8 py-8 space-y-7 no-scrollbar pb-32">
                            {/* Type Toggle */}
                            <div className="flex bg-gray-50/50 dark:bg-white/5 p-1.5 rounded-full w-fit">
                                <button type="button" onClick={() => setDrawerType("in")}
                                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${drawerType === "in" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-500"}`}>
                                    Cash In
                                </button>
                                <button type="button" onClick={() => setDrawerType("out")}
                                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${drawerType === "out" ? "bg-red-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-500"}`}>
                                    Cash Out
                                </button>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400 flex items-center gap-1">
                                        Date <span className="text-red-500 font-black">*</span>
                                    </label>
                                    <div className="relative">
                                        <DatePicker
                                            id="transaction-date"
                                            defaultDate={newEntry.transactionDate}
                                            onChange={([date]) => {
                                                if (date) {
                                                    setNewEntry(p => ({ ...p, transactionDate: format(date, "yyyy-MM-dd") }));
                                                }
                                            }}
                                            placeholder="Select date"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Reference No.</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Clock size={16} />
                                        </div>
                                        <Input type="text" value={newEntry.reference} placeholder="INV-001"
                                            onChange={(e) => setNewEntry((p) => ({ ...p, reference: e.target.value }))}
                                            className="pl-11 rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A]" />
                                    </div>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400 flex items-center gap-1">
                                        Amount <span className="text-red-500 font-black">*</span>
                                    </label>
                                    <Info size={14} className="text-gray-300 cursor-help" />
                                </div>
                                <Input type="number" value={newEntry.amount} placeholder="eg. 50,000"
                                    onChange={(e) => setNewEntry((p) => ({ ...p, amount: e.target.value }))}
                                    className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A] placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </div>

                            {/* Account */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Account</label>
                                    <button
                                        type="button"
                                        onClick={() => setCreateAccountOpen(true)}
                                        className="flex items-center gap-1 text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors uppercase"
                                    >
                                        <Plus size={12} />
                                        Add New
                                    </button>
                                </div>
                                <Select
                                    options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${fmtCurrency(a.balance)} ${a.currency})` }))}
                                    placeholder="Select Account"
                                    defaultValue={newEntry.accountId}
                                    onChange={(val) => setNewEntry((p) => ({ ...p, accountId: val }))}
                                    className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] h-11 bg-white dark:bg-[#2A2A2A] flex items-center"
                                />
                            </div>

                            {/* Contact */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Contact Name</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddContactModal(true)}
                                        className="flex items-center gap-1 text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors uppercase"
                                    >
                                        <Plus size={12} />
                                        Add New
                                    </button>
                                </div>
                                <Select
                                    options={[{ value: "none", label: "No Contact" }, ...contacts.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` }))]}
                                    placeholder="Search or Select"
                                    defaultValue={newEntry.contactId}
                                    onChange={(val) => setNewEntry((p) => ({ ...p, contactId: val }))}
                                    className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] h-11 bg-white dark:bg-[#2A2A2A] flex items-center"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Description <span className="text-red-500 font-black">*</span></label>
                                <textarea required value={newEntry.description}
                                    onChange={(e) => setNewEntry((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="e.g. Payment for office supplies, Invoice #123"
                                    className="w-full h-24 p-4 border border-gray-100 dark:border-white/10 rounded-sm text-[13px] bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-brand-500 transition-all font-medium resize-none"
                                />
                            </div>

                            {/* Attachments */}
                            <div className="pt-2 space-y-3">
                                {newEntry.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {newEntry.attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-sm border border-gray-100 dark:border-white/10">
                                                <FileText size={14} className="text-brand-500" />
                                                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 max-w-[120px] truncate">{file.fileName}</span>
                                                <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2.5 text-brand-600 text-[13px] font-bold hover:bg-brand-50/50 px-5 py-2.5 rounded-sm border border-brand-100 dark:border-brand-500/20 transition-colors">
                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <span className="text-lg">🔗</span>}
                                    Attach Bills
                                </button>
                                <p className="text-[11px] text-emerald-600 font-bold">Attach up to 4 images or PDF files ({newEntry.attachments.length}/4)</p>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                            </div>
                        </form>

                        {/* Drawer Footer */}
                        <div className="absolute bottom-0 left-0 right-0 px-8 py-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1C1C1C] grid grid-cols-2 gap-4">
                            <Button type="submit" disabled={createEntryMutation.isPending || !newEntry.accountId || !newEntry.amount || !newEntry.description}
                                onClick={(handleCreateEntry as any)}
                                className={`py-3.5 rounded-sm font-bold shadow-none border-none text-[14px] ${drawerType === "in" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
                                {createEntryMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                                Save Entry
                            </Button>
                            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}
                                className="hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/10 py-3.5 rounded-sm font-bold shadow-none text-[14px]">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CREATE ACCOUNT MODAL --- */}
            <Modal isOpen={createAccountOpen} onClose={() => setCreateAccountOpen(false)}
                className="sm:max-w-[420px] p-0 overflow-hidden rounded-lg">
                <form onSubmit={handleCreateAccount}>
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Account</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Add a new payment account to this cashbook.</p>
                    </div>
                    <div className="px-8 py-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Account Name <span className="text-red-500">*</span></label>
                            <Input value={newAccount.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Petty Cash, Bank Account"
                                className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Account Type</label>
                                <Select
                                    options={ACCOUNT_TYPES}
                                    defaultValue={newAccount.type}
                                    onChange={(val) => setNewAccount((p) => ({ ...p, type: val }))}
                                    className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] h-11 bg-white dark:bg-[#2A2A2A]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Currency</label>
                                <Input disabled value={newAccount.currency}
                                    className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-gray-50 dark:bg-[#2A2A2A] opacity-60" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Description</label>
                            <textarea value={newAccount.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAccount((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Purpose of this account..."
                                className="w-full h-20 p-4 border border-gray-100 dark:border-white/10 rounded-sm text-[13px] bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder:text-gray-300 focus:outline-none focus:border-brand-500 transition-all font-medium resize-none" />
                        </div>
                    </div>
                    <div className="px-8 py-5 border-t border-gray-100 dark:border-white/5 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setCreateAccountOpen(false)} className="flex-1 py-3 rounded-sm font-bold text-[13px]">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createAccountMutation.isPending} className="flex-[2] py-3 rounded-sm font-bold text-[13px]">
                            {createAccountMutation.isPending ? <><Loader2 size={14} className="animate-spin mr-2" /> Creating...</> : "Create Account"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* --- ADD CONTACT MODAL --- */}
            <Modal isOpen={showAddContactModal} onClose={() => setShowAddContactModal(false)}
                className="sm:max-w-[420px] p-0 overflow-hidden rounded-lg">
                <form onSubmit={handleCreateContact}>
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Contact</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Create a new contact for your transactions.</p>
                    </div>
                    <div className="px-8 py-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Contact Name <span className="text-red-500">*</span></label>
                            <Input value={newContact.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. John Doe, ACME Corp"
                                className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Contact Type</label>
                            <Select
                                options={CONTACT_TYPES}
                                defaultValue={newContact.type}
                                onChange={(val) => setNewContact((p) => ({ ...p, type: val }))}
                                className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] h-11 bg-white dark:bg-[#2A2A2A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Email Address</label>
                            <Input value={newContact.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                                placeholder="john@example.com"
                                className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400">Phone Number</label>
                            <Input value={newContact.phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                                placeholder="+1 234 567 890"
                                className="rounded-sm border-gray-100 dark:border-white/10 text-[13px] font-bold h-11 bg-white dark:bg-[#2A2A2A]" />
                        </div>
                    </div>
                    <div className="px-8 py-5 border-t border-gray-100 dark:border-white/5 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowAddContactModal(false)} className="flex-1 py-3 rounded-sm font-bold text-[13px]">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createContactMutation.isPending} className="flex-[2] py-3 rounded-sm font-bold text-[13px]">
                            {createContactMutation.isPending ? <><Loader2 size={14} className="animate-spin mr-2" /> Creating...</> : "Add Contact"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CashbookDetails;
