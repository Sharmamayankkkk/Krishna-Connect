const CACHE_NAME = 'kcs-app-v4'; // Incremented version to force update
const APP_SHELL_URLS = [
    '/',
    '/manifest.json',
    // Validated Logo paths from your screenshot
    '/logo/light_KCS.svg',
    '/logo/light_KCS.png',
    '/logo/dark_KCS.png', 
    '/logo/krishna_connect.png',
    // Validated Background paths (Fixes the "folder" error)
    '/chat-bg/light.png',
    '/chat-bg/dark.png',
    '/chat-bg/BG_3.svg',
    '/chat-bg/BG_4.png',
    // User Avatars (Keeping your original requests)
    '/user_Avatar/male.png',
    '/user_Avatar/female.png'
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

    // Don't cache API calls, AdSense, or external domains.
    if (url.origin !== self.location.origin || event.request.url.includes('/api/')) {
        return; 
    }

    // Navigation requests (HTML pages) -> Network first, fallback to cache, then offline page
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/'); // Fallback to the root page for SPA
            })
        );
        return;
    }

    // Asset requests (Images, CSS, JS) -> Cache first, then Network
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
                // Optional: Return a placeholder image here if an image fetch fails
                throw error;
            });
        })
    );
});
