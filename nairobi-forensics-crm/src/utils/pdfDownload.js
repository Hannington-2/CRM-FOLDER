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
 * Returns a Blob. Throws a descriptive Error on any failure.
 *
 * @param {string} endpoint - e.g. '/receipts/abc123/pdf'
 * @returns {Promise<Blob>} - the PDF blob
 */
const fetchPdfBlob = async (endpoint) => {
    let response;
    try {
        response = await fetch(`${getApiBase()}${endpoint}`, {
            method: 'GET',
            credentials: 'include',   // sends HTTP-only auth cookie
            headers: {
                'X-CSRF-Token': getCsrfToken() || ''
            }
        });
    } catch (networkErr) {
        // Total network failure (server down, no internet, DNS issue)
        console.error('PDF network error:', networkErr);
        throw new Error('Cannot reach the server. Check your internet connection.');
    }

    // 401 = session expired
    if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
    }

    // 403 = CSRF missing/invalid
    if (response.status === 403) {
        throw new Error('Permission denied. Please refresh the page and try again.');
    }

    // 404 = document not found
    if (response.status === 404) {
        throw new Error('Document not found. It may have been deleted.');
    }

    // 500+ = server error
    if (response.status >= 500) {
        throw new Error('Server error while generating PDF. Please try again.');
    }

    // Any other non-OK
    if (!response.ok) {
        let serverMessage = `Failed to fetch PDF (${response.status})`;
        try {
            const err = await response.json();
            if (err?.message) serverMessage = err.message;
        } catch {
            // response body wasn't JSON — ignore
        }
        throw new Error(serverMessage);
    }

    // Verify the response is actually a PDF
    const contentType = response.headers.get('content-type') || '';
    const blob = await response.blob();

    // Content-Type check
    if (contentType.includes('pdf')) {
        return blob;
    }

    // Fallback: check the magic bytes (%PDF at the start of the blob)
    // Some proxies strip the Content-Type header, so this is a safety net.
    const header = await blob.slice(0, 5).text();
    if (header === '%PDF-') {
        return blob;
    }

    // Not a PDF — probably an HTML error page or JSON
    console.error('Unexpected PDF response:', {
        contentType,
        header: header.slice(0, 100),
        size: blob.size
    });
    throw new Error('Server did not return a valid PDF. Please try again.');
};

/**
 * Download a PDF (triggers a browser file save).
 *
 * @param {string} endpoint - e.g. '/receipts/abc123/pdf'
 * @param {string} filename - e.g. 'REC-001.pdf'
 * @param {Function} [onStart] - optional callback fired before download
 * @param {Function} [onFinish] - optional callback fired after download (success or fail)
 * @returns {Promise<void>}
 * @throws {Error} if the download fails (caller should catch and show a message)
 */
export const downloadPDF = async (endpoint, filename, onStart, onFinish) => {
    if (onStart) onStart();

    try {
        const blob = await fetchPdfBlob(endpoint);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'document.pdf';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke after a short delay to ensure the download has started
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error('PDF download failed:', error);
        throw error;    // ← re-throw so the caller can handle
    } finally {
        if (onFinish) onFinish();
    }
};

/**
 * Open a PDF inline in a new browser tab.
 *
 * @param {string} endpoint - e.g. '/receipts/abc123/pdf'
 * @returns {Promise<void>}
 * @throws {Error} if the PDF can't be loaded
 */
export const viewPDF = async (endpoint) => {
    try {
        const blob = await fetchPdfBlob(endpoint);
        const url = window.URL.createObjectURL(blob);

        const newTab = window.open(url, '_blank');
        if (!newTab) {
            // Popup was blocked
            window.URL.revokeObjectURL(url);
            throw new Error('Please allow popups to view the PDF.');
        }

        // Keep the URL alive for 60s so the tab can fully render
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
        console.error('PDF view failed:', error);
        throw error;
    }
};

/**
 * Print a PDF — opens it in a new tab and triggers the print dialog.
 *
 * @param {string} endpoint - e.g. '/receipts/abc123/pdf'
 * @returns {Promise<void>}
 * @throws {Error} if the PDF can't be loaded
 */
export const printPDF = async (endpoint) => {
    try {
        const blob = await fetchPdfBlob(endpoint);
        const url = window.URL.createObjectURL(blob);

        const printWindow = window.open(url, '_blank');
        if (!printWindow) {
            window.URL.revokeObjectURL(url);
            throw new Error('Please allow popups to print the PDF.');
        }

        printWindow.addEventListener('load', () => {
            setTimeout(() => {
                try {
                    printWindow.print();
                } catch (err) {
                    console.error('Print failed:', err);
                }
            }, 500);
        });

        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
        console.error('PDF print failed:', error);
        throw error;
    }
};