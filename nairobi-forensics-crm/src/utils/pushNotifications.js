// src/utils/pushNotifications.js
import { apiFetch } from './api';

const VAPID_KEY_CACHE = { key: null, fetchedAt: 0 };

const getVapidKey = async () => {
    const now = Date.now();
    if (VAPID_KEY_CACHE.key && now - VAPID_KEY_CACHE.fetchedAt < 3600000) {
        return VAPID_KEY_CACHE.key;
    }

    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/push/vapid-key`);
    if (!res.ok) throw new Error('Failed to fetch VAPID key');

    const data = await res.json();
    if (!data.publicKey) throw new Error('VAPID key not configured on server');

    VAPID_KEY_CACHE.key = data.publicKey;
    VAPID_KEY_CACHE.fetchedAt = now;
    return data.publicKey;
};

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        console.log('✅ Service Worker registered:', registration.scope);
        return registration;
    } catch (err) {
        console.error('❌ SW registration failed:', err);
        return null;
    }
};

export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export const getPermissionState = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    const permission = await Notification.requestPermission();
    console.log('🔔 Permission:', permission);
    return permission;
};

/**
 * Wait for the service worker to be fully ready.
 * Times out after 10 seconds to avoid hanging forever.
 */
const waitForServiceWorkerReady = async (timeout = 10000) => {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported');
    }

    // If already has an active controller, we're good
    if (navigator.serviceWorker.controller) {
        console.log('✅ SW already controlling');
        return navigator.serviceWorker.controller;
    }

    // Otherwise, wait for the ready promise with a timeout
    return Promise.race([
        navigator.serviceWorker.ready.then(() => {
            console.log('✅ SW ready');
            return navigator.serviceWorker.controller;
        }),
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error('Service Worker not ready within 10s. Try refreshing the page.')),
                timeout
            )
        )
    ]);
};

/**
 * Diagnostic helper — prints environment info that helps debug push issues.
 */
const logPushEnvironment = () => {
    console.log('=== PUSH ENVIRONMENT ===');
    console.log('Permission:', Notification.permission);
    console.log('Secure context:', window.isSecureContext);
    console.log('Origin:', window.location.origin);
    console.log('Protocol:', window.location.protocol);
    console.log('isSecureContext:', window.isSecureContext);
    console.log('PushManager available:', 'PushManager' in window);
    console.log('ServiceWorker controller:', !!navigator.serviceWorker.controller);
    console.log('========================');
};

/**
 * Subscribe to push notifications.
 */
export const subscribeToPush = async () => {
    logPushEnvironment();

    // 1. Check support
    if (!isPushSupported()) {
        throw new Error(
            'Push notifications are not supported in this browser. ' +
            'Try Chrome, Edge, or Firefox. (iOS requires iOS 16.4+ and installing the app first.)'
        );
    }

    // 1b. Secure context check (must be HTTPS or localhost)
    if (!window.isSecureContext) {
        throw new Error(
            'Push notifications require a secure connection (HTTPS). ' +
            'If testing locally, use http://localhost — not a LAN IP.'
        );
    }

    // 2. Request permission
    let permission = getPermissionState();
    if (permission !== 'granted') {
        permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission was denied by the user.');
        }
    }

    // 3. Make sure the service worker is registered
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
        console.log('📝 Registering SW...');
        registration = await registerServiceWorker();
        if (!registration) {
            throw new Error('Could not register service worker.');
        }
    }

    // 4. Wait for the SW to be fully active
    await waitForServiceWorkerReady();

    // 5. Give the browser a moment to fully activate the SW
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // 7. Subscribe if none exists
    if (!subscription) {
        console.log('📱 Creating new push subscription...');
        const vapidKey = await getVapidKey();
        console.log('🔑 VAPID key length:', vapidKey?.length);

        try {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });
            console.log('✅ Push subscription created');
        } catch (err) {
            console.error('❌ pushManager.subscribe failed:');
            console.error('  Name:', err.name);
            console.error('  Message:', err.message);
            console.error('  Full error:', err);

            if (err.name === 'AbortError') {
                throw new Error(
                    'The push service is temporarily unavailable. ' +
                    'This usually means your browser cannot reach the push servers. ' +
                    'Try: (1) Restart Chrome, (2) Enable "Continue running background apps" in chrome://settings/system, ' +
                    '(3) Check your firewall isn\'t blocking Chrome, (4) Disable any VPN.',
                    { cause: err }
                );
            }
            if (err.name === 'NotAllowedError') {
                throw new Error('Notification permission was denied.', { cause: err });
            }
            if (err.name === 'InvalidStateError') {
                throw new Error(
                    'Service Worker is not active yet. Please refresh the page and try again.',
                    { cause: err }
                );
            }
            throw new Error('Failed to subscribe to push: ' + err.message, { cause: err });
        }
    } else {
        console.log('📱 Existing subscription found');
    }

    // 8. Send the subscription to our backend
    try {
        const p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
        const auth = arrayBufferToBase64(subscription.getKey('auth'));

        if (!p256dh || !auth) {
            throw new Error('Subscription keys are missing.');
        }

        await apiFetch('/push/subscribe', {
            method: 'POST',
            body: {
                endpoint: subscription.endpoint,
                keys: { p256dh, auth },
                deviceName: getDeviceName(),
                userAgent: navigator.userAgent
            }
        });

        console.log('✅ Push subscription saved to backend');
        return subscription;
    } catch (err) {
        console.error('❌ Backend save failed:', err);

        // Roll back the browser subscription so the next attempt starts fresh
        try {
            await subscription.unsubscribe();
        } catch (rollbackErr) {
            console.warn('⚠️ Rollback unsubscribe failed:', rollbackErr);
        }

        throw new Error(
            'Could not save subscription on the server: ' + err.message,
            { cause: err }
        );
    }
};

export const unsubscribeFromPush = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    try {
        await apiFetch('/push/unsubscribe', {
            method: 'POST',
            body: { endpoint }
        });
    } catch (err) {
        console.error('Backend unsubscribe failed:', err);
    }
    return true;
};

const arrayBufferToBase64 = (buffer) => {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android Device';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Device';
    if (/Mac/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Linux/i.test(ua)) return 'Linux PC';
    return 'Unknown Device';
};