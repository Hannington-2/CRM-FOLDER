// src/utils/excelDownload.js
import { getApiUrl } from './apiConfig';

export const downloadExcel = async (endpoint, fallbackFilename, onStart, onFinish) => {
    if (onStart) onStart();

    try {
        const response = await fetch(`${getApiUrl()}${endpoint}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Session expired.');
        }

        if (!response.ok) {
            let message = `Failed to export (${response.status})`;
            try {
                const err = await response.json();
                if (err?.message) message = err.message;
            } catch { /* ignore */ }
            throw new Error(message);
        }

        // Try to extract filename from Content-Disposition
        let filename = fallbackFilename || 'export.xlsx';
        const disposition = response.headers.get('content-disposition') || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error('Excel download failed:', error);
        throw error;
    } finally {
        if (onFinish) onFinish();
    }
};