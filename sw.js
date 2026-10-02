// BUMP THIS ON EVERY RELEASE. The fetch handler below is cache-first, so an
// installed copy serves its cached index.html forever and never sees a fix --
// the activate handler only clears caches whose name no longer matches.
// Bump this on EVERY release. The fetch handler is cache-first, so an installed
// copy will serve its cached index.html forever and never see a fix otherwise.
const CACHE_NAME = 'radiance-v8';
// RELATIVE, not '/index.html'. Pages serves this app at /Radiance/, so a
// leading slash pointed at the grbsoftware.github.io root, where manifest.json
// and the icons 404. cache.addAll rejects on a single failure, so through v6
// the worker never installed in production and nothing was ever cached --
// the stale-cache trap above only ever bit on localhost.
const urlsToCache = [
  './',
  'index.html',
  'radiance-color.js',
  'read.json',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install service worker and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
