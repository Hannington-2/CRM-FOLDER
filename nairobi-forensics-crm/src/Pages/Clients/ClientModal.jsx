// src/Pages/Clients/ClientModal.jsx
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import './ClientModal.css';

const ClientModal = ({ client, onClose, onSuccess }) => {
    const isEditing = !!client;

    const [form, setForm] = useState({
        name: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        kraPin: client?.kraPin || '',
        street: client?.address?.street || '',
        city: client?.address?.city || '',
        postalCode: client?.address?.postalCode || '',
        contactName: client?.contactPerson?.name || '',
        contactEmail: client?.contactPerson?.email || '',
        contactPhone: client?.contactPerson?.phone || '',
        notes: client?.notes || '',
        status: client?.status || 'active'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = {
            name: form.name,
            email: form.email,
            phone: form.phone,
            kraPin: form.kraPin,
            address: {
                street: form.street,
                city: form.city,
                postalCode: form.postalCode,
                country: 'Kenya'
            },
            contactPerson: {
                name: form.contactName,
                email: form.contactEmail,
                phone: form.contactPhone
            },
            notes: form.notes,
            status: form.status
        };

        try {
            if (isEditing) {
                await apiFetch(`/clients/${client._id}`, {
                    method: 'PUT',
                    body: payload
                });
            } else {
                await apiFetch('/clients', {
                    method: 'POST',
                    body: payload
                });
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditing ? 'Edit Client' : 'New Client'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Client Name *</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="ABC Limited"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>KRA PIN</label>
                                <input
                                    name="kraPin"
                                    value={form.kraPin}
                                    onChange={handleChange}
                                    placeholder="P051234567X"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="info@abc.co.ke"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="0722111222"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Address</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Street</label>
                                <input
                                    name="street"
                                    value={form.street}
                                    onChange={handleChange}
                                    placeholder="Kenyatta Avenue"
                                />
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Nairobi"
                                />
                            </div>
                            <div className="form-group small">
                                <label>Postal Code</label>
                                <input
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={handleChange}
                                    placeholder="00100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Contact Person</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    name="contactName"
                                    value={form.contactName}
                                    onChange={handleChange}
                                    placeholder="Jane Mwangi"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    name="contactEmail"
                                    type="email"
                                    value={form.contactEmail}
                                    onChange={handleChange}
                                    placeholder="jane@abc.co.ke"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    name="contactPhone"
                                    value={form.contactPhone}
                                    onChange={handleChange}
                                    placeholder="0733444555"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Additional</h3>
                        <div className="form-row">
                            <div className="form-group full">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Any additional notes..."
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && <div className="modal-error">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (isEditing ? 'Update Client' : 'Create Client')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientModal;