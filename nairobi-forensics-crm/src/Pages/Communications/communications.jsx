// src/Pages/Communications/communications.jsx
import { FaEnvelope, FaWhatsapp, FaSms } from 'react-icons/fa';
import './communications.css';

const Communications = () => {
    return (
        <div className="communications-page">
            <div className="page-header">
                <h1>Communications</h1>
                <p>Send emails and messages to your clients</p>
            </div>

            <div className="comm-cards">
                <div className="comm-card">
                    <div className="comm-icon email"><FaEnvelope /></div>
                    <h3>Email</h3>
                    <p>Send invoices, receipts, and reminders via email.</p>
                    <span className="coming-badge">Coming Soon</span>
                </div>

                <div className="comm-card">
                    <div className="comm-icon whatsapp"><FaWhatsapp /></div>
                    <h3>WhatsApp</h3>
                    <p>Send payment reminders and receipts via WhatsApp Business API.</p>
                    <span className="coming-badge">Coming Soon</span>
                </div>

                {/* <div className="comm-card">
                    <div className="comm-icon sms"><FaSms /></div>
                    <h3>SMS</h3>
                    <p>Send SMS notifications for payments and invoice updates.</p>
                    <span className="coming-badge">Coming Soon</span>
                </div> */}
            </div>
        </div>
    );
};

export default Communications;