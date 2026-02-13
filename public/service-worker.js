const CACHE_NAME = 'kcs-app-v6-dynamic';
const STATIC_CACHE = 'kcs-static-v6';

const APP_SHELL = [
    '/',
    '/manifest.json',
    '/logo/krishna_connect.png',
    '/logo/light_KCS.png',
    '/logo/dark_KCS.png',
    '/logo/krishna_connect.png',
    '/chat-bg/light.png',
    '/chat-bg/dark.png',
    '/chat-bg/BG_3.svg',
    '/user_Avatar/male.png',
    '/user_Avatar/female.png'
];

// Install Event: Precache Core Assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing New Version...');
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(APP_SHELL);
        })
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
    // Tell the active service worker to take control of the page immediately.
    event.waitUntil(
        clients.claim().then(() => {
            return caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                            console.log('[Service Worker] Deleting Old Cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            });
        })
    );
});

// Helper: Network First strategy for HTML/Data
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || Response.error();
    }
}

// Helper: Stale While Revalidate for Static Assets
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);

    // Start network fetch in background
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            // Only cache valid responses
            if (networkResponse && networkResponse.ok) {
                // Clone immediately before any other operations
                const responseToCache = networkResponse.clone();
                // Cache in background (fire and forget)
                caches.open(STATIC_CACHE).then((cache) => {
                    cache.put(request, responseToCache);
                });
            }
            return networkResponse;
        })
        .catch((error) => {
            console.warn('[SW] Network fetch failed:', error);
            return null; // Return null on network failure
        });

    // Return cached response immediately if available, otherwise wait for network
    if (cachedResponse) {
        return cachedResponse;
    }

    // No cache, wait for network
    const networkResponse = await fetchPromise;
    return networkResponse || Response.error();
}

// Fetch Event
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignore non-GET requests
    if (event.request.method !== 'GET') return;

    // Ignore API calls, Chrome Extensions, and internal Next.js proxy calls
    if (
        url.pathname.startsWith('/api') ||
        url.protocol === 'chrome-extension:' ||
        url.pathname.includes('/_next/static/development') // Don't cache dev scripts excessively
    ) {
        return;
    }

    // Strategy Selection
    if (event.request.mode === 'navigate') {
        // HTML Pages: Network First (Fresh content matters)
        event.respondWith(networkFirst(event.request));
    } else if (
        APP_SHELL.some(path => url.pathname.endsWith(path)) ||
        url.pathname.startsWith('/_next/static') ||
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2)$/)
    ) {
        // Static Assets: Stale While Revalidate (Speed matters)
        event.respondWith(staleWhileRevalidate(event.request));
    } else {
        // Default: Network First
        event.respondWith(networkFirst(event.request));
    }
});

// Push Notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const isCallNotification = data.type === 'incoming_call';

        const options = {
            body: data.body,
            icon: data.icon || '/logo/krishna_connect.png',
            image: data.image,
            badge: '/logo/krishna_connect.png',
            vibrate: isCallNotification ? [200, 100, 200, 100, 200, 100, 200] : [100, 50, 100],
            data: {
                url: data.url || '/',
                type: data.type || 'default',
                callId: data.callId,
                callerId: data.callerId,
                timestamp: Date.now()
            },
            actions: isCallNotification
                ? [
                    { action: 'accept_call', title: '✅ Accept' },
                    { action: 'decline_call', title: '❌ Decline' }
                ]
                : data.actions || [
                    { action: 'open', title: 'Open' }
                ],
            tag: isCallNotification ? `call-${data.callId}` : (data.tag || 'default-notification'),
            renotify: true,
            requireInteraction: isCallNotification,
            silent: false
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'New Notification', options)
        );
    } catch (e) {
        console.error('Error handling push event:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const notifData = event.notification.data || {};
    const action = event.action;
    const isCall = notifData.type === 'incoming_call';

    // Handle call notification actions
    if (isCall && action === 'accept_call') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                // Try to focus existing window and send message to accept call
                for (const client of clientList) {
                    client.postMessage({
                        type: 'CALL_ACTION',
                        action: 'accept',
                        callId: notifData.callId
                    });
                    return client.focus();
                }
                // If no window open, open the app
                if (clients.openWindow) {
                    return clients.openWindow('/calls');
                }
            })
        );
        return;
    }

    if (isCall && action === 'decline_call') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    client.postMessage({
                        type: 'CALL_ACTION',
                        action: 'decline',
                        callId: notifData.callId
                    });
                    return;
                }
            })
        );
        return;
    }

    // Default: open URL
    const targetUrl = notifData.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
