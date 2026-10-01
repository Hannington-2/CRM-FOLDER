// src/Pages/Dashboard/dashboard.jsx
import { useState, useEffect } from 'react';
import { FaUsers, FaFileInvoiceDollar, FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import './dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        clients: 0,
        invoices: 0,
        outstanding: 0,
        payments: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentInvoices, setRecentInvoices] = useState([]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [clients, invoices, payments, receipts] = await Promise.all([
                    apiFetch('/clients'),
                    apiFetch('/invoices'),
                    apiFetch('/payments'),
                    apiFetch('/receipts')
                ]);

                const outstanding = invoices
                    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
                    .reduce((sum, inv) => sum + inv.balance, 0);

                setStats({
                    clients: clients.length,
                    invoices: invoices.length,
                    outstanding,
                    payments: payments.length,
                    receipts: receipts.length
                });

                setRecentInvoices(invoices.slice(0, 5));
            } catch (err) {
                console.error('Failed to load stats', err);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const formatKES = (amount) =>
        `KES ${Number(amount || 0).toLocaleString('en-KE')}`;

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Overview of your forensic CRM activity</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><FaUsers /></div>
                    <div>
                        <p className="stat-label">Total Clients</p>
                        <h3 className="stat-value">{loading ? '...' : stats.clients}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple"><FaFileInvoiceDollar /></div>
                    <div>
                        <p className="stat-label">Invoices</p>
                        <h3 className="stat-value">{loading ? '...' : stats.invoices}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon red"><FaMoneyBillWave /></div>
                    <div>
                        <p className="stat-label">Outstanding</p>
                        <h3 className="stat-value small">{loading ? '...' : formatKES(stats.outstanding)}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green"><FaReceipt /></div>
                    <div>
                        <p className="stat-label">Payments Received</p>
                        <h3 className="stat-value">{loading ? '...' : stats.payments}</h3>
                    </div>
                </div>
            </div>

            {/* Recent Invoices Table */}
            <div className="panel">
                <div className="panel-header">
                    <h2>Recent Invoices</h2>
                </div>
                {loading ? (
                    <p className="empty-state">Loading...</p>
                ) : recentInvoices.length === 0 ? (
                    <p className="empty-state">No invoices yet. Create your first one from the Invoices page.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Client</th>
                                <th>Total</th>
                                <th>Balance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentInvoices.map(inv => (
                                <tr key={inv._id}>
                                    <td><strong>{inv.invoiceNumber}</strong></td>
                                    <td>{inv.client?.name || '—'}</td>
                                    <td>{formatKES(inv.total)}</td>
                                    <td>{formatKES(inv.balance)}</td>
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
    );
};

export default Dashboard;