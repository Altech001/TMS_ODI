import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, NotificationAPI, NotificationFilters } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    } | null;
    fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState<NotificationContextType['pagination']>(null);

    const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const response = await NotificationAPI.getAll(filters);
            if (response.success) {
                setNotifications(response.data || []);
                if (response.unreadCount !== undefined) {
                    setUnreadCount(response.unreadCount);
                } else if (!filters || filters.unreadOnly === undefined) {
                    // Fallback to counting current page if unreadCount not provided by API
                    // Note: This is only accurate for the current page
                    const count = response.data.filter(n => !n.isRead).length;
                    setUnreadCount(count);
                }

                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const markAsRead = async (id: string) => {
        try {
            const res = await NotificationAPI.markAsRead(id);
            if (res.success) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await NotificationAPI.markAllAsRead();
            if (res.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const res = await NotificationAPI.delete(id);
            if (res.success) {
                const deleted = notifications.find(n => n.id === id);
                setNotifications(prev => prev.filter(n => n.id !== id));
                if (deleted && !deleted.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const clearRead = async () => {
        try {
            const res = await NotificationAPI.deleteAllRead();
            if (res.success) {
                setNotifications(prev => prev.filter(n => !n.isRead));
            }
        } catch (error) {
            console.error('Failed to clear read notifications:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            // Optional: poll for new notifications every few minutes
            const interval = setInterval(() => fetchNotifications(), 300000); // 5 mins
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            pagination,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
