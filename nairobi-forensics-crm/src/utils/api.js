// src/utils/api.js
import { getApiUrl, getCsrfToken, rememberCsrfToken, clearCsrfToken } from './apiConfig';

const API_URL = getApiUrl();

// ============================================================
// apiFetch — authenticated requests (cookie-based)
// Used by: everything except login/register
// ============================================================
export const apiFetch = async (endpoint, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    // Add CSRF token for state-changing methods
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        headers['X-CSRF-Token'] = await getCsrfToken();
    }

    const config = {
        method,
        headers,
        credentials: 'include'    // ← sends HTTP-only auth cookie
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle 401 — session expired
    if (response.status === 401) {
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const err = new Error(data.message || 'Request failed');
        if (data.errors) err.errors = data.errors;
        throw err;
    }

    return data;
};

// ============================================================
// publicFetch — unauthenticated requests (login/register/logout)
// No CSRF token required (backend skips auth routes)
// ============================================================
export const publicFetch = async (endpoint, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const headers = { 'Content-Type': 'application/json' };
    const isAuthBootstrap = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !isAuthBootstrap) {
        headers['X-CSRF-Token'] = await getCsrfToken();
    }

    const config = {
        method,
        headers,
        credentials: 'include'    // ← still needed to set/receive cookies
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));
    rememberCsrfToken(data.csrfToken);
    if (endpoint.startsWith('/auth/logout')) clearCsrfToken();

    if (!response.ok) {
        const err = new Error(data.message || 'Request failed');
        if (data.errors) err.errors = data.errors;
        throw err;
    }

    return data;
};

// ============================================================
// Legacy default export (in case anything still imports default)
// ============================================================
export default apiFetch;