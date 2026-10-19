// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { startActivityTracking, getSessionTimeoutMs, WARNING_DURATION_MS } from '../utils/activityTracker';
import { apiFetch, publicFetch } from '../utils/api';
import SessionWarning from '../Components/SessionWarning/SessionWarning';

// ===== Context (used by useAuth hook) =====
export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// ===== Initial state from localStorage (user object only — NOT the token) =====
// ===== AuthProvider Component =====
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showWarning, setShowWarning] = useState(false);
    const [logoutReason, setLogoutReason] = useState(null);

    const logoutTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const activityCleanupRef = useRef(null);

    // ===== Verify session on mount (cookie-based) =====
    useEffect(() => {
        try {
            localStorage.removeItem('user');
        } catch {
            // Storage may be unavailable; auth relies on the HTTP-only cookie.
        }

        const verify = async () => {
            try {
                const data = await apiFetch('/auth/me');
                setUser(data);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, []);

    // ===== Timer helpers =====
    const clearTimers = useCallback(() => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        logoutTimerRef.current = null;
        warningTimerRef.current = null;
    }, []);

    // ===== Logout =====
    const logout = useCallback(async (reason = 'manual') => {
        clearTimers();

        if (activityCleanupRef.current) {
            activityCleanupRef.current();
            activityCleanupRef.current = null;
        }

        setLogoutReason(reason === 'timeout' ? 'timeout' : null);
        setUser(null);
        setShowWarning(false);

        try {
            await publicFetch('/auth/logout', { method: 'POST' });
        } catch {
            // Best effort — backend may not be reachable
        }
    }, [clearTimers]);

    // ===== Reset inactivity timers =====
    const resetTimers = useCallback(() => {
        if (!user) return;
        clearTimers();
        setShowWarning(false);

        const timeout = getSessionTimeoutMs();
        const warningTime = timeout - WARNING_DURATION_MS;

        // Show warning a bit before logout
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
        }, warningTime);

        // Actual auto-logout
        logoutTimerRef.current = setTimeout(() => {
            console.log('🔒 Auto-logout: session expired');
            logout('timeout');
        }, timeout);
    }, [user, clearTimers, logout]);

    // ===== Track activity when logged in =====
    useEffect(() => {
        if (!user) {
            clearTimers();
            return;
        }

        activityCleanupRef.current = startActivityTracking(() => {
            setShowWarning(prev => {
                // Don't reset if the warning is showing — user must click "Stay logged in"
                if (!prev) resetTimers();
                return prev;
            });
        });

        resetTimers();

        return () => {
            clearTimers();
            if (activityCleanupRef.current) {
                activityCleanupRef.current();
                activityCleanupRef.current = null;
            }
        };
    }, [user, resetTimers, clearTimers]);

    // ===== Login — called from Login page after successful auth =====
    const login = (userData) => {
        setLogoutReason(null);
        setUser(userData);
    };

    // ===== Stay logged in (user clicked "Stay" in warning) =====
    const stayLoggedIn = useCallback(() => {
        console.log('✅ User chose to stay logged in');
        resetTimers();
    }, [resetTimers]);

    return (
        <AuthContext.Provider
            value={{
                user,
                logoutReason,
                login,
                logout,
                loading,
                isAuthenticated: !!user
            }}
        >
            {children}

            {showWarning && user && (
                <SessionWarning
                    secondsLeft={60}
                    onStayLoggedIn={stayLoggedIn}
                    onLogoutNow={() => logout('manual')}
                />
            )}
        </AuthContext.Provider>
    );
};