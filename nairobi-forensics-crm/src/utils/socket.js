// src/utils/socket.js
import { io } from 'socket.io-client';

const getSocketUrl = () => {
    const host = window.location.hostname;
    return `http://${host}:5000`;
};

const SOCKET_URL = getSocketUrl();

let socket = null;
let currentUserId = null;

export const connectSocket = (userId) => {
    if (socket && currentUserId === userId) {
        return socket;
    }

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    currentUserId = userId;

    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,           // ← Send cookies in handshake
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected (authenticated via cookie)');
        // Legacy register — server now auto-registers from cookie
        if (userId) socket.emit('register', String(userId));
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