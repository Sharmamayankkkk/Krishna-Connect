
const CACHE_NAME = 'kcs-app-v3'; // Updated version for new logic
const APP_SHELL_URLS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/logo/light_KCS.svg',
    '/logo/dark_KCS.svg',
    '/user_Avatar/male.png',
    '/user_Avatar/female.png',
];

// Install event: precache the app shell
self.addEventListener('install', event => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Pre-caching app shell');
            return cache.addAll(APP_SHELL_URLS);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event: serve assets from cache or network with improved logic
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // Don't cache API calls or requests to external domains.
    if (url.origin !== self.location.origin || event.request.url.includes('/api/')) {
        return; // Let the network handle it, do not cache.
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/'); // Fallback to the root page.
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(networkResponse => {
                // Check if we received a valid response before caching.
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(error => {
                console.error('[Service Worker] Fetch failed:', error);
                // Rethrow the error to allow the browser to handle the network failure.
                throw error;
            });
        })
    );
});
