import React, { useEffect, useState } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { AuditLogAPI, AuditLog } from '../../services/api';
import {
    Loader2,
    AlertCircle,
    BookOpen,
    Search,
    Filter,
    Activity,
    User as UserIcon,
    Shield,
    Globe
} from 'lucide-react';
import Select from '../../components/form/Select';
import Input from '../../components/form/input/InputField';

const AuditLogs: React.FC = () => {
    const { currentOrganization } = useOrganization();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [moduleFilter, setModuleFilter] = useState('ALL');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAuditLogs = async () => {
        if (!currentOrganization) return;
        try {
            setIsLoading(true);
            setError('');
            const response = await AuditLogAPI.getLogs();
            if (response.success) {
                setLogs(response.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [currentOrganization]);

    const modules = Array.from(new Set(logs.map(l => l.module)));
    const actions = Array.from(new Set(logs.map(l => l.action)));

    const filteredLogs = logs.filter(log => {
        if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
        if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
        if (searchTerm &&
            !log.module.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !log.user?.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const getActionColor = (action: string) => {
        const a = action.toUpperCase();
        if (a.includes('CREATE') || a.includes('INVITE')) return 'text-green-500 bg-green-500/5 border-green-500/10';
        if (a.includes('UPDATE')) return 'text-blue-500 bg-blue-500/5 border-blue-500/10';
        if (a.includes('DELETE') || a.includes('REMOVE') || a.includes('LEAVE')) return 'text-red-500 bg-red-500/5 border-red-500/10';
        if (a.includes('APPROVE')) return 'text-purple-500 bg-purple-500/5 border-purple-500/10';
        return 'text-gray-500 bg-gray-500/5 border-gray-500/10';
    };

    if (!currentOrganization) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Shield className="w-10 h-10 text-red-500/20" />
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
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Audit Logs</h2>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
                        Track all activities within {currentOrganization.name}
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-none flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 p-6">
                <div className="md:col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Search className="w-3 h-3" /> Search Activity
                    </p>
                    <Input
                        placeholder="Search by module, user or action..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-none border-gray-100 dark:border-white/5"
                    />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Filter className="w-3 h-3" /> Module
                    </p>
                    <Select
                        defaultValue={moduleFilter}
                        options={[
                            { label: 'All Modules', value: 'ALL' },
                            ...modules.map(m => ({ label: m, value: m }))
                        ]}
                        onChange={(val) => setModuleFilter(val)}
                        className="rounded-none border-gray-100 dark:border-white/5"
                    />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Action
                    </p>
                    <Select
                        defaultValue={actionFilter}
                        options={[
                            { label: 'All Actions', value: 'ALL' },
                            ...actions.map(a => ({ label: a, value: a }))
                        ]}
                        onChange={(val) => setActionFilter(val)}
                        className="rounded-none border-gray-100 dark:border-white/5"
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-none overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading audit logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-none">
                            <BookOpen className="w-10 h-10 text-gray-200 dark:text-white/5" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No activity found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activity</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Context</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/5">
                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{log.user?.name || 'System'}</p>
                                                    <p className="text-[9px] text-gray-500 lowercase tracking-tight flex items-center gap-1">
                                                        <Globe className="w-3 h-3 text-gray-400/50" /> {log.ipAddress || 'Internal'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.module}</p>
                                                <div>
                                                    <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate max-w-[200px]">
                                                    {log.resourceId ? `ID: ${log.resourceId}` : 'Main Module'}
                                                </p>
                                                {log.userAgent && (
                                                    <p className="text-[9px] text-gray-400 truncate max-w-[200px]" title={log.userAgent}>
                                                        {log.userAgent}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-tight">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
