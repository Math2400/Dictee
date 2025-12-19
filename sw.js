const CACHE_NAME = 'dictee-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    'src/main.js',
    'src/styles/index.css',
    'src/styles/components.css',
    'manifest.json',
    'assets/icon-192.png',
    'assets/icon-512.png'
];

// Install event - Cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - Cache-first strategy for static assets, network-first for others
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
