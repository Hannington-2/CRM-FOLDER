// src/utils/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;
let currentUserId = null;

export const connectSocket = (userId) => {
    // If already connected for same user, reuse
    if (socket && currentUserId === userId) {
        return socket;
    }

    // If connected for different user, disconnect first
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    currentUserId = userId;

    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected');
        socket.emit('register', String(userId));
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
        console.warn('⚠️ Socket connection error:', err.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentUserId = null;
    }
};