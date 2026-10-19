// src/Pages/Clients/clients.jsx
import { useState, useEffect } from 'react';
import {
    FaPlus, FaSearch, FaEdit, FaTrash, FaUser,
    FaEnvelope, FaPhone, FaFileExcel, FaEye
} from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import { downloadExcel } from '../../utils/excelDownload';
import { useNotifications } from '../../context/NotificationContext';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import ClientModal from './ClientModal';
import './clients.css';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [exportingId, setExportingId] = useState(null);
    const { showToast } = useNotifications();

    // Load clients
    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/clients');
            setClients(data);
            setFiltered(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    // Filter clients by search
    useEffect(() => {
        if (!search.trim()) {
            setFiltered(clients);
        } else {
            const q = search.toLowerCase();
            setFiltered(clients.filter(c =>
                c.name?.toLowerCase().includes(q) ||
                c.code?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.toLowerCase().includes(q) ||
                c.kraPin?.toLowerCase().includes(q)
            ));
        }
    }, [search, clients]);

    // Open modal for create
    const handleCreateClick = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    // Open modal for edit
    const handleEditClick = (client) => {
        setEditingClient(client);
        setModalOpen(true);
    };

    // Export client payment ledger to Excel
    const handleExportClient = async (client) => {
        if (!client?._id) return;
        setExportingId(client._id);
        const safeName = (client.name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];

        try {
            await downloadExcel(
                `/exports/client/${client._id}`,
                `${safeName}-Payments-${dateStr}.xlsx`
            );
            showToast({
                type: 'ui_success',
                title: 'Excel exported',
                message: `${client.name}'s payment ledger downloaded.`
            });
        } catch (err) {
            showToast({
                type: 'ui_error',
                title: 'Export failed',
                message: err.message || 'Could not export to Excel'
            });
        } finally {
            setExportingId(null);
        }
    };

    // View statement (opens a new page)
    const handleViewStatement = (client) => {
        if (!client?._id) return;
        window.location.href = `/dashboard/clients/${client._id}/statement`;
    };

    // Delete client
    const handleDelete = async () => {
        if (!pendingDelete) return;
        const client = pendingDelete;
        setPendingDelete(null);
        try {
            await apiFetch(`/clients/${client._id}`, { method: 'DELETE' });
            loadClients();
            showToast({
                type: 'ui_success',
                title: 'Client deleted',
                message: `${client.name} was removed.`
            });
        } catch (err) {
            showToast({
                type: 'ui_error',
                title: 'Delete failed',
                message: err.message
            });
        }
    };

    // Called by modal on success
    const handleModalSuccess = () => {
        setModalOpen(false);
        setEditingClient(null);
        loadClients();
    };

    return (
        <div className="clients-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Clients</h1>
                    <p>Manage all your clients and their contact information</p>
                </div>
                <button className="btn-primary" onClick={handleCreateClick}>
                    <FaPlus /> New Client
                </button>
            </div>

            {/* Search bar */}
            <div className="toolbar">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by name, code, email, phone, or KRA PIN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <span className="result-count">
                    {filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
                </span>
            </div>

            {/* Table */}
            <div className="panel">
                {loading ? (
                    <p className="empty-state">Loading clients...</p>
                ) : error ? (
                    <p className="empty-state error">{error}</p>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <FaUser size={40} />
                        <p>
                            {search
                                ? `No clients match "${search}"`
                                : 'No clients yet. Click "New Client" to add your first one.'}
                        </p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Contact</th>
                                <th>KRA PIN</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(client => (
                                <tr key={client._id}>
                                    <td>
                                        <div className="client-cell">
                                            <div className="client-avatar">
                                                {client.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <strong>{client.name}</strong>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {client.code ? (
                                            <span className="client-code-badge">
                                                {client.code}
                                            </span>
                                        ) : (
                                            <span className="no-code-warning">
                                                No code
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="contact-info">
                                            {client.email && (
                                                <span><FaEnvelope /> {client.email}</span>
                                            )}
                                            {client.phone && (
                                                <span><FaPhone /> {client.phone}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{client.kraPin || '—'}</td>
                                    <td>{client.address?.city || '—'}</td>
                                    <td>
                                        <span className={`status-badge ${client.status || 'active'}`}>
                                            {client.status || 'active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {/* View Statement */}
                                            <button
                                                className="icon-btn view"
                                                onClick={() => handleViewStatement(client)}
                                                aria-label="View statement"
                                            >
                                                <FaEye />
                                            </button>

                                            {/* Export to Excel */}
                                            <button
                                                className="icon-btn excel"
                                                onClick={() => handleExportClient(client)}
                                                disabled={exportingId === client._id}
                                                aria-label="Export payments to Excel"
                                            >
                                                <FaFileExcel />
                                            </button>

                                            {/* Edit */}
                                            <button
                                                className="icon-btn edit"
                                                onClick={() => handleEditClick(client)}
                                                aria-label="Edit client"
                                            >
                                                <FaEdit />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                className="icon-btn delete"
                                                onClick={() => setPendingDelete(client)}
                                                aria-label="Delete client"
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

            {/* Create/Edit Modal */}
            {modalOpen && (
                <ClientModal
                    client={editingClient}
                    onClose={() => { setModalOpen(false); setEditingClient(null); }}
                    onSuccess={handleModalSuccess}
                />
            )}

            {/* Delete Confirmation */}
            {pendingDelete && (
                <ConfirmDialog
                    title="Delete this client?"
                    message={`Delete ${pendingDelete.name}? This action cannot be undone.`}
                    confirmLabel="Delete client"
                    onCancel={() => setPendingDelete(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
};

export default Clients;