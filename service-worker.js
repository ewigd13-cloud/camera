const CACHE_NAME = 'whiteboard-photo-booth-v2';
const urlsToCache = [
  self.location.origin + '/camera/',
  self.location.origin + '/camera/manifest.json',
  self.location.origin + '/camera/assets/index-tnrYw67E.js',
  self.location.origin + '/camera/assets/index-DgIfnjQ_.css',
  self.location.origin + '/camera/icons/icon-192.png',
  self.location.origin + '/camera/icons/icon-512.png',
  self.location.origin + '/camera/fonts/NotoSerifJP-VariableFont_wght.ttf', // ← ローカルフォント
];


// インストール時にキャッシュ登録
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache addAll failed:', err);
      })
  );
});

// アクティベート時に古いキャッシュ削除＋即時制御
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// フェッチ時の分岐：navigateは index.html、それ以外はキャッシュ優先
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(self.location.origin + '/camera/')
      )
    );
    return;
  }

  // 通常のリソース取得（JS/CSS/画像など）
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(response => {
        if (response) return response;

        return fetch(event.request).then(networkResponse => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            !['basic', 'cors'].includes(networkResponse.type)
          ) return networkResponse;

          const responseToCache = networkResponse.clone();
          cache.put(event.request, responseToCache);
          return networkResponse;
        }).catch(() =>
          caches.match(self.location.origin + '/camera/')
        );
      })
    )
  );
});
