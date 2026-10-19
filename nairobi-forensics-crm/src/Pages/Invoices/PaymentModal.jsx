// src/Pages/Invoices/PaymentModal.jsx
import { useState } from 'react';
import { FaTimes, FaCheckCircle, FaDownload, FaEye, FaMoneyBillWave } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { downloadPDF, viewPDF } from '../../utils/pdfDownload';
import { generateIdempotencyKey } from '../../utils/idempotency';
import './PaymentModal.css';

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        amount: invoice.balance,
        method: 'mpesa',
        reference: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [downloading, setDownloading] = useState(false);

    // Generate idempotency key ONCE
    const [idempotencyKey] = useState(() => generateIdempotencyKey());

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;   // Guard
        setError('');

        const amount = Number(form.amount);
        if (!amount || amount <= 0) {
            return setError('Amount must be greater than zero');
        }

        setLoading(true);
        try {
            const result = await apiFetch('/payments', {
                method: 'POST',
                body: {
                    invoice: invoice._id,
                    amount,
                    method: form.method,
                    reference: form.reference,
                    notes: form.notes,
                    paymentDate: form.paymentDate,
                    idempotencyKey
                }
            });

            setReceipt(result.receipt);
            setTimeout(() => handleDownloadReceipt(result.receipt), 800);
        } catch (err) {
            if (err.message?.toLowerCase().includes('already') || err.message?.toLowerCase().includes('duplicate')) {
                setError('This payment was just recorded. Refreshing...');
                setTimeout(onSuccess, 1500);
            } else {
                setError(err.message || 'Failed to record payment');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = async (receiptData) => {
        if (!receiptData?._id) return;
        setDownloading(true);
        try {
            await downloadPDF(
                `/receipts/${receiptData._id}/pdf`,
                `${receiptData.receiptNumber || 'receipt'}.pdf`
            );
        } finally {
            setDownloading(false);
        }
    };

    const handleViewReceipt = async (receiptData) => {
        if (!receiptData?._id) return;
        try {
            await viewPDF(`/receipts/${receiptData._id}/pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    // ===== SUCCESS SCREEN =====
    if (receipt) {
        return (
            <div className="modal-backdrop">
                <div className="modal payment-success-modal">
                    <div className="success-icon-wrap">
                        <FaCheckCircle />
                    </div>
                    <h2>Payment Recorded Successfully!</h2>
                    <p className="success-subtitle">
                        Receipt <strong>{receipt.receiptNumber}</strong> has been generated.
                    </p>
                    <div className="success-amount-block">
                        <span className="success-label">Amount Received</span>
                        <span className="success-amount">{formatKES(receipt.amount)}</span>
                    </div>
                    <div className="success-receipt-info">
                        <div className="receipt-info-row">
                            <span>Receipt No.</span>
                            <strong>{receipt.receiptNumber}</strong>
                        </div>
                        <div className="receipt-info-row">
                            <span>Invoice</span>
                            <strong>{invoice.invoiceNumber}</strong>
                        </div>
                        <div className="receipt-info-row">
                            <span>Client</span>
                            <strong>{invoice.client?.name}</strong>
                        </div>
                    </div>
                    <div className="success-download-hint">
                        <FaDownload />
                        <span>Your receipt is being downloaded automatically...</span>
                    </div>
                    <div className="success-actions">
                        <button className="btn-view-receipt" onClick={() => handleViewReceipt(receipt)}>
                            <FaEye /> View Receipt
                        </button>
                        <button className="btn-download-receipt" onClick={() => handleDownloadReceipt(receipt)} disabled={downloading}>
                            <FaDownload /> {downloading ? 'Downloading...' : 'Download Again'}
                        </button>
                    </div>
                    <button className="btn-done" onClick={onSuccess}>
                        Done
                    </button>
                </div>
            </div>
        );
    }

    // ===== PAYMENT FORM =====
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Record Payment</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close payment form"><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="payment-summary">
                        <div>
                            <span className="label">Invoice</span>
                            <span>{invoice.invoiceNumber}</span>
                        </div>
                        <div>
                            <span className="label">Client</span>
                            <span>{invoice.client?.name}</span>
                        </div>
                        <div>
                            <span className="label">Total</span>
                            <span>{formatKES(invoice.netTotal ?? invoice.total)}</span>
                        </div>
                        <div>
                            <span className="label">Already Paid</span>
                            <span className="paid">{formatKES(invoice.totalPaid)}</span>
                        </div>
                        <div>
                            <span className="label">Outstanding</span>
                            <span className="outstanding">{formatKES(invoice.balance)}</span>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Payment Amount (KES) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={form.amount}
                                onChange={handleChange}
                                min="1"
                                step="0.01"
                                required
                            />
                            <small className="field-hint">
                                Outstanding: {formatKES(invoice.balance)}
                                {Number(form.amount) > invoice.balance && (
                                    <span style={{ color: '#f59e0b', marginLeft: 8 }}>
                                        ⚠️ Excess will be credited
                                    </span>
                                )}
                            </small>
                        </div>
                        <div className="form-group">
                            <label>Payment Date</label>
                            <input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Payment Method *</label>
                            <select name="method" value={form.method} onChange={handleChange} required>
                                <option value="mpesa">M-Pesa</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="cheque">Cheque</option>
                                <option value="card">Card</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Reference Number</label>
                            <input type="text" name="reference" value={form.reference} onChange={handleChange} placeholder="e.g. QWE123456" />
                        </div>
                    </div>

                    <div className="form-group full">
                        <label>Notes</label>
                        <textarea name="notes" value={form.notes} onChange={handleChange} rows="2" placeholder="Optional notes..." />
                    </div>

                    {error && <div className="modal-error">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            <FaMoneyBillWave /> {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;