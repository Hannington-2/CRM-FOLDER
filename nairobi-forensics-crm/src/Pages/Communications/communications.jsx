// src/Pages/Communications/communications.jsx
import { useState, useEffect } from 'react';
import {
    FaEnvelope, FaWhatsapp, FaSms, FaInfoCircle,
    FaCheckCircle, FaClock, FaPaperPlane, FaHistory,
    FaBell, FaBullhorn, FaFileInvoiceDollar, FaReceipt
} from 'react-icons/fa';
import { apiFetch } from '../../utils/api';
import './communications.css';

const Communications = () => {
    const [activeTab, setActiveTab] = useState('send');
    const [history, setHistory] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Feature status — flip these to true when providers are verified
    const FEATURES = {
        email: { enabled: false, label: 'Awaiting Brevo verification' },
        whatsapp: { enabled: false, label: 'Awaiting Twilio verification' },
        sms: { enabled: false, label: 'Not yet integrated' }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [historyRes, clientsRes] = await Promise.all([
                    apiFetch('/communications/history').catch(() => []),
                    apiFetch('/clients')
                ]);
                setHistory(Array.isArray(historyRes) ? historyRes : []);
                setClients(clientsRes);
            } catch (err) {
                console.error('Failed to load communications', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="communications-page">

            {/* ===== PAGE HEADER ===== */}
            <div className="page-header">
                <div>
                    <h1>Communications</h1>
                    <p>Send emails, WhatsApp messagesto your clients</p>
                </div>
            </div>

            {/* ===== COMING SOON BANNER ===== */}
            <div className="coming-soon-banner">
                <div className="banner-icon">
                    <FaInfoCircle />
                </div>
                <div className="banner-content">
                    <h3>Coming Soon — Awaiting Provider Verification</h3>
                    <p>
                        Email and WhatsApp integrations are ready. Once Brevo and Twilio
                        accounts are verified, messaging will activate automatically — no
                        further setup required on your end.
                    </p>
                </div>
                <div className="banner-status">
                    <FaClock />
                    <span>Pending</span>
                </div>
            </div>

            {/* ===== FEATURE STATUS CARDS ===== */}
            <div className="feature-grid">
                {/* EMAIL */}
                <div className={`feature-card ${FEATURES.email.enabled ? 'active' : 'pending'}`}>
                    <div className="feature-header">
                        <div className="feature-icon email"><FaEnvelope /></div>
                        <span className={`feature-status ${FEATURES.email.enabled ? 'on' : 'off'}`}>
                            {FEATURES.email.enabled ? <><FaCheckCircle /> Active</> : <><FaClock /> Pending</>}
                        </span>
                    </div>
                    <h3>Email</h3>
                    <p>Send invoices, receipts, and custom messages via Brevo.</p>
                    <span className="feature-note">{FEATURES.email.label}</span>
                </div>

                {/* WHATSAPP */}
                <div className={`feature-card ${FEATURES.whatsapp.enabled ? 'active' : 'pending'}`}>
                    <div className="feature-header">
                        <div className="feature-icon whatsapp"><FaWhatsapp /></div>
                        <span className={`feature-status ${FEATURES.whatsapp.enabled ? 'on' : 'off'}`}>
                            {FEATURES.whatsapp.enabled ? <><FaCheckCircle /> Active</> : <><FaClock /> Pending</>}
                        </span>
                    </div>
                    <h3>WhatsApp</h3>
                    <p>Send payment reminders and receipts via Twilio WhatsApp API.</p>
                    <span className="feature-note">{FEATURES.whatsapp.label}</span>
                </div>

                {/* SMS */}
                {/* <div className={`feature-card ${FEATURES.sms.enabled ? 'active' : 'pending'}`}>
                    <div className="feature-header">
                        <div className="feature-icon sms"><FaSms /></div>
                        <span className={`feature-status ${FEATURES.sms.enabled ? 'on' : 'off'}`}>
                            {FEATURES.sms.enabled ? <><FaCheckCircle /> Active</> : <><FaClock /> Pending</>}
                        </span>
                    </div>
                    <h3>SMS</h3>
                    <p>Send text message reminders and notifications.</p>
                    <span className="feature-note">{FEATURES.sms.label}</span>
                </div> */}
            </div>

            {/* ===== TABS ===== */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'send' ? 'active' : ''}`}
                    onClick={() => setActiveTab('send')}
                >
                    <FaPaperPlane /> Compose
                </button>
                <button
                    className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    <FaBell /> Templates
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <FaHistory /> History
                </button>
            </div>

            {/* ===== TAB CONTENT ===== */}
            {activeTab === 'send' && (
                <SendPanel clients={clients} />
            )}

            {activeTab === 'templates' && (
                <TemplatesPanel />
            )}

            {activeTab === 'history' && (
                <HistoryPanel history={history} loading={loading} />
            )}

        </div>
    );
};

// ============ SEND PANEL ============
const SendPanel = ({ clients }) => {
    const [channel, setChannel] = useState('email');
    const [clientId, setClientId] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const selectedClient = clients.find(c => c._id === clientId);

    const handleSend = (e) => {
        e.preventDefault();
        alert('Communications will activate once provider verification is complete.');
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <h2>Compose Message</h2>
                <span className="panel-badge pending">Preview only — not sending</span>
            </div>

            <form className="compose-form" onSubmit={handleSend}>

                {/* Channel Picker */}
                <div className="form-group">
                    <label>Channel</label>
                    <div className="channel-picker">
                        <button
                            type="button"
                            className={`channel-btn ${channel === 'email' ? 'active' : ''}`}
                            onClick={() => setChannel('email')}
                        >
                            <FaEnvelope /> Email
                        </button>
                        <button
                            type="button"
                            className={`channel-btn ${channel === 'whatsapp' ? 'active' : ''}`}
                            onClick={() => setChannel('whatsapp')}
                        >
                            <FaWhatsapp /> WhatsApp
                        </button>
                        {/* <button
                            type="button"
                            className={`channel-btn ${channel === 'sms' ? 'active' : ''}`}
                            onClick={() => setChannel('sms')}
                            disabled
                        >
                            <FaSms /> SMS
                        </button> */}
                    </div>
                </div>

                {/* Client Picker */}
                <div className="form-group">
                    <label>Recipient</label>
                    <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                        <option value="">Select a client...</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.name} {c.email ? `(${c.email})` : c.phone ? `(${c.phone})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Recipient info */}
                {selectedClient && (
                    <div className="recipient-info">
                        <div className="recipient-avatar">
                            {selectedClient.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong>{selectedClient.name}</strong>
                            <span>
                                {channel === 'email'
                                    ? selectedClient.email || 'No email on file'
                                    : selectedClient.phone || 'No phone on file'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Subject (email only) */}
                {channel === 'email' && (
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Invoice INV-KRACU000001 from Nairobi Forensics"
                        />
                    </div>
                )}

                {/* Message body */}
                <div className="form-group">
                    <label>Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="8"
                        placeholder={
                            channel === 'email'
                                ? 'Dear Client,\n\nPlease find attached your invoice for the services rendered...'
                                : 'Hello, just a reminder about your outstanding invoice...'
                        }
                    />
                </div>

                {/* Quick insert buttons */}
                <div className="quick-inserts">
                    <span className="quick-label">Insert:</span>
                    <button type="button" className="quick-chip">
                        <FaFileInvoiceDollar /> Invoice link
                    </button>
                    <button type="button" className="quick-chip">
                        <FaReceipt /> Receipt link
                    </button>
                    <button type="button" className="quick-chip">
                        Payment reminder
                    </button>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-secondary">Save Draft</button>
                    <button type="submit" className="btn-primary" disabled>
                        <FaPaperPlane /> Send {channel === 'email' ? 'Email' : 'WhatsApp'}
                    </button>
                </div>

                <p className="disabled-note">
                    <FaInfoCircle /> Sending is disabled until provider verification completes.
                </p>
            </form>
        </div>
    );
};

// ============ TEMPLATES PANEL ============
const TemplatesPanel = () => {
    const templates = [
        {
            icon: <FaFileInvoiceDollar />,
            title: 'Invoice Notification',
            channel: 'Email',
            description: 'Sent when an invoice is created. Includes PDF attachment and payment link.',
            preview: 'Dear {Client Name}, please find your invoice {Invoice Number} for {Amount}...'
        },
        {
            icon: <FaReceipt />,
            title: 'Receipt Acknowledgement',
            channel: 'Email',
            description: 'Sent automatically after a payment is recorded. Includes PDF receipt.',
            preview: 'Thank you {Client Name}, we have received your payment of {Amount}...'
        },
        {
            icon: <FaBell />,
            title: 'Payment Reminder',
            channel: 'WhatsApp',
            description: 'Sent for invoices that are past their due date.',
            preview: 'Hi {Client Name}, this is a friendly reminder about invoice {Invoice Number}...'
        },
        {
            icon: <FaBullhorn />,
            title: 'Welcome Message',
            channel: 'Email',
            description: 'Sent when a new client is added to the system.',
            preview: 'Welcome to Nairobi Forensics LLP, {Client Name}...'
        }
    ];

    return (
        <div className="panel">
            <div className="panel-header">
                <h2>Message Templates</h2>
                <span className="panel-badge pending">Editable after launch</span>
            </div>
            <div className="templates-grid">
                {templates.map((t, i) => (
                    <div className="template-card" key={i}>
                        <div className="template-icon">{t.icon}</div>
                        <div className="template-body">
                            <div className="template-head">
                                <h3>{t.title}</h3>
                                <span className="template-channel">{t.channel}</span>
                            </div>
                            <p>{t.description}</p>
                            <div className="template-preview">{t.preview}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============ HISTORY PANEL ============
const HistoryPanel = ({ history, loading }) => {
    return (
        <div className="panel">
            <div className="panel-header">
                <h2>Message History</h2>
                <span className="panel-badge">{history.length} messages</span>
            </div>

            {loading ? (
                <p className="empty-state">Loading history...</p>
            ) : history.length === 0 ? (
                <div className="empty-state large">
                    <FaHistory size={40} />
                    <p>No messages sent yet</p>
                    <span>Your sent emails and WhatsApp messages will appear here once communications go live.</span>
                </div>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Channel</th>
                            <th>Recipient</th>
                            <th>Subject</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((h, i) => (
                            <tr key={i}>
                                <td>{new Date(h.date).toLocaleDateString('en-GB')}</td>
                                <td>{h.channel}</td>
                                <td>{h.recipient}</td>
                                <td>{h.subject}</td>
                                <td><span className={`status-badge ${h.status}`}>{h.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Communications;