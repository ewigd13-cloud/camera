const CACHE_NAME = 'photo-booth-v1';
const urlsToCache = [
  '/camera/',
  '/camera/manifest.json',
  '/camera/assets/index-D8TP6Foz.js', // ← Viteの出力に合わせて更新
  '/camera/assets/index-Dum9Q8-z.css',
  '/camera/fonts/NotoSerifJP-VariableFont_wght.ttf',
  '/camera/icons/icon-192.png',
  '/camera/icons/icon-512.png',
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// fetch時のキャッシュ制御
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // ナビゲーションは index.html を返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/camera/index.html').then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // その他のリソースはキャッシュ優先＋保存
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request).then(networkResponse => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          !['basic', 'cors'].includes(networkResponse.type)
        ) return networkResponse;

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});