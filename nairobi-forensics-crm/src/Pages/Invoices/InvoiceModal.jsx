// src/Pages/Invoices/InvoiceModal.jsx
import { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { generateIdempotencyKey } from '../../utils/idempotency';
import './InvoiceModal.css';

const InvoiceModal = ({ onClose, onSuccess }) => {
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({
        client: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        taxRate: 16,
        notes: ''
    });
    const [items, setItems] = useState([
        { description: '', quantity: 1, unitPrice: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Generate idempotency key ONCE when modal mounts
    const [idempotencyKey] = useState(() => generateIdempotencyKey());

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch('/clients');
                setClients(data);
            } catch (err) {
                console.error('Failed to load clients', err);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const due = new Date();
        due.setDate(due.getDate() + 30);
        setForm(f => ({ ...f, dueDate: due.toISOString().split('T')[0] }));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = field === 'description' ? value : Number(value);
        setItems(updated);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, it) =>
        sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0
    );
    const taxAmount = (subtotal * Number(form.taxRate || 0)) / 100;
    const total = subtotal + taxAmount;

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;   // Guard
        setError('');

        if (!form.client) return setError('Please select a client');
        if (!form.dueDate) return setError('Please set a due date');
        if (items.some(i => !i.description || i.unitPrice <= 0)) {
            return setError('All items must have a description and a unit price');
        }

        setLoading(true);

        try {
            await apiFetch('/invoices', {
                method: 'POST',
                body: {
                    client: form.client,
                    issueDate: form.issueDate,
                    dueDate: form.dueDate,
                    taxRate: Number(form.taxRate),
                    notes: form.notes,
                    items: items.map(i => ({
                        description: i.description,
                        quantity: Number(i.quantity),
                        unitPrice: Number(i.unitPrice)
                    })),
                    idempotencyKey
                }
            });
            onSuccess();
        } catch (err) {
            if (err.message?.toLowerCase().includes('duplicate')) {
                setError('This invoice was already created. Refreshing...');
                setTimeout(onSuccess, 1500);
            } else {
                setError(err.message || 'Failed to create invoice');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal invoice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Invoice</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close invoice form">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-section">
                        <h3>Invoice Details</h3>
                        <div className="form-row">
                            <div className="form-group full">
                                <label>Client *</label>
                                <select name="client" value={form.client} onChange={handleChange} required>
                                    <option value="">Select a client...</option>
                                    {clients.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.name} {c.email ? `(${c.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Issue Date</label>
                                <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Due Date *</label>
                                <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Tax Rate (%)</label>
                                <input type="number" name="taxRate" value={form.taxRate} onChange={handleChange} min="0" max="100" step="0.01" />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-header">
                            <h3>Line Items</h3>
                            <button type="button" className="btn-add-item" onClick={addItem}>
                                <FaPlus /> Add Item
                            </button>
                        </div>

                        <div className="items-table">
                            <div className="items-header">
                                <span>Description</span>
                                <span>Qty</span>
                                <span>Unit Price</span>
                                <span>Amount</span>
                                <span></span>
                            </div>

                            {items.map((item, index) => (
                                <div className="item-row" key={index}>
                                    <input
                                        type="text"
                                        placeholder="Service description"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                    />
                                    <span className="item-amount">
                                        {formatKES((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-remove-item"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="totals-section">
                            <div className="notes-box">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Any additional notes for the client..."
                                    rows="4"
                                />
                            </div>
                            <div className="totals-box">
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>{formatKES(subtotal)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Tax ({form.taxRate}%)</span>
                                    <span>{formatKES(taxAmount)}</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>Total</span>
                                    <span>{formatKES(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <div className="modal-error">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoiceModal;