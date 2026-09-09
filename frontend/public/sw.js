const CACHE_NAME = 'brgydesk-pwa-v1.0.0';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/apple-touch-icon.png',
  '/lgu-hub-logo.png'
];

// 1. Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell and assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated caches & take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intelligent multi-strategy caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or browser extension requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle Page Navigation (HTML documents)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Clone and cache the successfully fetched page for offline usage
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Check if page exists in cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to pre-cached offline page
          const offlineFallback = await caches.match(OFFLINE_URL);
          return offlineFallback || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Handle Static Assets (Next.js static files, images, icons, fonts)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|woff|woff2|ttf|css|js)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-while-revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 408, statusText: 'Request Timeout' });
          });
      })
    );
    return;
  }

  // For API or other dynamic requests: Network First with graceful error
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return new Response(JSON.stringify({ success: false, offline: true, error: 'You are currently offline' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        });
      })
    );
    return;
  }

  // Default Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Web Push Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'BrgyDesk Notification',
    body: 'You have a new update on Barangay Services.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
    actions: data.actions || [
      { action: 'open', title: 'View Update' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click Action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

