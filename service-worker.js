const CACHE_NAME = 'whiteboard-photo-booth-v2';
const urlsToCache = [
  self.location.origin + '/camera/',
  self.location.origin + '/camera/index.html',
  self.location.origin + '/camera/manifest.json',
  self.location.origin + '/camera/assets/index--DJ-73WN.js',
  self.location.origin + '/camera/assets/index-CTSoWR9A.css',
  self.location.origin + '/camera/icons/icon-192.png',
  self.location.origin + '/camera/icons/icon-512.png',
  // Google Fonts は CORS制限や no-store の可能性があるため除外
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
      .then(() => {
        console.log('Cache addAll succeeded');
      })
      .catch(err => {
        console.error('Cache addAll failed:', err);
      })
  );
});

// アクティベート時に古いキャッシュを完全削除＋即時制御
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
    )
  );
  self.clients.claim();
});

// フェッチ時の分岐：navigateは index.html、それ以外はキャッシュ優先＋精密なフォールバック
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // ✅ 不要な外部API呼び出しを無視（ip2location系）
  if (event.request.url.includes('ip2location-mcc.com')) return;

  // ページ遷移時は index.html を返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).catch(() =>
          caches.match(self.location.origin + '/camera/index.html')
        );
      })
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
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          cache.put(event.request, responseToCache);
          return networkResponse;
        }).catch(() =>
          caches.match(event.request).then(fallback =>
            fallback || caches.match(self.location.origin + '/camera/index.html')
          )
        );
      })
    )
  );
});
