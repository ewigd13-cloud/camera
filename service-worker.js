const CACHE_NAME = 'whiteboard-photo-booth-v2';
const urlsToCache = [
  self.location.origin + '/camera/',
  self.location.origin + '/camera/index.html',
  self.location.origin + '/camera/manifest.json',
  self.location.origin + '/camera/assets/index--DJ-73WN.js',
  self.location.origin + '/camera/assets/index-CTSoWR9A.css',
  self.location.origin + '/camera/icons/icon-192.png',
  self.location.origin + '/camera/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=swap',
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

  // ページ遷移（navigate）は index.html を返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(self.location.origin + '/camera/index.html')
        .then(response => response || fetch(event.request))
        .catch(err => {
          console.error('Navigation fetch failed:', err);
          return caches.match(self.location.origin + '/camera/index.html');
        })
    );
    return;
  }

  // 通常のリソース取得（JS/CSS/画像など）
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
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
        }).catch(err => {
          console.error('Fetch failed:', err);
          return caches.match(self.location.origin + '/camera/index.html');
        });
      });
    })
  );
});