const CACHE_NAME = 'whiteboard-photo-booth-v3'; // ← v2 → v3 に更新
const urlsToCache = [
  self.location.origin + '/camera/index.html', // ← 明示的に追加
  self.location.origin + '/camera/manifest.json',
  self.location.origin + '/camera/assets/index-D8TP6Foz.js',
  self.location.origin + '/camera/assets/index-Dum9Q8-z.css',
  self.location.origin + '/camera/icons/icon-192.png',
  self.location.origin + '/camera/icons/icon-512.png',
  self.location.origin + '/camera/fonts/NotoSerifJP-VariableFont_wght.ttf',
];

// インストール時にキャッシュ登録
self.addEventListener('install', event => {
  self.skipWaiting(); // ← 即時制御
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('❌ Cache addAll failed:', err);
      })
  );
});

// アクティベート時に古いキャッシュ削除＋即時制御
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim(); // ← 全タブ即時制御
});

// フェッチ時の分岐：navigateは index.html、それ以外はキャッシュ優先
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // ページ遷移（navigate）は index.html を返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(self.location.origin + '/camera/index.html').then(response => {
        return response || fetch(event.request);
      }).catch(() => caches.match(self.location.origin + '/camera/index.html'))
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
          console.error('❌ Fetch failed:', err);
          return caches.match(self.location.origin + '/camera/index.html');
        });
      });
    })
  );
});