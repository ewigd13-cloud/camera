const CACHE_NAME = 'whiteboard-photo-booth-v2';

const urlsToCache = [
  '/camera/',
  '/camera/index.html',
  '/camera/manifest.json',
  '/camera/service-worker.js',
  '/camera/assets/index-B0PFTnep.js', // ビルド後の正確なJSファイル名
  '/camera/assets/index-BCR89zRb.css' // ビルド後の正確なCSSファイル名
  // 外部URLは除外済み
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // 外部URLはキャッシュ対象外（CORS制限回避）
  if (
    url.startsWith('https://fonts.googleapis.com') ||
    url.startsWith('https://cdn.tailwindcss.com') ||
    url.startsWith('https://data1.hikkss.com')
  ) {
    return; // fetchはブラウザに任せる
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(response => {
        if (response) return response;

        return fetch(event.request).then(networkResponse => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          cache.put(event.request, responseToCache);
          return networkResponse;
        }).catch(err => {
          console.error('Fetch failed; returning offline fallback if available.', err);
          return caches.match('/camera/index.html'); // オフライン時の最低限UI
        });
      })
    )
  );
});