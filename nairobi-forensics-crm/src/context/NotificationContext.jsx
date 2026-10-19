// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { connectSocket, disconnectSocket } from '../utils/socket';
import { apiFetch } from '../utils/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toasts, setToasts] = useState([]);
    const [permission, setPermission] = useState(
        typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission
            : 'default'
    );
    const socketRef = useRef(null);

    // ============ LOAD INITIAL ============
    const load = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const data = await apiFetch('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Load notifications failed:', err);
        }
    }, [isAuthenticated]);

    const showToast = useCallback((n) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { ...n, toastId: id }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.toastId !== id));
        }, 6000);
    }, []);

    const playSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch {
            // Silent fail
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) load();
    }, [isAuthenticated, load]);

    // ============ SOCKET CONNECTION ============
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        const socket = connectSocket(user.id);
        socketRef.current = socket;

        const handleNotification = (n) => {
            console.log('🔔 New notification received:', n);
            setNotifications(prev => [n, ...prev]);
            setUnreadCount(prev => prev + 1);
            showToast(n);
            playSound();
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [isAuthenticated, user?.id, showToast, playSound]);

    // Disconnect on logout
    useEffect(() => {
        if (!isAuthenticated) {
            disconnectSocket();
        }
    }, [isAuthenticated]);

    const dismissToast = (toastId) => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
    };

    // ============ ACTIONS ============
    const markAsRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiFetch('/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

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
            console.error(err);
        }
    };

    const clearAll = async () => {
        try {
            await apiFetch('/notifications/clear-all', { method: 'DELETE' });
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    // ============ BROWSER PERMISSION ============
    const requestPermission = async () => {
        if (!('Notification' in window)) return false;
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            toasts,
            permission,
            requestPermission,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll,
            dismissToast,
            showToast,
            refresh: load
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};