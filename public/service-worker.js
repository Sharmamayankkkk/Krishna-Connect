const CACHE_NAME = 'kcs-app-v5-dynamic';
const STATIC_CACHE = 'kcs-static-v5';

const APP_SHELL = [
    '/',
    '/manifest.json',
    '/logo/light_KCS.svg',
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
    const fetchPromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
            // Clone BEFORE using the response to avoid "Response body is already used" error
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, responseToCache);
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, return cached or a fallback
        return cachedResponse || Response.error();
    });
    return cachedResponse || fetchPromise;
}

// Fetch Event
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignore non-GET requests
    if (event.request.method !== 'GET') return;

    // Ignore API calls, Chrome Extensions, and internal Next.js middleware calls
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
        const options = {
            body: data.body,
            icon: data.icon || '/logo/krishna_connect.png',
            image: data.image,
            badge: '/logo/krishna_connect.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/',
                timestamp: Date.now()
            },
            actions: data.actions || [
                { action: 'open', title: 'Open' }
            ],
            tag: data.tag || 'default-notification',
            renotify: true
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

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if open
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open new
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
