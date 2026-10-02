// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Wrap load in useCallback so it can be safely used in useEffect
    const load = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const data = await apiFetch('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Load notifications failed:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial load when auth state changes
    useEffect(() => {
        load();
    }, [load]);

    // Poll every 30 seconds to stay fresh
    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, load]);

    // Mark a single notification as read
    const markAsRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('markAsRead failed:', err);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await apiFetch('/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('markAllAsRead failed:', err);
        }
    };

    // Delete one
    const deleteNotification = async (id) => {
        try {
            await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => {
                const deleted = prev.find(n => n._id === id);
                if (deleted && !deleted.isRead) {
                    setUnreadCount(c => Math.max(0, c - 1));
                }
                return prev.filter(n => n._id !== id);
            });
        } catch (err) {
            console.error('deleteNotification failed:', err);
        }
    };

    // Clear all
    const clearAll = async () => {
        try {
            await apiFetch('/notifications/clear-all', { method: 'DELETE' });
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('clearAll failed:', err);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                load,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                clearAll
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};