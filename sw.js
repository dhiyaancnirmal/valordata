// Enhanced Service Worker with Smart Texture Caching
// Version 2.0 - Optimized for texture-heavy 3D apps

const CACHE_NAME = 'valor-3d-v2-optimized';
const TEXTURE_CACHE = 'valor-textures-v2';

// Static assets - always cache
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/main.css',
    '/valerlogo.gltf',
    '/world-logo.svg',
    '/build/three.module.js',
    '/jsm/loaders/GLTFLoader.js',
    '/jsm/controls/OrbitControls.js',
    '/texture-worker.js',
    '/pmrem-cache.js',
    '/lod-selector.js'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static assets...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== TEXTURE_CACHE) {
                        console.log(`🗑️ Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - smart caching strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-http/https requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Texture files - cache-first with long TTL
    if (url.pathname.includes('/textures/') ||
        url.pathname.endsWith('.ktx2') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.jpg')) {

        event.respondWith(
            caches.open(TEXTURE_CACHE).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }

                    // Fetch and cache
                    return fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        return new Response('Texture not found', { status: 404 });
                    });
                });
            })
        );
        return;
    }

    // Static assets - cache-first
    if (STATIC_CACHE_URLS.includes(url.pathname)) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).catch(() => {
                    return new Response('Not found', { status: 404 });
                });
            })
        );
        return;
    }

    // Everything else - network-first
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then((response) => {
                return response || new Response('Not found', { status: 404 });
            });
        })
    );
});

// Background sync for texture preloading (if supported)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_TEXTURES') {
        const textures = event.data.textures || [];

        caches.open(TEXTURE_CACHE).then((cache) => {
            textures.forEach(url => {
                fetch(url).then(response => {
                    if (response && response.status === 200) {
                        cache.put(url, response);
                        console.log(`📥 Background cached: ${url}`);
                    }
                });
            });
        });
    }
});
