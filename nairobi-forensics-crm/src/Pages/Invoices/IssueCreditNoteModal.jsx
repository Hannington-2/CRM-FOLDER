// src/Pages/Invoices/IssueCreditNoteModal.jsx
import { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import './IssueCreditNoteModal.css';

const REASONS = [
    { value: 'data_entry_error', label: 'Data Entry Error' },
    { value: 'discount', label: 'Discount' },
    { value: 'service_not_rendered', label: 'Service Not Rendered' },
    { value: 'client_complaint', label: 'Client Complaint' },
    { value: 'billing_adjustment', label: 'Billing Adjustment' },
    { value: 'other', label: 'Other' }
];

const IssueCreditNoteModal = ({ invoice, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        amount: '',
        reason: 'data_entry_error',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const invoiceTotal = invoice?.total || 0;
    const alreadyCredited = invoice?.totalCredited || 0;
    const netTotal = invoice?.netTotal ?? invoiceTotal;
    const maxCreditable = invoiceTotal - alreadyCredited;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const amount = Number(form.amount);
        if (!amount || amount <= 0) {
            setError('Enter a credit amount greater than zero');
            return;
        }

        if (amount > maxCreditable) {
            setError(`Amount exceeds remaining creditable balance of ${formatKES(maxCreditable)}`);
            return;
        }

        if (!form.reason) {
            setError('Please select a reason');
            return;
        }

        setLoading(true);

        try {
            const result = await apiFetch('/credit-notes', {
                method: 'POST',
                body: {
                    invoice: invoice._id,
                    amount,
                    reason: form.reason,
                    notes: form.notes
                }
            });
            onSuccess(result);
        } catch (err) {
            setError(err.message || 'Failed to issue credit note');
        } finally {
            setLoading(false);
        }
    };

    const previewNet = maxCreditable > 0 && form.amount
        ? netTotal - Number(form.amount)
        : netTotal;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal credit-note-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Issue Credit Note</h2>
                        <span className="credit-note-subtitle">
                            Invoice {invoice.invoiceNumber}
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Warning banner */}
                    <div className="credit-note-warning">
                        <FaExclamationTriangle />
                        <div>
                            <strong>This is a legal financial adjustment.</strong>
                            <p>
                                Credit notes cannot be deleted — they can only be cancelled.
                                A credit note number will be generated and recorded permanently.
                            </p>
                        </div>
                    </div>

                    {/* Invoice summary */}
                    <div className="credit-note-summary">
                        <div className="summary-row">
                            <span>Original Invoice Total</span>
                            <strong>{formatKES(invoiceTotal)}</strong>
                        </div>
                        {alreadyCredited > 0 && (
                            <div className="summary-row muted">
                                <span>Already Credited</span>
                                <strong>− {formatKES(alreadyCredited)}</strong>
                            </div>
                        )}
                        <div className="summary-row">
                            <span>Current Net Total</span>
                            <strong>{formatKES(netTotal)}</strong>
                        </div>
                        <div className="summary-row highlight">
                            <span>Remaining Creditable</span>
                            <strong>{formatKES(maxCreditable)}</strong>
                        </div>
                    </div>

                    {maxCreditable <= 0 ? (
                        <div className="credit-note-error">
                            This invoice has already been fully credited. No further credit notes can be issued.
                        </div>
                    ) : (
                        <>
                            {/* Amount */}
                            <div className="input-group">
                                <label htmlFor="amount">Credit Amount (KES) *</label>
                                <input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={maxCreditable}
                                    value={form.amount}
                                    onChange={handleChange}
                                    placeholder="e.g. 5000"
                                    required
                                    autoFocus
                                />
                                <small className="field-hint">
                                    Maximum: {formatKES(maxCreditable)}
                                </small>
                            </div>

                            {/* Reason */}
                            <div className="input-group">
                                <label htmlFor="reason">Reason *</label>
                                <select
                                    id="reason"
                                    name="reason"
                                    value={form.reason}
                                    onChange={handleChange}
                                    required
                                >
                                    {REASONS.map(r => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="input-group">
                                <label htmlFor="notes">Additional Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Explain what was wrong (e.g. 'Entered 450,000 instead of 45,000')"
                                />
                            </div>

                            {/* Preview */}
                            {form.amount && Number(form.amount) > 0 && (
                                <div className="credit-note-preview">
                                    <span>New Net Total After Credit</span>
                                    <strong className="preview-value">
                                        {formatKES(previewNet)}
                                    </strong>
                                </div>
                            )}
                        </>
                    )}

                    {error && <div className="modal-error">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-danger"
                            disabled={loading || maxCreditable <= 0}
                        >
                            {loading ? 'Issuing...' : 'Issue Credit Note'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IssueCreditNoteModal;