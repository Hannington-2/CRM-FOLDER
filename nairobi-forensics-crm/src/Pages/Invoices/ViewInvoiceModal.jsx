// src/Pages/Invoices/ViewInvoiceModal.jsx
import { useState, useEffect } from 'react';
import { FaTimes, FaPrint, FaMoneyBillWave, FaDownload, FaMinusCircle } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { downloadPDF } from '../../utils/pdfDownload';
import PaymentModal from './PaymentModal';
import IssueCreditNoteModal from './IssueCreditNoteModal';
import './ViewInvoiceModal.css';

// Guard helper — anything that isn't a 24-char hex string is rejected
const isValidId = (id) => {
    if (!id || typeof id !== 'string') return false;
    if (id === 'undefined' || id === 'null' || id === '') return false;
    return /^[a-fA-F0-9]{24}$/.test(id);
};

const ViewInvoiceModal = ({ invoiceId, onClose, onRefresh }) => {
    const [invoice, setInvoice] = useState(null);
    const [payments, setPayments] = useState([]);
    const [creditNotes, setCreditNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [creditOpen, setCreditOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const { showToast } = useNotifications();

    // ====== LOAD INVOICE + RELATED DATA ======
    const load = async () => {
        // HARD GUARD: never fire a request with a bad ID
        if (!isValidId(invoiceId)) {
            console.warn('ViewInvoiceModal: refusing to load — invalid invoiceId:', invoiceId);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [inv, allPayments, allCredits] = await Promise.all([
                apiFetch(`/invoices/${invoiceId}`),
                apiFetch('/payments'),
                apiFetch('/credit-notes')
            ]);

            setInvoice(inv);
            setPayments(
                (allPayments || []).filter(
                    p => p.invoice?._id === invoiceId && p.status === 'active'
                )
            );
            setCreditNotes(
                (allCredits || []).filter(
                    c => c.invoice?._id === invoiceId && c.status === 'active'
                )
            );
        } catch (err) {
            console.error('Failed to load invoice:', err);
            setInvoice(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔍 ViewInvoiceModal mounted with invoiceId:', invoiceId, '(type:', typeof invoiceId, ')');
        if (isValidId(invoiceId)) {
            load();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    // ====== FORMATTERS ======
    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-KE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

    // ====== ACTIONS ======
    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        if (!invoice || !isValidId(invoiceId)) return;
        setDownloading(true);
        try {
            await downloadPDF(
                `/invoices/${invoiceId}/pdf`,
                `${invoice.invoiceNumber || 'invoice'}.pdf`
            );
            showToast({ type: 'ui_success', title: 'Download ready', message: 'Your invoice PDF has been downloaded.' });
        } catch (err) {
            showToast({ type: 'ui_error', title: 'Download failed', message: err.message });
        } finally {
            setDownloading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentOpen(false);
        load();
        if (onRefresh) onRefresh();
    };

    const handleCreditSuccess = () => {
        setCreditOpen(false);
        load();
        if (onRefresh) onRefresh();
    };

    // ====== LOADING STATE ======
    if (loading) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal view-invoice-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-body">
                        <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ====== ERROR / NO INVOICE ======
    if (!invoice) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal view-invoice-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Invoice</h2>
                        <button className="close-btn" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="modal-body">
                        <p style={{ textAlign: 'center', padding: '40px', color: '#c62828' }}>
                            Invoice could not be loaded. It may have been deleted or the ID is invalid.
                        </p>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    const hasCredits = (invoice.totalCredited || 0) > 0;
    const netTotal = invoice.netTotal ?? invoice.total;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal view-invoice-modal" onClick={e => e.stopPropagation()}>

                    {/* ===== HEADER ===== */}
                    <div className="modal-header">
                        <div>
                            <h2>{invoice.invoiceNumber}</h2>
                            <span className={`status-badge ${invoice.status}`}>
                                {invoice.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="header-actions">
                            <button
                                className="icon-action"
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                                aria-label="Download invoice PDF"
                            >
                                <FaDownload />
                            </button>
                            <button className="icon-action" onClick={handlePrint} aria-label="Print invoice">
                                <FaPrint />
                            </button>
                            <button className="close-btn" onClick={onClose} aria-label="Close invoice details">
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {/* ===== BODY ===== */}
                    <div className="modal-body">
                        {/* Invoice Header */}
                        <div className="invoice-header">
                            <div>
                                <p className="label">Bill To</p>
                                <h3>{invoice.client?.name}</h3>
                                {invoice.client?.email && <p>{invoice.client.email}</p>}
                                {invoice.client?.phone && <p>{invoice.client.phone}</p>}
                                {invoice.client?.address?.city && (
                                    <p>{invoice.client.address.city}, {invoice.client.address.country}</p>
                                )}
                                {invoice.client?.kraPin && <p>KRA PIN: {invoice.client.kraPin}</p>}
                            </div>
                            <div className="invoice-meta">
                                <div>
                                    <span className="label">Issue Date</span>
                                    <span>{formatDate(invoice.issueDate)}</span>
                                </div>
                                <div>
                                    <span className="label">Due Date</span>
                                    <span>{formatDate(invoice.dueDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="invoice-items-wrap">
                            <table className="invoice-items">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th style={{ textAlign: 'right' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.items || []).map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.description}</td>
                                            <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{formatKES(item.unitPrice)}</td>
                                            <td style={{ textAlign: 'right' }}>{formatKES(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="invoice-totals">
                            <div className="total-line">
                                <span>Subtotal</span>
                                <span>{formatKES(invoice.subtotal)}</span>
                            </div>
                            <div className="total-line">
                                <span>Tax ({invoice.taxRate}%)</span>
                                <span>{formatKES(invoice.taxAmount)}</span>
                            </div>
                            <div className="total-line grand">
                                <span>Total</span>
                                <span>{formatKES(invoice.total)}</span>
                            </div>

                            {hasCredits && (
                                <>
                                    <div className="total-line credit-note-line">
                                        <span>Credit Notes Applied</span>
                                        <span>− {formatKES(invoice.totalCredited)}</span>
                                    </div>
                                    <div className="total-line net-total">
                                        <span>Net Total</span>
                                        <span>{formatKES(netTotal)}</span>
                                    </div>
                                </>
                            )}

                            <div className="total-line paid">
                                <span>Paid</span>
                                <span>− {formatKES(invoice.totalPaid)}</span>
                            </div>
                            <div className="total-line balance">
                                <span>Balance Due</span>
                                <span>{formatKES(invoice.balance)}</span>
                            </div>
                        </div>

                        {/* Credit Notes Section */}
                        {creditNotes.length > 0 && (
                            <div className="credit-notes-section">
                                <h3>
                                    <FaMinusCircle /> Credit Notes ({creditNotes.length})
                                </h3>
                                <table className="credit-notes-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Ref</th>
                                            <th>Reason</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {creditNotes.map(cn => (
                                            <tr key={cn._id}>
                                                <td>{formatDate(cn.issuedAt || cn.createdAt)}</td>
                                                <td><strong>{cn.creditNoteNumber}</strong></td>
                                                <td style={{ textTransform: 'capitalize' }}>
                                                    {(cn.reason || '').replace('_', ' ')}
                                                </td>
                                                <td style={{ textAlign: 'right' }} className="credit-amount">
                                                    − {formatKES(cn.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="invoice-notes">
                                <p className="label">Notes</p>
                                <p>{invoice.notes}</p>
                            </div>
                        )}

                        {/* Payment History */}
                        <div className="payment-history">
                            <h3>Payment History ({payments.length})</h3>
                            {payments.length === 0 ? (
                                <p className="no-payments">No payments recorded yet.</p>
                            ) : (
                                <table className="payment-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Ref</th>
                                            <th>Method</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p._id}>
                                                <td>{formatDate(p.paymentDate)}</td>
                                                <td><strong>{p.paymentNumber}</strong></td>
                                                <td style={{ textTransform: 'capitalize' }}>
                                                    {(p.method || '').replace('_', ' ')}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {formatKES(p.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* ===== FOOTER ===== */}
                    {invoice.status !== 'cancelled' && (
                        <div className="modal-footer invoice-footer">
                            <button className="btn-secondary" onClick={onClose}>Close</button>

                            {invoice.status !== 'paid' && (invoice.totalCredited || 0) < invoice.total && (
                                <button
                                    className="btn-outline-danger"
                                    onClick={() => setCreditOpen(true)}
                                    title="Issue a credit note to adjust the invoice"
                                >
                                    <FaMinusCircle /> Credit Note
                                </button>
                            )}

                            {invoice.status !== 'paid' && (
                                <button
                                    className="btn-primary"
                                    onClick={() => setPaymentOpen(true)}
                                >
                                    <FaMoneyBillWave /> Record Payment
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {paymentOpen && (
                <PaymentModal
                    invoice={invoice}
                    onClose={() => setPaymentOpen(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {/* Credit Note Modal */}
            {creditOpen && (
                <IssueCreditNoteModal
                    invoice={invoice}
                    onClose={() => setCreditOpen(false)}
                    onSuccess={handleCreditSuccess}
                />
            )}
        </>
    );
};

export default ViewInvoiceModal;