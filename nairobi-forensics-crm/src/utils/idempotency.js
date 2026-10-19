// src/utils/idempotency.js

/**
 * Generate a unique key for one operation.
 * Call this ONCE per user action, not per retry.
 */
export const generateIdempotencyKey = () => {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};