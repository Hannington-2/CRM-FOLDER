// src/utils/api.js
const API_URL = 'http://localhost:5000/api';

/**
 * Wrapper around fetch that automatically adds the JWT token.
 * @param {string} endpoint - e.g. '/clients'
 * @param {object} options - { method, body }
 */
export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        }
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        // If token expired or invalid → kick user out
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new Error(data.message || 'Request failed');
    }

    return data;
};