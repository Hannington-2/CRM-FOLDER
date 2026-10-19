const normalizeUrl = (url) => url.trim().replace(/\/+$/, '');

export const getApiUrl = () => {
    const configuredUrl = import.meta.env.VITE_API_URL?.trim();
    if (configuredUrl) return normalizeUrl(configuredUrl);

    const host = window.location.hostname || 'localhost';
    return `http://${host}:5000/api`;
};

export const getSocketUrl = () => getApiUrl().replace(/\/api$/i, '');

let csrfTokenCache = null;
let csrfTokenRequest = null;

export const rememberCsrfToken = (token) => {
    if (typeof token === 'string' && token) csrfTokenCache = token;
};

export const clearCsrfToken = () => {
    csrfTokenCache = null;
    csrfTokenRequest = null;
};

export const getCsrfToken = async () => {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)nf_csrf=([^;]+)/);
    if (cookieMatch) {
        csrfTokenCache = decodeURIComponent(cookieMatch[1]);
        return csrfTokenCache;
    }

    if (csrfTokenCache) return csrfTokenCache;

    if (!csrfTokenRequest) {
        csrfTokenRequest = fetch(`${getApiUrl()}/auth/csrf`, { credentials: 'include' })
            .then(async response => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.csrfToken) {
                    throw new Error(data.message || 'Unable to initialize request security.');
                }
                csrfTokenCache = data.csrfToken;
                return csrfTokenCache;
            })
            .finally(() => {
                csrfTokenRequest = null;
            });
    }

    return csrfTokenRequest;
};
