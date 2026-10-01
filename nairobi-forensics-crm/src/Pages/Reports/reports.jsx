// src/Pages/Reports/reports.jsx
import { useState, useEffect } from 'react';
import {
    FaUsers, FaFileInvoiceDollar, FaMoneyBillWave, FaReceipt,
    FaChartLine, FaArrowUp, FaArrowDown, FaClock
} from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import './reports.css';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [clients, invoices, payments, receipts] = await Promise.all([
                    apiFetch('/clients'),
                    apiFetch('/invoices'),
                    apiFetch('/payments'),
                    apiFetch('/receipts')
                ]);

                // Filter out cancelled
                const activeInvoices = invoices.filter(i => i.status !== 'cancelled');

                // Financial totals
                const totalInvoiced = activeInvoices.reduce((s, i) => s + i.total, 0);
                const totalPaid = activeInvoices.reduce((s, i) => s + i.totalPaid, 0);
                const outstanding = activeInvoices.reduce((s, i) => s + i.balance, 0);
                const collectionRate = totalInvoiced > 0 
                    ? Math.round((totalPaid / totalInvoiced) * 100) 
                    : 0;

                // Invoices by status
                const statusCounts = activeInvoices.reduce((acc, i) => {
                    acc[i.status] = (acc[i.status] || 0) + 1;
                    return acc;
                }, {});

                // Payments by method
                const methodTotals = payments
                    .filter(p => p.status === 'active')
                    .reduce((acc, p) => {
                        const key = p.method || 'other';
                        acc[key] = (acc[key] || 0) + p.amount;
                        return acc;
                    }, {});

                // Top clients by revenue
                const clientRevenue = {};
                activeInvoices.forEach(inv => {
                    const clientName = inv.client?.name || 'Unknown';
                    if (!clientRevenue[clientName]) {
                        clientRevenue[clientName] = { invoiced: 0, paid: 0, count: 0 };
                    }
                    clientRevenue[clientName].invoiced += inv.total;
                    clientRevenue[clientName].paid += inv.totalPaid;
                    clientRevenue[clientName].count += 1;
                });

                const topClients = Object.entries(clientRevenue)
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.invoiced - a.invoiced)
                    .slice(0, 5);

                // Recent payments (last 5)
                const recentPayments = [...payments]
                    .filter(p => p.status === 'active')
                    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                    .slice(0, 5);

                // Overdue invoices
                const overdueInvoices = activeInvoices
                    .filter(i => i.status === 'overdue' || (i.balance > 0 && new Date(i.dueDate) < new Date()))
                    .slice(0, 5);

                setStats({
                    clients: clients.length,
                    invoices: activeInvoices.length,
                    payments: payments.length,
                    receipts: receipts.length,
                    totalInvoiced,
                    totalPaid,
                    outstanding,
                    collectionRate,
                    statusCounts,
                    methodTotals,
                    topClients,
                    recentPayments,
                    overdueInvoices
                });
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    const formatShort = (amount) => {
        const n = Number(amount || 0);
        if (n >= 1000000) return `KES ${(n / 1000000).toFixed(2)}M`;
        if (n >= 1000) return `KES ${(n / 1000).toFixed(1)}K`;
        return `KES ${n.toFixed(0)}`;
    };

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

    if (loading) {
        return (
            <div className="reports-page">
                <div className="page-header">
                    <h1>Reports</h1>
                    <p>Financial and operational insights</p>
                </div>
                <p className="empty-state">Loading reports...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-page">
                <div className="page-header">
                    <h1>Reports</h1>
                </div>
                <p className="empty-state error">{error}</p>
            </div>
        );
    }

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Reports</h1>
                    <p>Financial and operational insights for your firm</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon blue"><FaUsers /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Clients</span>
                        <span className="kpi-value">{stats.clients}</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon purple"><FaFileInvoiceDollar /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Invoices</span>
                        <span className="kpi-value">{stats.invoices}</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon green"><FaMoneyBillWave /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Payments</span>
                        <span className="kpi-value">{stats.payments}</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon orange"><FaReceipt /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Receipts</span>
                        <span className="kpi-value">{stats.receipts}</span>
                    </div>
                </div>
            </div>

            {/* Financial Summary + Collection Rate */}
            <div className="financial-grid">
                <div className="financial-card">
                    <div className="fin-header">
                        <h2>Financial Summary</h2>
                        <FaChartLine className="fin-icon" />
                    </div>
                    <div className="fin-rows">
                        <div className="fin-block">
                            <span className="fin-label">TOTAL INVOICED</span>
                            <span className="fin-value">{formatKES(stats.totalInvoiced)}</span>
                        </div>
                        <div className="fin-block green">
                            <span className="fin-label">TOTAL COLLECTED</span>
                            <span className="fin-value">{formatKES(stats.totalPaid)}</span>
                        </div>
                        <div className="fin-block red">
                            <span className="fin-label">OUTSTANDING</span>
                            <span className="fin-value">{formatKES(stats.outstanding)}</span>
                        </div>
                    </div>
                </div>

                <div className="collection-card">
                    <h2>Collection Rate</h2>
                    <div className="collection-circle">
                        <svg viewBox="0 0 100 100">
                            <circle
                                className="track"
                                cx="50" cy="50" r="42"
                                fill="none" strokeWidth="8"
                            />
                            <circle
                                className="progress"
                                cx="50" cy="50" r="42"
                                fill="none" strokeWidth="8"
                                strokeDasharray={`${stats.collectionRate * 2.64} 264`}
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="circle-value">{stats.collectionRate}%</div>
                    </div>
                    <p className="collection-note">
                        {stats.collectionRate}% of invoiced amounts have been collected
                    </p>
                </div>
            </div>

            {/* Two-column layout: Status + Methods */}
            <div className="two-col-grid">
                {/* Invoices by Status */}
                <div className="panel">
                    <div className="panel-header">
                        <h2>Invoices by Status</h2>
                    </div>
                    <div className="status-list">
                        {Object.keys(stats.statusCounts).length === 0 ? (
                            <p className="empty-state small">No invoices yet</p>
                        ) : (
                            Object.entries(stats.statusCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([status, count]) => (
                                    <div className="status-list-item" key={status}>
                                        <div className="status-info">
                                            <span className={`status-badge ${status}`}>
                                                {status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <span className="status-count">{count}</span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Payments by Method */}
                <div className="panel">
                    <div className="panel-header">
                        <h2>Payments by Method</h2>
                    </div>
                    <div className="method-list">
                        {Object.keys(stats.methodTotals).length === 0 ? (
                            <p className="empty-state small">No payments yet</p>
                        ) : (
                            Object.entries(stats.methodTotals)
                                .sort((a, b) => b[1] - a[1])
                                .map(([method, total]) => (
                                    <div className="method-list-item" key={method}>
                                        <div className="method-info">
                                            <span className={`method-dot ${method}`}></span>
                                            <span className="method-name">
                                                {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        </div>
                                        <span className="method-amount">{formatKES(total)}</span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>

            {/* Top Clients */}
            <div className="panel">
                <div className="panel-header">
                    <h2>Top Clients by Revenue</h2>
                </div>
                {stats.topClients.length === 0 ? (
                    <p className="empty-state small">No client data yet</p>
                ) : (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Client</th>
                                <th style={{ textAlign: 'right' }}>Invoices</th>
                                <th style={{ textAlign: 'right' }}>Total Invoiced</th>
                                <th style={{ textAlign: 'right' }}>Collected</th>
                                <th style={{ textAlign: 'right' }}>Outstanding</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topClients.map((c, i) => (
                                <tr key={i}>
                                    <td className="rank">#{i + 1}</td>
                                    <td><strong>{c.name}</strong></td>
                                    <td style={{ textAlign: 'right' }}>{c.count}</td>
                                    <td style={{ textAlign: 'right' }}>{formatKES(c.invoiced)}</td>
                                    <td style={{ textAlign: 'right' }} className="green-text">
                                        {formatKES(c.paid)}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="red-text">
                                        {formatKES(c.invoiced - c.paid)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Two-column: Recent Payments + Overdue */}
            <div className="two-col-grid">
                {/* Recent Payments */}
                <div className="panel">
                    <div className="panel-header">
                        <h2>Recent Payments</h2>
                    </div>
                    {stats.recentPayments.length === 0 ? (
                        <p className="empty-state small">No payments recorded</p>
                    ) : (
                        <div className="activity-list">
                            {stats.recentPayments.map(p => (
                                <div className="activity-item" key={p._id}>
                                    <div className="activity-icon green">
                                        <FaArrowUp />
                                    </div>
                                    <div className="activity-content">
                                        <span className="activity-title">
                                            {p.client?.name || 'Unknown client'}
                                        </span>
                                        <span className="activity-sub">
                                            {p.paymentNumber} · {formatDate(p.paymentDate)}
                                        </span>
                                    </div>
                                    <span className="activity-amount green-text">
                                        +{formatKES(p.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Overdue Invoices */}
                <div className="panel">
                    <div className="panel-header">
                        <h2>Overdue Invoices</h2>
                    </div>
                    {stats.overdueInvoices.length === 0 ? (
                        <p className="empty-state small">
                             No overdue invoices — everything is on track
                        </p>
                    ) : (
                        <div className="activity-list">
                            {stats.overdueInvoices.map(inv => (
                                <div className="activity-item" key={inv._id}>
                                    <div className="activity-icon red">
                                        <FaClock />
                                    </div>
                                    <div className="activity-content">
                                        <span className="activity-title">
                                            {inv.client?.name || 'Unknown'}
                                        </span>
                                        <span className="activity-sub">
                                            {inv.invoiceNumber} · Due {formatDate(inv.dueDate)}
                                        </span>
                                    </div>
                                    <span className="activity-amount red-text">
                                        {formatKES(inv.balance)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;