// src/Pages/Receipts/ViewReceiptModal.jsx
import { useState, useEffect } from 'react';
import { FaTimes, FaPrint, FaDownload } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { downloadPDF } from '../../utils/pdfDownload';
import './ViewReceiptModal.css';

const ViewReceiptModal = ({ receiptId, onClose }) => {
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const { showToast } = useNotifications();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch(`/receipts/${receiptId}`);
                setReceipt(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [receiptId]);

    const formatKES = (amount) =>
        `KSh ${Number(amount || 0).toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const formatKESNoDecimal = (amount) =>
        `KSh ${Number(amount || 0).toLocaleString('en-KE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

    const formatDateTime = (date) =>
        new Date(date).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });

    const handlePrint = () => window.print();

    const handleDownload = async () => {
        if (!receipt) return;
        setDownloading(true);
        try {
            await downloadPDF(
                `/receipts/${receiptId}/pdf`,
                `${receipt.receiptNumber || 'receipt'}.pdf`
            );
            showToast({ type: 'ui_success', title: 'Download ready', message: 'Your receipt PDF has been downloaded.' });
        } catch (err) {
            showToast({ type: 'ui_error', title: 'Download failed', message: err.message });
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal receipt-modal">
                    <div className="modal-body">
                        <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!receipt) return null;

    const invoiceTotal = receipt.invoice?.total || 0;
    const amountPaid = receipt.amount || 0;
    const balanceDue = invoiceTotal - amountPaid;
    const isPaidInFull = balanceDue <= 0.01;
    const paymentMethod = (receipt.payment?.method || '').replace('_', ' ');

    const serviceDescription = receipt.invoice?.items?.[0]?.description
        || 'Forensic Accounting and Reviews';

    const sourceInvoiceDate = receipt.invoice?.createdAt || receipt.invoice?.issueDate;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal receipt-modal" onClick={e => e.stopPropagation()}>

                <div className="receipt-toolbar no-print">
                    <button
                        className="toolbar-btn"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        <FaDownload /> {downloading ? 'Downloading...' : 'Download PDF'}
                    </button>
                    <button className="toolbar-btn" onClick={handlePrint}>
                        <FaPrint /> Print
                    </button>
                    <button className="toolbar-btn close" onClick={onClose}>
                        <FaTimes /> Close
                    </button>
                </div>

                <div className="receipt-paper">
                    <div className="receipt-header">
                        <div className="receipt-logo-row">
                            <img
                                src="/Nairobi-Forensics-LLP-Logo.webp"
                                alt="Nairobi Forensics LLP"
                                className="receipt-logo"
                            />
                        </div>

                        <div className="receipt-header-grid">
                            <div className="header-cell">
                                <span className="field-label">RECEIPT NO.</span>
                                <span className="field-value-mono">{receipt.receiptNumber}</span>
                            </div>
                            <div className="header-cell">
                                <span className="field-label">DATE RECEIVED</span>
                                <span className="field-value-mono">{formatDate(receipt.issuedDate)}</span>
                            </div>
                            <div className="header-cell">
                                <span className="field-label">METHOD</span>
                                <span className="field-value capitalize">{paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    <div className="receipt-section">
                        <span className="field-label">RECEIVED BY</span>
                        <p className="section-main-text">
                            Nairobi Forensics Limited Liability Partnership
                        </p>
                    </div>

                    <div className="receipt-section">
                        <span className="field-label">PAYMENT FOR</span>
                        <p className="section-main-text">{serviceDescription}</p>
                        <p className="payment-amount-line">{formatKES(amountPaid)}</p>
                        <p className="payment-reference">
                            Ref. Invoice {receipt.invoice?.invoiceNumber}
                            {receipt.invoice?.issueDate && ` · Dated ${formatDate(receipt.invoice.issueDate)}`}
                        </p>
                    </div>

                    <div className="summary-box">
                        <span className="summary-box-title">SUMMARY</span>

                        <div className="summary-two-col">
                            <div className="summary-left">
                                <div className="summary-line">
                                    <span className="summary-label">Invoice total</span>
                                    <span className="summary-value">{formatKES(invoiceTotal)}</span>
                                </div>
                                <div className="summary-line">
                                    <span className="summary-label capitalize">
                                        Amount paid ({paymentMethod})
                                    </span>
                                    <span className="summary-value">{formatKES(amountPaid)}</span>
                                </div>
                                <div className="summary-line">
                                    <span className="summary-label">Balance due</span>
                                    <span className="summary-value">{formatKES(balanceDue)}</span>
                                </div>
                            </div>

                            <div className="summary-right">
                                <span className="highlight-label">AMOUNT RECEIVED</span>
                                <span className="highlight-value">
                                    {formatKESNoDecimal(amountPaid)}
                                </span>
                                <span className="highlight-status">
                                    {isPaidInFull ? 'Paid in full' : 'Partially paid'}
                                    {' · '}
                                    <span className="capitalize">{paymentMethod}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="receipt-source">
                        <span className="field-label">SOURCE INVOICE</span>
                        <p className="source-value">
                            {receipt.invoice?.invoiceNumber}
                            {sourceInvoiceDate && ` Dated ${formatDateTime(sourceInvoiceDate)}`}
                        </p>
                    </div>

                    <div className="receipt-footer-note">
                        <p>This receipt confirms payment against the invoice above.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewReceiptModal;