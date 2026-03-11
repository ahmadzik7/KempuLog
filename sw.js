// KempuLog Service Worker v1.0
// Enables offline use and installability

const CACHE_NAME = 'kempulog-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for assets, network-first for API calls
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // API calls (Google Apps Script) - always try network
  if (url.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(
        JSON.stringify({ ok: false, msg: 'Offline - data tersimpan lokal' }),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // App assets - cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
