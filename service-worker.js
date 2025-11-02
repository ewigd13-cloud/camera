const CACHE_NAME = 'whiteboard-photo-booth-test-v3';
const urlsToCache = [
  self.location.origin + '/camera-test/',
  self.location.origin + '/camera-test/manifest.json',
  self.location.origin + '/camera-test/assets/index-DkbC3GGU.js',
  self.location.origin + '/camera-test/assets/index-_rSp700L.css',
  self.location.origin + '/camera-test/icons/icon-192.png',
  self.location.origin + '/camera-test/icons/icon-512.png',
  self.location.origin + '/camera-test/fonts/NotoSerifJP-VariableFont_wght.ttf',
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
  self.clients.claim();
});

// フェッチ時の分岐：navigateは index.html、それ以外はキャッシュ優先＋保存
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // ページ遷移（navigate）は index.html を返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(response => {
          return response ||
                 caches.match(self.location.origin + '/camera-test/') ||
                 caches.match(self.location.origin + '/camera-test/index.html');
        })
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

          // 拡張子で保存対象を制限（容量対策）
          const cacheableExtensions = /\.(js|css|ttf|png|jpg|jpeg|svg|webp)$/;
          if (cacheableExtensions.test(event.request.url)) {
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);
          }

          return networkResponse;
        }).catch(() =>
          caches.match(self.location.origin + '/camera-test/')
        );
      })
    )
  );
});