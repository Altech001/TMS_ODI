import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import { Cashbook, CashbookMember, OrgMember } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    ChevronDown,
    Loader2,
    Search,
    Shield,
    Trash2,
    UserPlus,
    Users
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/button/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const CashbookMembers: React.FC = () => {
    const { id: cashbookId } = useParams<{ id: string }>();
    const { activeOrg } = useOrg();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [inviteOpen, setInviteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Queries ---
    const { data: cashbook, isLoading: loadingCashbook } = useQuery({
        queryKey: ["cashbook", cashbookId],
        queryFn: async () => {
            const res = await apiClient.get(`/org-finance/cashbooks/${cashbookId}`);
            return res.data.data as Cashbook;
        },
        enabled: !!cashbookId
    });

    const { data: members = [], isLoading: loadingMembers } = useQuery({
        queryKey: ["cashbook-members", cashbookId],
        queryFn: async () => {
            const res = await apiClient.get(`/org-finance/cashbooks/${cashbookId}/members`);
            return res.data.data as CashbookMember[];
        },
        enabled: !!cashbookId
    });

    const { data: orgMembers = [] } = useQuery({
        queryKey: ["org-members", activeOrg?.id],
        queryFn: async () => {
            const res = await apiClient.get("/organizations/current/members");
            return res.data.data.members as OrgMember[];
        },
        enabled: !!activeOrg?.id && inviteOpen
    });

    // --- Mutations ---
    const addMemberMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            await apiClient.post(`/org-finance/cashbooks/${cashbookId}/members`, { userId, role });
        },
        onSuccess: () => {
            toast({ title: "Member added successfully" });
            queryClient.invalidateQueries({ queryKey: ["cashbook-members", cashbookId] });
            setInviteOpen(false);
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Could not add member",
            });
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiClient.delete(`/org-finance/cashbooks/${cashbookId}/members/${userId}`);
        },
        onSuccess: () => {
            toast({ title: "Member removed successfully" });
            queryClient.invalidateQueries({ queryKey: ["cashbook-members", cashbookId] });
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Could not remove member",
            });
        }
    });

    const filteredMembers = members.filter(m =>
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const availableToInvite = orgMembers.filter(om =>
        !members.some(m => m.userId === om.userId)
    );

    if (loadingCashbook || loadingMembers) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#0F0F0F] font-outfit text-[#111827] dark:text-white/90 min-h-screen">
            {/* Header */}
            <header className="px-10 py-5 flex justify-between items-center border-b border-gray-50 dark:border-white/5 bg-white dark:bg-[#0F0F0F] sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/cashbooks")}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold dark:text-white">{cashbook?.name}</h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Manage Access & Permissions</p>
                    </div>
                </div>
                <Button
                    onClick={() => setInviteOpen(true)}
                    className="flex items-center gap-2.5 px-6 h-10 rounded-none bg-brand-500 text-white text-[11px] font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/10"
                >
                    <UserPlus size={16} />
                    INVITE MEMBER
                </Button>
            </header>

            <main className="max-w-[1200px] mx-auto px-10 py-10">
                {/* Search Bar */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="relative flex-1 max-w-[500px]">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search members by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 h-12 bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-none text-sm font-medium focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Members Table */}
                <div className="border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1C1C1C]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-none flex items-center justify-center text-brand-600 dark:text-brand-500 font-bold text-sm">
                                                    {member.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{member.user.name}</p>
                                                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{member.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-brand-500" />
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none",
                                                    member.role === 'APPROVER' ? "text-purple-500 bg-purple-500/10" :
                                                        member.role === 'EDITOR' ? "text-blue-500 bg-blue-500/10" :
                                                            "text-emerald-500 bg-emerald-500/10"
                                                )}>
                                                    {member.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button
                                                onClick={() => {
                                                    if (confirm("Remove this member's access to this cashbook?")) {
                                                        removeMemberMutation.mutate(member.userId);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users size={32} className="text-gray-200 dark:text-white/10" />
                                                <p className="text-xs font-bold text-gray-400">No members found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Invite Modal */}
            <Modal
                isOpen={inviteOpen}
                onClose={() => setInviteOpen(false)}
                className="sm:max-w-[500px] rounded-none bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 p-0 overflow-hidden"
                showCloseButton={true}
            >
                <div className="p-8 border-b border-gray-50 dark:border-white/5">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white ">Invite Team Member</h2>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Add members from your business to this cashbook.</p>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    {availableToInvite.map((om) => (
                        <div key={om.id} className="p-4 border-b border-gray-50 dark:border-white/5 last:border-none">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-white/5 rounded-none flex items-center justify-center text-[10px] font-bold">
                                        {(om.user?.name || om.firstName).charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{om.user?.name || `${om.firstName} ${om.lastName}`}</p>
                                        <p className="text-[10px] text-gray-400">{om.email}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="h-8 px-4 text-[10px] font-bold rounded-none flex items-center gap-2">
                                            Invite As
                                            <ChevronDown size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[150px] rounded-none border-gray-100 dark:border-white/5 bg-white dark:bg-[#1C1C1C] p-1 shadow-2xl">
                                        {['VIEWER', 'EDITOR', 'APPROVER'].map(role => (
                                            <DropdownMenuItem
                                                key={role}
                                                onClick={() => addMemberMutation.mutate({ userId: om.userId, role })}
                                                className="text-[10px] font-bold p-3 cursor-pointer hover:bg-brand-500 hover:text-white rounded-none border-b border-gray-50 dark:border-white/5 last:border-none"
                                            >
                                                {role}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                    {availableToInvite.length === 0 && (
                        <div className="p-10 text-center font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                            All organization members are already in this cashbook.
                        </div>
                    )}
                </div>

                <div className="p-8 bg-gray-50 dark:bg-white/[0.02] flex justify-end">
                    <button
                        onClick={() => setInviteOpen(false)}
                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        CLOSE
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default CashbookMembers;
