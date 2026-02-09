import React, { useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import {
    Mail,
    Check,
    X,
    Loader2,
    AlertCircle,
    Building2,
    Clock
} from 'lucide-react';
import Button from '../../components/ui/button/Button';

const Invitations: React.FC = () => {
    const {
        invites,
        fetchInvites,
        acceptInvitation,
        declineInvitation,
        isLoading,
        error
    } = useOrganization();

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    const handleAccept = async (token: string) => {
        try {
            await acceptInvitation(token);
        } catch (err) {
            // Error is handled in context
        }
    };

    const handleDecline = async (token: string) => {
        try {
            await declineInvitation(token);
        } catch (err) {
            // Error is handled in context
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Pending Invitations</h2>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
                    Manage requests to join organisations
                </p>
            </div>

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
                        {invites.map((invite) => (
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
                                            {invite.organization.name}
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
                                        Decline
                                    </Button>
                                    <Button
                                        onClick={() => handleAccept(invite.token)}
                                        className="flex-1 sm:flex-none h-9 rounded-none text-[10px] font-bold uppercase tracking-widest shadow-none"
                                        startIcon={<Check className="w-3 h-3" />}
                                    >
                                        Accept
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
