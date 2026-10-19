// src/Pages/Clients/ClientStatement.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaFileExcel, FaPrint, FaUser,
    FaPhone, FaEnvelope, FaMapMarkerAlt, FaReceipt
} from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { downloadExcel } from '../../utils/excelDownload';
import { useNotifications } from '../../context/NotificationContext';
import './ClientStatement.css';

const ClientStatement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useNotifications();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) {
                setError('Invalid client ID');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const result = await apiFetch(`/clients/${id}/statement`);
                setData(result);
            } catch (err) {
                console.error('Failed to load statement:', err);
                setError(err.message || 'Failed to load client statement');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

    const handleExport = async () => {
        setExporting(true);
        const safeName = (data?.client?.name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        try {
            await downloadExcel(
                `/exports/client/${id}`,
                `${safeName}-Payments-${dateStr}.xlsx`
            );
            showToast({
                type: 'ui_success',
                title: 'Excel exported',
                message: `${data.client.name}'s ledger downloaded.`
            });
        } catch (err) {
            showToast({
                type: 'ui_error',
                title: 'Export failed',
                message: err.message
            });
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => window.print();

    // ============ STATES ============
    if (loading) {
        return (
            <div className="client-statement-page">
                <p className="loading">Loading statement...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="client-statement-page">
                <button className="back-btn" onClick={() => navigate('/dashboard/clients')}>
                    <FaArrowLeft /> Back to Clients
                </button>
                <div className="error-state">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { client, summary, ledger } = data;

    return (
        <div className="client-statement-page">
            {/* ===== HEADER ===== */}
            <div className="statement-header no-print">
                <button className="back-btn" onClick={() => navigate('/dashboard/clients')}>
                    <FaArrowLeft /> Back to Clients
                </button>
                <div className="header-actions">
                    <button
                        className="btn-export"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        <FaFileExcel /> {exporting ? 'Exporting...' : 'Export to Excel'}
                    </button>
                    <button className="btn-print" onClick={handlePrint}>
                        <FaPrint /> Print
                    </button>
                </div>
            </div>

            {/* ===== PRINT HEADER ===== */}
            <div className="print-only">
                <h1>Nairobi Forensics LLP</h1>
                <p>Client Financial Statement</p>
            </div>

            {/* ===== CLIENT INFO CARD ===== */}
            <div className="client-info-card">
                <div className="client-info-left">
                    <div className="client-avatar-lg">
                        {client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1>{client.name}</h1>
                        {client.code && (
                            <span className="client-code-tag">{client.code}</span>
                        )}
                    </div>
                </div>
                <div className="client-info-right">
                    {client.phone && (
                        <div className="info-row">
                            <FaPhone />
                            <span>{client.phone}</span>
                        </div>
                    )}
                    {client.email && (
                        <div className="info-row">
                            <FaEnvelope />
                            <span>{client.email}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== SUMMARY CARDS ===== */}
            <div className="summary-grid">
                <div className="summary-card">
                    <span className="summary-label">Total Invoiced</span>
                    <span className="summary-value">{formatKES(summary.totalInvoiced)}</span>
                </div>
                <div className="summary-card green">
                    <span className="summary-label">Total Paid</span>
                    <span className="summary-value">{formatKES(summary.totalPaid)}</span>
                </div>
                <div className={`summary-card ${summary.outstanding > 0 ? 'red' : 'green'}`}>
                    <span className="summary-label">Outstanding</span>
                    <span className="summary-value">{formatKES(summary.outstanding)}</span>
                </div>
                <div className={`summary-card ${summary.creditBalance > 0 ? 'blue' : ''}`}>
                    <span className="summary-label">Credit Balance</span>
                    <span className="summary-value">{formatKES(summary.creditBalance)}</span>
                </div>
            </div>

            {/* ===== LEDGER TABLE ===== */}
            <div className="ledger-panel">
                <div className="ledger-header">
                    <h2>Transaction Ledger</h2>
                    <span className="ledger-count">{ledger.length} entries</span>
                </div>

                {ledger.length === 0 ? (
                    <div className="empty-ledger">
                        <FaReceipt size={40} />
                        <p>No transactions yet</p>
                        <span>Invoices and payments will appear here once created.</span>
                    </div>
                ) : (
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Reference</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Debit</th>
                                <th style={{ textAlign: 'right' }}>Credit</th>
                                <th style={{ textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map((entry, idx) => (
                                <tr key={idx}>
                                    <td>{formatDate(entry.date)}</td>
                                    <td>
                                        <span className={`type-badge ${entry.type}`}>
                                            {entry.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td><strong>{entry.reference}</strong></td>
                                    <td>{entry.description}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {entry.debit > 0 ? formatKES(entry.debit) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="credit-col">
                                        {entry.credit > 0 ? formatKES(entry.credit) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <strong className={entry.runningBalance > 0 ? 'text-red' : 'text-green'}>
                                            {formatKES(entry.runningBalance)}
                                        </strong>
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

export default ClientStatement;