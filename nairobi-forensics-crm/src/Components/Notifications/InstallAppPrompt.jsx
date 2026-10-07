// src/Components/Notifications/InstallAppPrompt.jsx
import { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaMobileAlt, FaSpinner } from 'react-icons/fa';
import './InstallAppPrompt.css';

const InstallAppPrompt = () => {
    const [show, setShow] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        let promptTimer = null;

        // Check if already installed (running as standalone PWA)
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        if (standalone) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS (uses manual install, no native prompt)
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Check if dismissed recently (only 3 days)
        const dismissed = localStorage.getItem('install_prompt_dismissed_v4');
        const recentlyDismissed = dismissed && (Date.now() - Number(dismissed)) < 3 * 24 * 60 * 60 * 1000;

        // Listen for the native install prompt event
        const beforeInstallHandler = (e) => {
            console.log('🎯 beforeinstallprompt fired! App is installable.');
            e.preventDefault(); // Prevent Chrome's mini-infobar
            setDeferredPrompt(e);
            // Show our custom prompt in sync with the notification prompt
            if (!recentlyDismissed) {
                promptTimer = window.setTimeout(() => setShow(true), 3000);
            }
        };
        window.addEventListener('beforeinstallprompt', beforeInstallHandler);

        // Detect successful install
        const installedHandler = () => {
            console.log('✅ App installed successfully');
            setIsInstalled(true);
            setShow(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            if (promptTimer) {
                window.clearTimeout(promptTimer);
            }
            window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstallClick = async () => {
        // iOS: no native prompt — show native OS instructions
        if (isIOS) {
            setShow(false);
            alert(
                '📱 To install on iPhone/iPad:\n\n' +
                '1. Tap the Share button (square with arrow at the bottom)\n' +
                '2. Scroll down and tap "Add to Home Screen"\n' +
                '3. Tap "Add" in the top-right corner'
            );
            return;
        }

        // Have the native prompt — trigger it
        if (deferredPrompt) {
            try {
                setInstalling(true);
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Install choice:', outcome);

                if (outcome === 'accepted') {
                    setIsInstalled(true);
                    setShow(false);
                } else {
                    // User declined — allow retry later
                    setShow(false);
                }
            } catch (err) {
                console.error('Install error:', err);
            } finally {
                setInstalling(false);
                setDeferredPrompt(null);
            }
            return;
        }

        // No native prompt available yet (Chrome hasn't fired the event)
        // Tell the user to look in the browser — without a wall of text
        alert(
            'The install prompt isn\'t available yet.\n\n' +
            'Try one of these:\n' +
            '• Chrome/Edge Desktop: Look for the install icon (⊕) in the address bar\n' +
            '• Android Chrome: Menu (⋮) → "Install app"\n\n' +
            'If you don\'t see it, refresh the page and wait a few seconds.'
        );
    };

    const handleDismiss = () => {
        localStorage.setItem('install_prompt_dismissed_v4', Date.now());
        setShow(false);
    };

    if (!show || isInstalled) return null;

    return (
        <div className="nf-install-card">
            <div className="nf-install-inner">
                <button
                    className="nf-install-x"
                    onClick={handleDismiss}
                    aria-label="Dismiss"
                >
                    <FaTimes />
                </button>

                <div className="nf-install-row">
                    <div className="nf-install-icon">
                        <FaMobileAlt />
                    </div>
                    <div className="nf-install-body">
                        <h4>Install the app</h4>
                        <p>Get faster access and instant notifications.</p>
                    </div>
                </div>

                <div className="nf-install-buttons">
                    <button
                        className="nf-install-btn-ghost"
                        onClick={handleDismiss}
                        disabled={installing}
                    >
                        Not now
                    </button>
                    <button
                        className="nf-install-btn-solid"
                        onClick={handleInstallClick}
                        disabled={installing}
                    >
                        {installing ? (
                            <>
                                <FaSpinner className="spin" /> Installing...
                            </>
                        ) : (
                            <>
                                <FaDownload /> Install
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallAppPrompt;