import React, { useEffect, useState } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { Role } from '../../services/api';
import {
    Users,
    Plus,
    Trash2,
    AlertCircle,
    Loader2,
    Mail,
    Info,
    Calendar,
    Globe,
    LogOut,
    ArrowRightLeft,
    Save
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import { Modal } from '../../components/ui/modal';
import Select from '../../components/form/Select';

const memberRoles: Role[] = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];

const OrgSettings: React.FC = () => {
    const {
        currentOrganization,
        members,
        fetchMembers,
        refreshCurrentOrganization,
        inviteMember,
        removeMember,
        updateMemberRole,
        updateOrganization,
        leaveOrganization,
        transferOwnership,
        isLoading: orgLoading,
        error: orgError
    } = useOrganization();

    const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>('MEMBER');
    const [isInviting, setIsInviting] = useState(false);
    const [actionError, setActionError] = useState('');

    // Org Update States
    const [orgName, setOrgName] = useState(currentOrganization?.name || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferToId, setTransferToId] = useState('');

    useEffect(() => {
        if (currentOrganization) {
            setOrgName(currentOrganization.name);
        }
    }, [currentOrganization]);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                refreshCurrentOrganization(),
                fetchMembers()
            ]);
        };
        loadData();
    }, [refreshCurrentOrganization, fetchMembers]);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            setActionError('Email is required');
            return;
        }
        try {
            setIsInviting(true);
            setActionError('');
            await inviteMember(inviteEmail, inviteRole);
            setInviteEmail('');
            setInviteRole('MEMBER');
            setShowInviteModal(false);
        } catch (err: any) {
            setActionError(err.message || 'Failed to invite member');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            await removeMember(memberId);
        } catch (err: any) {
            setActionError(err.message || 'Failed to remove member');
        }
    };

    const handleRoleUpdate = async (memberId: string, role: string) => {
        try {
            await updateMemberRole(memberId, role);
        } catch (err: any) {
            setActionError(err.message || 'Failed to update role');
        }
    };

    const handleUpdateName = async () => {
        if (!orgName.trim()) return;
        try {
            setIsUpdating(true);
            await updateOrganization({ name: orgName });
        } catch (err: any) {
            setActionError(err.message || 'Failed to update organization');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Are you sure you want to leave this organisation?')) return;
        try {
            await leaveOrganization();
        } catch (err: any) {
            setActionError(err.message || 'Failed to leave organisation');
        }
    };

    const handleTransfer = async () => {
        if (!transferToId) return;
        if (!window.confirm('Are you sure you want to transfer ownership? This action cannot be undone and your role will be downgraded.')) return;
        try {
            await transferOwnership(transferToId);
            setShowTransferModal(false);
        } catch (err: any) {
            setActionError(err.message || 'Failed to transfer ownership');
        }
    };

    const isOwner = currentOrganization?.role === 'OWNER';
    const canUpdate = ['OWNER', 'ADMIN'].includes(currentOrganization?.role || '');

    if (!currentOrganization && orgLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading organisation...</p>
            </div>
        );
    }

    if (!currentOrganization) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <AlertCircle className="w-10 h-10 text-red-500/20" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    No organisation selected.<br />Please select one from the sidebar.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Organisation Settings</h2>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
                        Manage your team and organization preferences
                    </p>
                </div>
                {activeTab === 'members' && (
                    <Button
                        onClick={() => setShowInviteModal(true)}
                        startIcon={<Plus className="w-4 h-4" />}
                        className="rounded-none text-[10px] font-bold uppercase tracking-widest h-10"
                    >
                        Invite Member
                    </Button>
                )}
            </div>

            {orgError || actionError ? (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-none flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{orgError || actionError}</p>
                </div>
            ) : null}

            {/* Internal Tabs */}
            <div className="flex border-b border-gray-100 dark:border-white/5">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'members' ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {activeTab === 'members' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"></div>}
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Members
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'settings' ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"></div>}
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Details
                    </div>
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'members' && (
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-none overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {members.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Users className="w-10 h-10 text-gray-200 dark:text-white/5" />
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No members found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member) => (
                                        <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/5">
                                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                                            {member.user?.name?.charAt(0) || <Mail className="w-4 h-4" />}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{member.user?.name || 'Pending Invite'}</p>
                                                        <p className="text-[10px] text-gray-500 lowercase tracking-tight">{member.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Select
                                                    defaultValue={member.role}
                                                    options={memberRoles.map(r => ({ label: r, value: r }))}
                                                    onChange={(value) => handleRoleUpdate(member.id, value)}
                                                    className="w-32 h-9 text-[10px] font-bold rounded-none"
                                                    disabled={member.role === 'OWNER'}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRemove(member.id)}
                                                    disabled={member.role === 'OWNER'}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                    <div className="p-6 bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-none space-y-8">
                        {/* Organisation Name Section */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organisation Name</p>
                            <div className="flex gap-3">
                                <Input
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    disabled={!canUpdate}
                                    className="rounded-none border-gray-200 dark:border-white/5 flex-1"
                                />
                                {canUpdate && (
                                    <Button
                                        onClick={handleUpdateName}
                                        disabled={isUpdating || orgName === currentOrganization?.name}
                                        startIcon={isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        className="rounded-none h-11 px-6 text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        Save
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="w-3 h-3" />
                                    Owner ID
                                </p>
                                <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest bg-gray-50 dark:bg-white/5 p-3 border border-gray-100 dark:border-white/5 truncate">
                                    {currentOrganization.ownerId || '—'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Created At
                                </p>
                                <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest bg-gray-50 dark:bg-white/5 p-3 border border-gray-100 dark:border-white/5">
                                    {currentOrganization.createdAt ? new Date(currentOrganization.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : '—'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Management</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {!isOwner && (
                                    <Button
                                        variant="outline"
                                        onClick={handleLeave}
                                        startIcon={<LogOut className="w-4 h-4" />}
                                        className="rounded-none border-red-500/20 text-red-500 hover:bg-red-500/5 text-[10px] font-bold uppercase tracking-widest h-10"
                                    >
                                        Leave Organisation
                                    </Button>
                                )}
                                {isOwner && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowTransferModal(true)}
                                        startIcon={<ArrowRightLeft className="w-4 h-4" />}
                                        className="rounded-none border-brand-500/20 text-brand-500 hover:bg-brand-500/5 text-[10px] font-bold uppercase tracking-widest h-10"
                                    >
                                        Transfer Ownership
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                            <div className="p-4 bg-red-500/5 border border-red-500/10 space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Danger Zone</h4>
                                    <p className="text-[10px] text-red-500/70 uppercase tracking-tight mt-1">
                                        Deleting this organisation will permanently remove all associated data, including members, tasks, and settings.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-none text-[10px] font-bold uppercase tracking-widest h-10"
                                >
                                    Delete Organisation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                className="max-w-md p-8"
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Invite Team Member</h3>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">Add a new collaborator to {currentOrganization.name}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="rounded-none border-gray-200 dark:border-white/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Role</p>
                            <Select
                                defaultValue={inviteRole}
                                options={memberRoles.filter(r => r !== 'OWNER').map(r => ({ label: r, value: r }))}
                                onChange={(val) => setInviteRole(val as Role)}
                                className="w-full h-11 rounded-none border border-gray-200 dark:border-white/10"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowInviteModal(false)}
                            className="flex-1 rounded-none text-[10px] font-bold uppercase tracking-widest h-11"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInvite}
                            disabled={isInviting}
                            className="flex-1 rounded-none text-[10px] font-bold uppercase tracking-widest h-11"
                        >
                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Send Invitation'}
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Transfer Ownership Modal */}
            <Modal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                className="max-w-md p-8"
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Transfer Ownership</h3>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">Select a member to transfer ownership to.</p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Owner</p>
                        <Select
                            defaultValue={transferToId}
                            options={members.filter(m => m.user?.id !== currentOrganization.ownerId).map(m => ({
                                label: `${m.user?.name} (${m.user?.email})`,
                                value: m.user?.id || ''
                            }))}
                            onChange={(val) => setTransferToId(val)}
                            className="w-full h-11 rounded-none border border-gray-200 dark:border-white/10"
                        />
                        <p className="text-[9px] text-red-500/70 font-bold uppercase tracking-tight italic">
                            Warning: You will no longer be the owner of this organisation.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowTransferModal(false)}
                            className="flex-1 rounded-none text-[10px] font-bold uppercase tracking-widest h-11"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={!transferToId}
                            className="flex-1 rounded-none text-[10px] font-bold uppercase tracking-widest h-11 bg-red-500 hover:bg-red-600 border-none"
                        >
                            Transfer Now
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OrgSettings;
