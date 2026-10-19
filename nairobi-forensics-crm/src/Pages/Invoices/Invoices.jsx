// src/Pages/Invoices/invoices.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEye, FaTrash, FaFileInvoiceDollar } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import InvoiceModal from './InvoiceModal';
import ViewInvoiceModal from './ViewInvoiceModal';
import './Invoices.css';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState(null);
    const [pendingCancel, setPendingCancel] = useState(null);
    const { showToast } = useNotifications();

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/invoices');
            setInvoices(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    // Filter and search
    useEffect(() => {
        let result = [...invoices];

        if (statusFilter !== 'all') {
            result = result.filter(inv => inv.status === statusFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(inv =>
                inv.invoiceNumber?.toLowerCase().includes(q) ||
                inv.client?.name?.toLowerCase().includes(q)
            );
        }

        setFiltered(result);
    }, [search, statusFilter, invoices]);

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE')}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-KE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

    const handleCancel = async () => {
        if (!pendingCancel) return;
        const invoice = pendingCancel;
        setPendingCancel(null);
        try {
            await apiFetch(`/invoices/${invoice._id}`, { method: 'DELETE' });
            loadInvoices();
            showToast({ type: 'ui_success', title: 'Invoice cancelled', message: `${invoice.invoiceNumber} was cancelled.` });
        } catch (err) {
            showToast({ type: 'ui_error', title: 'Cancellation failed', message: err.message });
        }
    };

    // Summary stats
    const stats = {
        total: invoices.reduce((sum, i) => sum + (i.status !== 'cancelled' ? i.total : 0), 0),
        paid: invoices.reduce((sum, i) => sum + i.totalPaid, 0),
        outstanding: invoices.reduce((sum, i) => sum + (i.status !== 'cancelled' ? i.balance : 0), 0)
    };

    return (
        <div className="invoices-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Invoices</h1>
                    <p>Create and manage client invoices</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                    <FaPlus /> New Invoice
                </button>
            </div>

            {/* Stats Summary */}
            <div className="invoice-stats">
                <div className="mini-stat">
                    <span className="mini-label">Total Invoiced</span>
                    <span className="mini-value">{formatKES(stats.total)}</span>
                </div>
                <div className="mini-stat green">
                    <span className="mini-label">Total Paid</span>
                    <span className="mini-value">{formatKES(stats.paid)}</span>
                </div>
                <div className="mini-stat red">
                    <span className="mini-label">Outstanding</span>
                    <span className="mini-value">{formatKES(stats.outstanding)}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by invoice number or client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <span className="result-count">
                    {filtered.length} {filtered.length === 1 ? 'invoice' : 'invoices'}
                </span>
            </div>

            {/* Table */}
            <div className="panel">
                {loading ? (
                    <p className="empty-state">Loading invoices...</p>
                ) : error ? (
                    <p className="empty-state error">{error}</p>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <FaFileInvoiceDollar size={40} />
                        <p>
                            {search || statusFilter !== 'all'
                                ? 'No invoices match your filters.'
                                : 'No invoices yet. Click "New Invoice" to create your first one.'}
                        </p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Client</th>
                                <th>Issue Date</th>
                                <th>Due Date</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th style={{ textAlign: 'right' }}>Balance</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(inv => (
                                <tr key={inv._id}>
                                    <td><strong>{inv.invoiceNumber}</strong></td>
                                    <td>{inv.client?.name || '—'}</td>
                                    <td>{formatDate(inv.issueDate)}</td>
                                    <td>{formatDate(inv.dueDate)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatKES(inv.total)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <strong>{formatKES(inv.balance)}</strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${inv.status}`}>
                                            {inv.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="icon-btn view"
                                                onClick={() => setViewingInvoice(inv._id)}
                                                aria-label="View invoice"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                onClick={() => setPendingCancel(inv)}
                                                aria-label="Cancel invoice"
                                                disabled={inv.status === 'paid' || inv.status === 'cancelled' || inv.totalPaid > 0}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {createOpen && (
                <InvoiceModal
                    onClose={() => setCreateOpen(false)}
                    onSuccess={() => { setCreateOpen(false); loadInvoices(); }}
                />
            )}
            {viewingInvoice && (
                <ViewInvoiceModal
                    invoiceId={viewingInvoice}
                    onClose={() => setViewingInvoice(null)}
                    onRefresh={loadInvoices}
                />
            )}
            {pendingCancel && (
                <ConfirmDialog
                    title="Cancel this invoice?"
                    message={`Cancel invoice ${pendingCancel.invoiceNumber}? This action cannot be undone.`}
                    confirmLabel="Cancel invoice"
                    onCancel={() => setPendingCancel(null)}
                    onConfirm={handleCancel}
                />
            )}
        </div>
    );
};

export default Invoices;