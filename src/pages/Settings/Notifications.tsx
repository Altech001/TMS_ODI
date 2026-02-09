import React, { useState } from 'react';
import {
    Bell,
    CheckCheck,
    Trash2,
    Clock,
    MessageSquare,
    Briefcase,
    AlertCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationType } from '../../services/api';

const TypeIcon = ({ type }: { type: NotificationType }) => {
    switch (type) {
        case 'TASK_ASSIGNED':
        case 'TASK_UPDATED':
        case 'TASK_COMPLETED':
            return <Briefcase className="w-4 h-4 text-blue-500" />;
        case 'TASK_COMMENT':
        case 'MENTION':
            return <MessageSquare className="w-4 h-4 text-purple-500" />;
        case 'PROJECT_INVITE':
        case 'ORG_INVITE':
            return <Calendar className="w-4 h-4 text-amber-500" />;
        case 'EXPENSE_APPROVED':
            return <CheckCheck className="w-4 h-4 text-green-500" />;
        case 'EXPENSE_REJECTED':
            return <AlertCircle className="w-4 h-4 text-red-500" />;
        default:
            return <Bell className="w-4 h-4 text-gray-400" />;
    }
};

const Notifications: React.FC = () => {
    const {
        notifications,
        isLoading,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead,
        pagination,
        fetchNotifications
    } = useNotifications();

    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const handleFilterChange = (newFilter: 'all' | 'unread') => {
        setFilter(newFilter);
        fetchNotifications({ unreadOnly: newFilter === 'unread' ? true : undefined });
    };

    const handlePageChange = (newPage: number) => {
        fetchNotifications({
            page: newPage,
            unreadOnly: filter === 'unread' ? true : undefined
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Notifications</h2>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
                        You have {unreadCount} unread messages
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => markAllAsRead()}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-500 hover:bg-brand-500/5 transition-colors rounded-none border border-brand-500/20"
                    >
                        Mark All Read
                    </button>
                    <button
                        onClick={() => clearRead()}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-colors rounded-none border border-red-500/20"
                    >
                        Clear Read
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-0">
                <button
                    onClick={() => handleFilterChange('all')}
                    className={`pb-4 px-2 text-[10px] font-bold uppercase tracking-widest transition-all relative ${filter === 'all' ? 'text-brand-500' : 'text-gray-400'}`}
                >
                    All Notifications
                    {filter === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"></div>}
                </button>
                <button
                    onClick={() => handleFilterChange('unread')}
                    className={`pb-4 px-2 text-[10px] font-bold uppercase tracking-widest transition-all relative ${filter === 'unread' ? 'text-brand-500' : 'text-gray-400'}`}
                >
                    Unread
                    {filter === 'unread' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"></div>}
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#1C1C1C] border-gray-100 dark:border-white/5 rounded-none overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading notifications...</p>
                    </div>
                ) : (!notifications || notifications.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-white/[0.02]">
                            <Bell className="w-8 h-8 text-gray-300 dark:text-white/10" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No notifications found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {notifications?.map((notif) => (
                            <div
                                key={notif.id}
                                className={`group p-6 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors relative ${!notif.isRead ? 'bg-brand-50/20 dark:bg-brand-500/[0.02]' : ''}`}
                            >
                                {!notif.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
                                )}

                                <div className={`p-2 rounded-none ${!notif.isRead ? 'bg-white dark:bg-white/5' : 'bg-gray-100 dark:bg-white/[0.02]'}`}>
                                    <TypeIcon type={notif.type} />
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-xs font-bold transition-colors ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] leading-relaxed ${!notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                                        {notif.message}
                                    </p>

                                    <div className="pt-3 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.isRead && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-brand-500 hover:text-brand-600 flex items-center gap-1.5"
                                            >
                                                <CheckCheck className="w-3.5 h-3.5" />
                                                Mark as read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notif.id)}
                                            className="text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 flex items-center gap-1.5"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className="p-2 border border-gray-100 dark:border-white/5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        disabled={pagination.page === pagination.pages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className="p-2 border border-gray-100 dark:border-white/5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Notifications;
