const CACHE_NAME = 'kiwiplay-shell-v1';

// Only cache the app shell — never game content or games list
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/assets/bg.png',
  '/manifest.json'
];

// Paths that must always come from the network (never cached)
function isNetworkOnly(url) {
  const path = new URL(url).pathname;
  return (
    path.endsWith('games.json') ||
    path.includes('/space-maze/') ||
    path.includes('/memo/') ||
    path.includes('/letters-match/')
  );
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Always go to network for game content and games list
  if (isNetworkOnly(event.request.url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Shell: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
