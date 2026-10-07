// src/Components/SessionWarning/SessionWarning.jsx
import { useState, useEffect, useRef } from 'react';
import { FaClock, FaSignOutAlt, FaSync } from 'react-icons/fa';
import './SessionWarning.css';

const SessionWarning = ({ secondsLeft, onStayLoggedIn, onLogoutNow }) => {
    const [countdown, setCountdown] = useState(secondsLeft);
    const intervalRef = useRef(null);

    useEffect(() => {
        setCountdown(secondsLeft);
    }, [secondsLeft]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCountdown(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, []);

    // Progress ring — 0% to 100%
    const progress = Math.max(0, Math.min(100, (countdown / 60) * 100));

    return (
        <div className="session-overlay">
            <div className="session-modal">
                <div className="session-icon">
                    <FaClock />
                </div>

                <h2>Session Expiring Soon</h2>
                <p>
                    For your security, you'll be logged out due to inactivity.
                    Click <strong>Stay Logged In</strong> to continue working.
                </p>

                {/* Countdown circle */}
                <div className="session-countdown">
                    <svg viewBox="0 0 100 100">
                        <circle
                            className="countdown-track"
                            cx="50" cy="50" r="42"
                            fill="none" strokeWidth="8"
                        />
                        <circle
                            className="countdown-progress"
                            cx="50" cy="50" r="42"
                            fill="none" strokeWidth="8"
                            strokeDasharray={`${progress * 2.64} 264`}
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="countdown-text">
                        <span className="countdown-number">{countdown}</span>
                        <span className="countdown-label">seconds</span>
                    </div>
                </div>

                <div className="session-actions">
                    <button className="session-btn-ghost" onClick={onLogoutNow}>
                        <FaSignOutAlt /> Log Out Now
                    </button>
                    <button className="session-btn-primary" onClick={onStayLoggedIn}>
                        <FaSync /> Stay Logged In
                    </button>
                </div>

                <p className="session-note">
                    Your session will end automatically when the timer reaches zero.
                </p>
            </div>
        </div>
    );
};

export default SessionWarning;