// src/Pages/Clients/clients.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
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

    // Delete client
    const handleDelete = async (client) => {
        if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return;
        try {
            await apiFetch(`/clients/${client._id}`, { method: 'DELETE' });
            loadClients();
        } catch (err) {
            alert('Delete failed: ' + err.message);
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
                        placeholder="Search by name, email, phone, or KRA PIN..."
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
                                            <button
                                                className="icon-btn edit"
                                                onClick={() => handleEditClick(client)}
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                onClick={() => handleDelete(client)}
                                                title="Delete"
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
        </div>
    );
};

export default Clients;