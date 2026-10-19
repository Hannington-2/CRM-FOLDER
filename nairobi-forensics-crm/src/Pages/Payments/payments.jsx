// src/Pages/Payments/payments.jsx
import { useState, useEffect } from 'react';
import { FaSearch, FaMoneyBillWave } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import './payments.css';
import { FaFileExcel } from 'react-icons/fa';
import { downloadExcel } from '../../utils/excelDownload';
import { useNotifications } from '../../context/NotificationContext';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { showToast } = useNotifications();

    const load = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/payments');
            setPayments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Filter
    useEffect(() => {
        let result = [...payments];
        if (methodFilter !== 'all') {
            result = result.filter(p => p.method === methodFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.paymentNumber?.toLowerCase().includes(q) ||
                p.client?.name?.toLowerCase().includes(q) ||
                p.invoice?.invoiceNumber?.toLowerCase().includes(q) ||
                p.reference?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [search, methodFilter, payments]);

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-KE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const [exporting, setExporting] = useState(false);

    const handleExportAll = async () => {
        setExporting(true);
        try {
            await downloadExcel(
                '/exports/payments',
                `All-Clients-Payments-${new Date().toISOString().split('T')[0]}.xlsx`
            );
            showToast({
                type: 'ui_success',
                title: 'Excel exported',
                message: 'The payments report was downloaded.'
            });
        } catch (err) {
            showToast({
                type: 'ui_error',
                title: 'Export failed',
                message: err.message || 'Could not export to Excel'
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="payments-page">
                <div className="page-header">
                    <div>
                        <h1>Payments</h1>
                        <p>All payments recorded across invoices</p>
                    </div>
                    <button
                        className="btn-export-excel"
                        onClick={handleExportAll}
                        disabled={exporting}
                    >
                        <FaFileExcel /> {exporting ? 'Generating...' : 'Export to Excel'}
                    </button>
            </div>

            {/* Summary */}
            <div className="invoice-stats">
                <div className="mini-stat green">
                    <span className="mini-label">Total Payments</span>
                    <span className="mini-value">{payments.length}</span>
                </div>
                <div className="mini-stat green">
                    <span className="mini-label">Total Amount</span>
                    <span className="mini-value">{formatKES(totalAmount)}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by payment #, client, invoice, or reference..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="filter-select"
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                >
                    <option value="all">All Methods</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                </select>
                <span className="result-count">
                    {filtered.length} {filtered.length === 1 ? 'payment' : 'payments'}
                </span>
            </div>

            {/* Table */}
            <div className="panel">
                {loading ? (
                    <p className="empty-state">Loading payments...</p>
                ) : error ? (
                    <p className="empty-state error">{error}</p>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <FaMoneyBillWave size={40} />
                        <p>No payments found.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Payment #</th>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Invoice</th>
                                <th>Method</th>
                                <th>Reference</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id}>
                                    <td><strong>{p.paymentNumber}</strong></td>
                                    <td>{formatDate(p.paymentDate)}</td>
                                    <td>{p.client?.name || '—'}</td>
                                    <td>{p.invoice?.invoiceNumber || '—'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>
                                        {(p.method || '').replace('_', ' ')}
                                    </td>
                                    <td>{p.reference || '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <strong>{formatKES(p.amount)}</strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${p.status === 'active' ? 'paid' : 'cancelled'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Payments;