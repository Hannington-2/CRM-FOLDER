// src/Components/Notifications/PushPermissionPrompt.jsx
import { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import {
    getPermissionState,
    requestNotificationPermission,
    subscribeToPush
} from '../../utils/pushNotifications';
import './PushPermissionPrompt.css';

const PushPermissionPrompt = () => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let promptTimer = null;

        const permission = getPermissionState();
        const dismissed = localStorage.getItem('push_prompt_dismissed_v7');

        console.log(' Initial permission:', permission);

        // Already granted → nothing to do
        if (permission === 'granted') return;

        // Denied (browser blocked) → don't show anything
        // (the user must reset in browser settings themselves)
        if (permission === 'denied') return;

        // Default → show the prompt at the same time as the install prompt
        if (!dismissed) {
            promptTimer = window.setTimeout(() => setShow(true), 3000);
        }

        return () => {
            if (promptTimer) {
                window.clearTimeout(promptTimer);
            }
        };
    }, []);

    const handleEnable = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Ask the browser — this shows the native Allow/Block dialog
            console.log(' Requesting permission — browser dialog should appear...');
            const permission = await requestNotificationPermission();
            console.log(' Result:', permission);

            if (permission === 'granted') {
                // 2. Browser said yes — subscribe + save to backend
                await subscribeToPush();
                setDone(true);
                setTimeout(() => setShow(false), 2500);
            } else {
                // User clicked Block or closed the dialog — just close quietly
                setShow(false);
                localStorage.setItem('push_prompt_dismissed_v7', Date.now());
            }
        } catch (err) {
            console.error(' Enable failed:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('push_prompt_dismissed_v7', Date.now());
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="nf-push-card">
            <div className="nf-push-inner">

                {done ? (
                    /* ===== SUCCESS ===== */
                    <div className="nf-push-row">
                        <div className="nf-push-icon nf-push-icon-success">
                            <FaCheck />
                        </div>
                        <div className="nf-push-body">
                            <h4>Notifications enabled </h4>
                            <p>You'll get alerts on this device.</p>
                        </div>
                    </div>
                ) : (
                    /* ===== ASK STATE ===== */
                    <>
                        <button
                            className="nf-push-x"
                            onClick={handleDismiss}
                            aria-label="Dismiss"
                        >
                            <FaTimes />
                        </button>

                        <div className="nf-push-row">
                            <div className="nf-push-icon">
                                <FaBell />
                            </div>
                            <div className="nf-push-body">
                                <h4>Stay in the loop</h4>
                                <p>Get alerts when clients pay — even when CRM is closed.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="nf-push-error">{error}</div>
                        )}

                        <div className="nf-push-buttons">
                            <button
                                className="nf-push-btn-ghost"
                                onClick={handleDismiss}
                                disabled={loading}
                            >
                                Not now
                            </button>
                            <button
                                className="nf-push-btn-solid"
                                onClick={handleEnable}
                                disabled={loading}
                            >
                                {loading ? 'Enabling...' : 'Enable Notification'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PushPermissionPrompt;