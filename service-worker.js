const CACHE_NAME = 'whiteboard-photo-booth-v1';
const urlsToCache = [
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/fonts/NotoSerifJP.woff2',
  '/assets/index-DPAdtAQ6.js' // ← vite build後のJSファイル名に合わせて更新
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});