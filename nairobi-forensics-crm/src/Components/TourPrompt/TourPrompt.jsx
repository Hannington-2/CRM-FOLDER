// src/Components/TourPrompt/TourPrompt.jsx
import { useState, useEffect } from 'react';
import { FaGraduationCap, FaTimes } from 'react-icons/fa';
import { startDashboardTour, hasCompletedTour } from '../../tours/dashboardTour';
import './TourPrompt.css';

const TourPrompt = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Only show if tour hasn't been completed
        const dismissed = sessionStorage.getItem('tour_prompt_dismissed');
        if (!hasCompletedTour() && !dismissed) {
            // Delay so page loads first
            const timer = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleStart = () => {
        setShow(false);
        startDashboardTour();
    };

    const handleDismiss = () => {
        sessionStorage.setItem('tour_prompt_dismissed', 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="tour-prompt-overlay">
            <div className="tour-prompt-card">
                <button className="tour-prompt-close" onClick={handleDismiss} aria-label="Close">
                    <FaTimes />
                </button>

                <div className="tour-prompt-icon">
                    <FaGraduationCap />
                </div>

                <h2>Welcome aboard! 🎉</h2>
                <p>
                    New here? Let us give you a quick <strong>60-second tour</strong> of the
                    dashboard so you can hit the ground running.
                </p>

                <div className="tour-prompt-actions">
                    <button className="tour-btn-secondary" onClick={handleDismiss}>
                        Skip for now
                    </button>
                    <button className="tour-btn-primary" onClick={handleStart}>
                        Start Tour →
                    </button>
                </div>

                <p className="tour-prompt-note">
                    You can restart the tour anytime from Settings
                </p>
            </div>
        </div>
    );
};

export default TourPrompt;