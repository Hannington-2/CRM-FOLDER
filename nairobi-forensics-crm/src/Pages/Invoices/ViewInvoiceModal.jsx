// src/Pages/Invoices/ViewInvoiceModal.jsx
import { useState, useEffect } from 'react';
import { FaTimes, FaPrint, FaMoneyBillWave } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import PaymentModal from './PaymentModal';
import './ViewInvoiceModal.css';

const ViewInvoiceModal = ({ invoiceId, onClose, onRefresh }) => {
    const [invoice, setInvoice] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const [inv, allPayments] = await Promise.all([
                apiFetch(`/invoices/${invoiceId}`),
                apiFetch('/payments')
            ]);
            setInvoice(inv);
            setPayments(allPayments.filter(p => p.invoice?._id === invoiceId && p.status === 'active'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [invoiceId]);

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-KE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

    const handlePrint = () => window.print();

    const handlePaymentSuccess = () => {
        setPaymentOpen(false);
        load();
        if (onRefresh) onRefresh();
    };

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

    if (!invoice) return null;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal view-invoice-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div>
                            <h2>{invoice.invoiceNumber}</h2>
                            <span className={`status-badge ${invoice.status}`}>
                                {invoice.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="header-actions">
                            <button className="icon-action" onClick={handlePrint} title="Print">
                                <FaPrint />
                            </button>
                            <button className="close-btn" onClick={onClose}>
                                <FaTimes />
                            </button>
                        </div>
                    </div>

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
                                {invoice.items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.description}</td>
                                        <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'right' }}>{formatKES(item.unitPrice)}</td>
                                        <td style={{ textAlign: 'right' }}>{formatKES(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

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
                            <div className="total-line paid">
                                <span>Paid</span>
                                <span>- {formatKES(invoice.totalPaid)}</span>
                            </div>
                            <div className="total-line balance">
                                <span>Balance Due</span>
                                <span>{formatKES(invoice.balance)}</span>
                            </div>
                        </div>

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
                                                    {p.method.replace('_', ' ')}
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

                    {/* Footer with actions */}
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={onClose}>Close</button>
                            <button
                                className="btn-primary"
                                onClick={() => setPaymentOpen(true)}
                            >
                                <FaMoneyBillWave /> Record Payment
                            </button>
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
        </>
    );
};

export default ViewInvoiceModal;