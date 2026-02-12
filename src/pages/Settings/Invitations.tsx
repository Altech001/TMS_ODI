/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    AlertCircle,
    Building2,
    Clock,
    Loader2,
    Mail,
    X
} from 'lucide-react';
import React, { useEffect } from 'react';
import Select from '../../components/form/Select';
import Button from '../../components/ui/button/Button';
import { useOrganization } from '../../context/OrganizationContext';
import { OrganizationInvite } from '../../services/api';

const Invitations: React.FC = () => {
    const {
        invites,
        fetchInvites,
        inviteMember,
        declineInvitation,
        isLoading,
        currentOrganization,
        error
    } = useOrganization();

    const [inviteEmail, setInviteEmail] = React.useState("");
    const [inviting, setInviting] = React.useState(false);
    const [inviteRole, setInviteRole] = React.useState<string>("MEMBER");

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization || !inviteEmail) return;
        setInviting(true);
        try {
            await inviteMember(inviteEmail, inviteRole);
            setInviteEmail("");
            fetchInvites();
        } catch (err: any) {
            // Error is handled in context
        } finally {
            setInviting(false);
        }
    };

    const handleDecline = async (token: string) => {
        // For outgoing invites, "Decline" might mean "Cancel" or "Revoke"
        // In the context of this UI, we use the same declineInvitation method
        try {
            await declineInvitation(token);
        } catch (err) {
            // Error is handled in context
        }
    };

    if (!currentOrganization) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-none">
                    <Building2 className="w-12 h-12 text-gray-200 dark:text-white/5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">No Organisation Selected</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select an organisation to manage invitations</p>
            </div>
        );
    }

    const canInvite = ['OWNER', 'ADMIN'].includes(currentOrganization.role);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Pending Invitations</h2>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
                    Manage outgoing invitations for {currentOrganization.name}
                </p>
            </div>

            {/* Invite Form */}
            {canInvite && (
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 p-6 rounded-none">
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="email"
                                placeholder="Enter email address..."
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full h-11 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-none px-4 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-500 transition-colors"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                options={[
                                    { value: "ADMIN", label: "ADMIN" },
                                    { value: "MANAGER", label: "MANAGER" },
                                    { value: "MEMBER", label: "MEMBER" },
                                    { value: "VIEWER", label: "VIEWER" }
                                ]}
                                defaultValue={inviteRole}
                                placeholder="Select role"
                                onChange={val => setInviteRole(val)}
                                className="h-11 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-none text-[10px] font-bold uppercase tracking-widest"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={inviting || !inviteEmail}
                            className="h-11 px-8 rounded-none text-[10px] font-bold uppercase tracking-[0.2em]"
                        >
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invitation"}
                        </Button>
                    </form>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-none flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
                </div>
            )}

            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-none overflow-hidden min-h-[400px]">
                {isLoading && invites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching invitations...</p>
                    </div>
                ) : invites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-none">
                            <Mail className="w-10 h-10 text-gray-200 dark:text-white/5" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No pending invitations</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {invites.map((invite: OrganizationInvite) => (
                            <div
                                key={invite.id}
                                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-brand-500/10 rounded-none">
                                        <Building2 className="w-5 h-5 text-brand-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                                            {invite.organization?.name || invite.email}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                {invite.role}
                                            </span>
                                            <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                <Clock className="w-3 h-3" />
                                                Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDecline(invite.token)}
                                        className="flex-1 sm:flex-none h-9 rounded-none border-gray-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest"
                                        startIcon={<X className="w-3 h-3" />}
                                    >
                                        Revoke
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invitations;
