// src/Pages/Dashboard/dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUsers, FaFileInvoiceDollar, FaMoneyBillWave, 
    FaPlus, FaArrowRight, FaClock, FaExclamationTriangle,
    FaArrowUp
} from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        clients: 0,
        invoices: 0,
        outstanding: 0,
        payments: 0,
        receipts: 0,
        totalInvoiced: 0,
        totalCollected: 0
    });
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [recentPayments, setRecentPayments] = useState([]);
    const [overdueInvoices, setOverdueInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [clients, invoices, payments, receipts] = await Promise.all([
                    apiFetch('/clients'),
                    apiFetch('/invoices'),
                    apiFetch('/payments'),
                    apiFetch('/receipts')
                ]);

                const activeInvoices = invoices.filter(i => i.status !== 'cancelled');

                const totalInvoiced = activeInvoices.reduce((s, i) => s + i.total, 0);
                const totalCollected = activeInvoices.reduce((s, i) => s + i.totalPaid, 0);
                const outstanding = activeInvoices.reduce((s, i) => s + i.balance, 0);

                setStats({
                    clients: clients.length,
                    invoices: activeInvoices.length,
                    outstanding,
                    payments: payments.length,
                    receipts: receipts.length,
                    totalInvoiced,
                    totalCollected
                });

                // Recent invoices (top 5)
                const recentInvs = [...invoices]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);
                setRecentInvoices(recentInvs);

                // Recent payments (top 5)
                const recentPays = [...payments]
                    .filter(p => p.status === 'active')
                    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                    .slice(0, 5);
                setRecentPayments(recentPays);

                // Overdue invoices
                const overdue = activeInvoices
                    .filter(i => i.balance > 0 && new Date(i.dueDate) < new Date())
                    .slice(0, 3);
                setOverdueInvoices(overdue);

            } catch (err) {
                console.error('Failed to load dashboard', err);
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getFirstName = () => user?.name?.split(' ')[0] || 'there';

    // Collection progress
    const collectionRate = stats.totalInvoiced > 0
        ? Math.round((stats.totalCollected / stats.totalInvoiced) * 100)
        : 0;

    return (
        <div className="dashboard">

            {/* ===== WELCOME BANNER ===== */}
            <div className="welcome-banner">
                <div className="welcome-text">
                    <h1>{getGreeting()}, {getFirstName()} 👋</h1>
                    <p>Here's what's happening with your firm today.</p>
                </div>
                <div className="welcome-actions">
                    <button className="welcome-btn primary" onClick={() => navigate('/dashboard/invoices')}>
                        <FaPlus /> New Invoice
                    </button>
                    <button className="welcome-btn secondary" onClick={() => navigate('/dashboard/clients')}>
                        <FaPlus /> New Client
                    </button>
                </div>
            </div>

            {/* ===== OVERDUE ALERT ===== */}
            {overdueInvoices.length > 0 && (
                <div className="overdue-alert">
                    <div className="alert-icon">
                        <FaExclamationTriangle />
                    </div>
                    <div className="alert-content">
                        <h3>You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}</h3>
                        <p>Total overdue: <strong>{formatKES(overdueInvoices.reduce((s, i) => s + i.balance, 0))}</strong></p>
                    </div>
                    <button className="alert-action" onClick={() => navigate('/dashboard/invoices')}>
                        View <FaArrowRight />
                    </button>
                </div>
            )}

            {/* ===== KPI CARDS ===== */}
            <div className="kpi-grid">
                <div className="kpi-card" onClick={() => navigate('/dashboard/clients')}>
                    <div className="kpi-icon blue"><FaUsers /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Clients</span>
                        <h3 className="kpi-value">{loading ? '—' : stats.clients}</h3>
                    </div>
                </div>

                <div className="kpi-card" onClick={() => navigate('/dashboard/invoices')}>
                    <div className="kpi-icon purple"><FaFileInvoiceDollar /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Invoices</span>
                        <h3 className="kpi-value">{loading ? '—' : stats.invoices}</h3>
                    </div>
                </div>

                <div className="kpi-card" onClick={() => navigate('/dashboard/payments')}>
                    <div className="kpi-icon green"><FaMoneyBillWave /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Collected</span>
                        <h3 className="kpi-value small">{loading ? '—' : formatShort(stats.totalCollected)}</h3>
                    </div>
                </div>

                <div className="kpi-card highlight" onClick={() => navigate('/dashboard/invoices')}>
                    <div className="kpi-icon red"><FaClock /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Outstanding</span>
                        <h3 className="kpi-value small">{loading ? '—' : formatShort(stats.outstanding)}</h3>
                    </div>
                </div>
            </div>

            {/* ===== MAIN GRID ===== */}
            <div className="main-grid">

                {/* Left: Recent Invoices + Collection Progress */}
                <div className="grid-col main-col">

                    {/* Collection Progress */}
                    <div className="panel">
                        <div className="panel-header">
                            <h2>Collection Progress</h2>
                            <span className="panel-badge">{collectionRate}%</span>
                        </div>
                        <div className="collection-progress">
                            <div className="progress-bar-track">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${collectionRate}%` }}
                                ></div>
                            </div>
                            <div className="progress-labels">
                                <span>Collected: <strong>{formatKES(stats.totalCollected)}</strong></span>
                                <span>Invoiced: <strong>{formatKES(stats.totalInvoiced)}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Invoices */}
                    <div className="panel">
                        <div className="panel-header">
                            <h2>Recent Invoices</h2>
                            <button
                                className="panel-action"
                                onClick={() => navigate('/dashboard/invoices')}
                            >
                                View all <FaArrowRight />
                            </button>
                        </div>
                        {loading ? (
                            <p className="empty-state">Loading...</p>
                        ) : recentInvoices.length === 0 ? (
                            <div className="empty-state">
                                <FaFileInvoiceDollar size={32} />
                                <p>No invoices yet</p>
                                <button className="btn-primary-sm" onClick={() => navigate('/dashboard/invoices')}>
                                    <FaPlus /> Create first invoice
                                </button>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Client</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map(inv => (
                                        <tr key={inv._id} onClick={() => navigate('/dashboard/invoices')}>
                                            <td>
                                                <strong className="mono">{inv.invoiceNumber}</strong>
                                            </td>
                                            <td>{inv.client?.name || '—'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="mono">{formatKES(inv.total)}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${inv.status}`}>
                                                    {inv.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right: Recent Payments + Quick Stats */}
                <div className="grid-col side-col">

                    {/* Recent Payments */}
                    <div className="panel">
                        <div className="panel-header">
                            <h2>Recent Payments</h2>
                            <button
                                className="panel-action"
                                onClick={() => navigate('/dashboard/payments')}
                            >
                                View <FaArrowRight />
                            </button>
                        </div>
                        {loading ? (
                            <p className="empty-state">Loading...</p>
                        ) : recentPayments.length === 0 ? (
                            <div className="empty-state">
                                <FaMoneyBillWave size={32} />
                                <p>No payments yet</p>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {recentPayments.map(p => (
                                    <div className="activity-item" key={p._id}>
                                        <div className="activity-icon green">
                                            <FaArrowUp />
                                        </div>
                                        <div className="activity-content">
                                            <span className="activity-title">
                                                {p.client?.name || 'Unknown'}
                                            </span>
                                            <span className="activity-sub">
                                                {p.paymentNumber} · {formatDate(p.paymentDate)}
                                            </span>
                                        </div>
                                        <span className="activity-amount green-text">
                                            +{formatShort(p.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    {/* <div className="panel">
                        <div className="panel-header">
                            <h2>Overview</h2>
                        </div>
                        <div className="quick-stats">
                            <div className="quick-stat">
                                <div className="qs-icon green"><FaCheckCircle /></div>
                                <div>
                                    <span className="qs-label">Payments</span>
                                    <span className="qs-value">{stats.payments}</span>
                                </div>
                            </div>
                            <div className="quick-stat">
                                <div className="qs-icon blue"><FaReceipt /></div>
                                <div>
                                    <span className="qs-label">Receipts</span>
                                    <span className="qs-value">{stats.receipts}</span>
                                </div>
                            </div>
                            <div className="quick-stat">
                                <div className="qs-icon purple"><FaChartLine /></div>
                                <div>
                                    <span className="qs-label">Collection Rate</span>
                                    <span className="qs-value">{collectionRate}%</span>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;