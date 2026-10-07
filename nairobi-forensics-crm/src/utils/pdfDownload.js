// src/utils/pdfDownload.js

/**
 * Get the API base URL (auto-detects host so it works on desktop AND phone).
 */
const getApiBase = () => {
    const host = window.location.hostname;
    return `http://${host}:5000/api`;
};

/**
 * Read CSRF token from cookie (JS CAN read this one).
 */
const getCsrfToken = () => {
    const match = document.cookie.match(/(?:^|;\s*)nf_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Fetch a PDF from the backend using cookie auth.
 * @param {string} endpoint - e.g. '/receipts/abc123/pdf'
 * @returns {Promise<Blob>} - the PDF blob
 */
const fetchPdfBlob = async (endpoint) => {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
        method: 'GET',
        credentials: 'include',   // ← sends HTTP-only auth cookie
        headers: {
            'X-CSRF-Token': getCsrfToken() || ''
        }
    });

    // 401 = session expired
    if (response.status === 401) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
    }

    // 403 = CSRF missing/invalid
    if (response.status === 403) {
        throw new Error('Permission denied. Please refresh the page and try again.');
    }

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Failed to fetch PDF (${response.status})`);
    }

    // Verify content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf')) {
        throw new Error('Server did not return a PDF. Please try again.');
    }

    return response.blob();
};

/**
 * Download a PDF (triggers a file save dialog).
 */
export const downloadPDF = async (endpoint, filename, onStart, onFinish) => {
    if (onStart) onStart();

    try {
        const blob = await fetchPdfBlob(endpoint);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error('PDF download failed:', error);
        alert('Failed to download PDF:\n\n' + error.message);
    } finally {
        if (onFinish) onFinish();
    }
};

/**
 * Open a PDF inline in a new browser tab.
 */
export const viewPDF = async (endpoint) => {
    try {
        const blob = await fetchPdfBlob(endpoint);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
        console.error('PDF view failed:', error);
        alert('Failed to open PDF:\n\n' + error.message);
    }
};

/**
 * Print a PDF — opens it in a new tab and triggers print.
 */
export const printPDF = async (endpoint) => {
    try {
        const blob = await fetchPdfBlob(endpoint);
        const url = window.URL.createObjectURL(blob);

        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.addEventListener('load', () => {
                setTimeout(() => printWindow.print(), 500);
            });
        }

        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
        console.error('PDF print failed:', error);
        alert('Failed to print PDF:\n\n' + error.message);
    }
};