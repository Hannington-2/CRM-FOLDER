// src/utils/api.js

// ===== Auto-detect API URL based on hostname =====
const getApiUrl = () => {
    const host = window.location.hostname;
    return `http://${host}:5000/api`;
};

const API_URL = getApiUrl();

// ===== Read CSRF token from cookie (JS CAN read this one) =====
const getCsrfToken = () => {
    const match = document.cookie.match(/(?:^|;\s*)nf_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

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
        const csrf = getCsrfToken();
        if (csrf) headers['X-CSRF-Token'] = csrf;
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
        localStorage.removeItem('user');
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

    const config = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'    // ← still needed to set/receive cookies
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

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