// Service Worker for caching GLB files
const CACHE_NAME = 'myroom-glb-cache-v1';
const GLB_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Install event - setup cache
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.includes('myroom-glb-cache')) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle GLB file requests with cache-first strategy
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Only handle GLB files and related 3D assets
  if (url.includes('.glb') || url.includes('.gltf') || 
      (url.includes('/models/') && (url.includes('rooms') || url.includes('items') || url.includes('avatars')))) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 GLB served from cache:', url);
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          console.log('🌐 Fetching GLB from network:', url);
          return fetch(event.request).then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse.status === 200) {
              // Clone the response before caching
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
              console.log('💾 GLB cached:', url);
            }
            return networkResponse;
          }).catch((error) => {
            console.error('❌ Failed to fetch GLB:', url, error);
            throw error;
          });
        });
      })
    );
  }
});

// Message event - handle cache management commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_GLB_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('🗑️ GLB cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          const cacheInfo = {
            name: CACHE_NAME,
            size: keys.length,
            urls: keys.map(req => req.url)
          };
          event.ports[0].postMessage({ cacheInfo });
        });
      })
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker unhandled rejection:', event.reason);
});