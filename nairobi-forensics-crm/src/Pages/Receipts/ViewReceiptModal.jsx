// src/Pages/Receipts/ViewReceiptModal.jsx
import { useState, useEffect } from 'react';
import { FaTimes, FaPrint } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import './ViewReceiptModal.css';

const ViewReceiptModal = ({ receiptId, onClose }) => {
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

    const formatDateTime = (date) =>
        new Date(date).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

    const handlePrint = () => window.print();

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
    const clientName = receipt.invoice?.client?.name || receipt.client?.name || '';

    // Get payment description (first item description from invoice)
    const serviceDescription = receipt.invoice?.items?.[0]?.description
        || 'Forensic Accounting and Reviews';

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal receipt-modal" onClick={e => e.stopPropagation()}>

                {/* Toolbar */}
                <div className="receipt-toolbar no-print">
                    <button className="toolbar-btn" onClick={handlePrint}>
                        <FaPrint /> Print
                    </button>
                    <button className="toolbar-btn close" onClick={onClose}>
                        <FaTimes /> Close
                    </button>
                </div>

                {/* RECEIPT PAPER */}
                <div className="receipt-paper">

                    {/* Header: logo + title */}
                    <div className="receipt-title-row">
                        <img
                            src="/Nairobi-Forensics-LLP-Logo.webp"
                            alt="Nairobi Forensics LLP"
                            className="receipt-logo"
                        />
                        <div className="receipt-title-block">
                            <h1 className="receipt-title">Receipt</h1>
                            <span className="receipt-pill">Payment received</span>
                        </div>
                    </div>
                    <div className="receipt-title-rule" />

                    {/* Meta strip */}
                    <div className="receipt-meta">
                        <div className="meta-item">
                            <span className="field-label">Receipt no.</span>
                            <span className="field-value">{receipt.receiptNumber}</span>
                        </div>
                        <div className="meta-item">
                            <span className="field-label">Date received</span>
                            <span className="field-value">{formatDate(receipt.issuedDate)}</span>
                        </div>
                        <div className="meta-item meta-item-right">
                            <span className="field-label">Method</span>
                            <span className="field-value capitalize">{paymentMethod}</span>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="receipt-parties">
                        <div>
                            <span className="field-label">Received by</span>
                            <p className="party-name">Nairobi Forensics Limited</p>
                            <p className="party-name">Liability Partnership</p>
                        </div>
                        {clientName && (
                            <div>
                                <span className="field-label">Received from</span>
                                <p className="party-name">{clientName}</p>
                            </div>
                        )}
                    </div>

                    {/* Payment for */}
                    <span className="field-label">Payment for</span>
                    <div className="payment-for-box">
                        <div>
                            <p className="payment-for">{serviceDescription}</p>
                            <p className="payment-reference">
                                Ref. Invoice {receipt.invoice?.invoiceNumber}
                                {receipt.invoice?.issueDate && ` · Dated ${formatDate(receipt.invoice.issueDate)}`}
                            </p>
                        </div>
                        <span className="payment-amount">{formatKES(amountPaid)}</span>
                    </div>

                    {/* Summary + amount received */}
                    <div className="receipt-summary-row">
                        <div className="summary-list">
                            <span className="field-label">Summary</span>
                            <div className="summary-row">
                                <span className="summary-label">Invoice total</span>
                                <span className="summary-value">{formatKES(invoiceTotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label capitalize">Amount paid ({paymentMethod})</span>
                                <span className="summary-value">{formatKES(amountPaid)}</span>
                            </div>
                            <div className="summary-row summary-row-bold">
                                <span className="summary-label">Balance due</span>
                                <span className="summary-value">{formatKES(balanceDue)}</span>
                            </div>
                        </div>

                        <div className="amount-received-card">
                            <span className="highlight-label">Amount received</span>
                            <span className="highlight-value">{formatKES(amountPaid)}</span>
                            <span className="highlight-status">
                                {isPaidInFull ? 'Paid in full' : 'Partially paid'} · <span className="capitalize">{paymentMethod}</span>
                            </span>
                        </div>
                    </div>

                    {/* Source invoice */}
                    <div className="receipt-source">
                        <span className="field-label">Source invoice</span>
                        <p className="source-value">
                            {receipt.invoice?.invoiceNumber}
                            {receipt.invoice?.issueDate && `   Dated ${formatDateTime(receipt.invoice.issueDate)}`}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="receipt-footer-note">
                        <p>This receipt confirms payment against the invoice above.</p>
                        {/* <p className="footer-system">Nairobi Forensics LLP</p> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewReceiptModal;