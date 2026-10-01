// src/Pages/Receipts/receipts.jsx
import { useState, useEffect } from 'react';
import { FaSearch, FaReceipt, FaEye } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import ViewReceiptModal from './ViewReceiptModal';
import './receipts.css';

const Receipts = () => {
    const [receipts, setReceipts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingId, setViewingId] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/receipts');
            setReceipts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(receipts);
        } else {
            const q = search.toLowerCase();
            setFiltered(receipts.filter(r =>
                r.receiptNumber?.toLowerCase().includes(q) ||
                r.client?.name?.toLowerCase().includes(q) ||
                r.invoice?.invoiceNumber?.toLowerCase().includes(q)
            ));
        }
    }, [search, receipts]);

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-KE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

    return (
        <div className="receipts-page">
            <div className="page-header">
                <div>
                    <h1>Receipts</h1>
                    <p>All receipts automatically generated from payments</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by receipt #, client, or invoice..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <span className="result-count">
                    {filtered.length} {filtered.length === 1 ? 'receipt' : 'receipts'}
                </span>
            </div>

            <div className="panel">
                {loading ? (
                    <p className="empty-state">Loading receipts...</p>
                ) : error ? (
                    <p className="empty-state error">{error}</p>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <FaReceipt size={40} />
                        <p>No receipts yet. Receipts auto-generate when payments are recorded.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Receipt #</th>
                                <th>Issued Date</th>
                                <th>Client</th>
                                <th>Invoice</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r._id}>
                                    <td><strong>{r.receiptNumber}</strong></td>
                                    <td>{formatDate(r.issuedDate)}</td>
                                    <td>{r.client?.name || '—'}</td>
                                    <td>{r.invoice?.invoiceNumber || '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <strong>{formatKES(r.amount)}</strong>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="icon-btn view"
                                                onClick={() => setViewingId(r._id)}
                                                title="View Receipt"
                                            >
                                                <FaEye />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {viewingId && (
                <ViewReceiptModal
                    receiptId={viewingId}
                    onClose={() => setViewingId(null)}
                />
            )}
        </div>
    );
};

export default Receipts;