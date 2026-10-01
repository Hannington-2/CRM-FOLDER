// src/Pages/Invoices/PaymentModal.jsx
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
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

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (Number(form.amount) <= 0) return setError('Amount must be greater than zero');
        if (Number(form.amount) > invoice.balance) {
            return setError(`Amount exceeds outstanding balance of KES ${invoice.balance.toLocaleString()}`);
        }

        setLoading(true);
        try {
            const result = await apiFetch('/payments', {
                method: 'POST',
                body: {
                    invoice: invoice._id,
                    amount: Number(form.amount),
                    method: form.method,
                    reference: form.reference,
                    notes: form.notes,
                    paymentDate: form.paymentDate
                }
            });
            setReceipt(result.receipt);
            setTimeout(() => onSuccess(), 2500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    // Success screen
    if (receipt) {
        return (
            <div className="modal-backdrop">
                <div className="modal payment-modal">
                    <div className="modal-body payment-success">
                        <div className="success-icon">✓</div>
                        <h2>Payment Recorded!</h2>
                        <p>Receipt <strong>{receipt.receiptNumber}</strong> generated</p>
                        <p className="success-amount">{formatKES(receipt.amount)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Record Payment</h2>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Summary */}
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
                            <span>{formatKES(invoice.total)}</span>
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
                                max={invoice.balance}
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Payment Date</label>
                            <input
                                type="date"
                                name="paymentDate"
                                value={form.paymentDate}
                                onChange={handleChange}
                            />
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
                            <input
                                type="text"
                                name="reference"
                                value={form.reference}
                                onChange={handleChange}
                                placeholder="e.g. QWE123456"
                            />
                        </div>
                    </div>

                    <div className="form-group full">
                        <label>Notes</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Optional notes..."
                        />
                    </div>

                    {error && <div className="modal-error">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;