// src/utils/activityTracker.js

const ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'touchmove',
    'click',
    'wheel'
];

// Throttle: only fire callback every 5 seconds max
const THROTTLE_MS = 5000;

/**
 * Start tracking user activity.
 * @param {Function} onActivity - called when the user is active (throttled)
 * @returns {Function} cleanup function to stop tracking
 */
export const startActivityTracking = (onActivity) => {
    let lastFired = 0;

    const handler = () => {
        const now = Date.now();
        if (now - lastFired > THROTTLE_MS) {
            lastFired = now;
            onActivity();
        }
    };

    ACTIVITY_EVENTS.forEach(event =>
        window.addEventListener(event, handler, { passive: true })
    );

    // Also track tab visibility — returning to the tab = activity
    const visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
            handler();
        }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // Return cleanup function
    return () => {
        ACTIVITY_EVENTS.forEach(event =>
            window.removeEventListener(event, handler)
        );
        document.removeEventListener('visibilitychange', visibilityHandler);
    };
};

/**
 * Detect if the current device is mobile (phone or tablet).
 */
export const isMobileDevice = () => {
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
};

/**
 * Get the inactivity timeout in milliseconds.
 */
export const getSessionTimeoutMs = () => 5 * 60 * 1000;

/**
 * The warning window before auto-logout fires.
 */
export const WARNING_DURATION_MS = 60 * 1000; // 60 seconds