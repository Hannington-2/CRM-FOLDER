// frontend/public/sw.js
/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'nf-crm-v3';

// ===== INSTALL =====
self.addEventListener('install', () => {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names.map((name) => {
                    if (name !== CACHE_NAME) return caches.delete(name);
                    return null;
                })
            )
        ).then(() => self.clients.claim())
    );
});

// ===== FETCH =====
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Only handle http/https
    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;

    // NEVER intercept these — let them go straight to the network:
    // - API calls
    // - Vite dev server HMR files
    // - Hot module replacement
    // - WebSocket upgrades
    if (
        url.pathname.startsWith('/api') ||
        url.port === '5000' ||
        url.pathname.includes('/@vite') ||
        url.pathname.includes('/@react-refresh') ||
        url.pathname.includes('hot-update') ||
        url.pathname.includes('/node_modules/') ||
        event.request.headers.get('upgrade') === 'websocket'
    ) {
        return; // Let the browser handle it normally
    }

    // For everything else (HTML, CSS, JS, images) — network first, then cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Don't cache non-ok responses
                if (!response || response.status !== 200) {
                    return response;
                }

                // Clone and cache the response for future offline use
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Network failed — try cache
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;

                    // If it's an HTML navigation request, we can show a fallback
                    // For all other resources, just fail naturally
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html').then((htmlCache) => {
                            if (htmlCache) return htmlCache;
                            return new Response(
                                '<h1>You are offline</h1><p>Please check your internet connection.</p>',
                                {
                                    status: 200,
                                    headers: { 'Content-Type': 'text/html' }
                                }
                            );
                        });
                    }

                    // For non-navigation requests, let it fail naturally
                    // (browser will show the real error)
                    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
                });
            })
    );
});

// ===== PUSH NOTIFICATION RECEIVED =====
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');

    let data = {
        title: 'Nairobi Forensics',
        body: 'You have a new notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        url: '/dashboard',
        tag: 'default'
    };

    try {
        if (event.data) {
            const payload = event.data.json();
            data = { ...data, ...payload };
        }
    } catch (err) {
        console.error('[SW] Push parse error:', err);
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: { url: data.url },
        vibrate: [200, 100, 200]
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// ===== NOTIFICATION CLICKED =====
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard';
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(fullUrl);
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(fullUrl);
            }
        })
    );
});