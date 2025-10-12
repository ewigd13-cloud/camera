const urlsToCache = [
  self.location.origin + '/camera/', // ✅ ← これが重要
  self.location.origin + '/camera/manifest.json',
  self.location.origin + '/camera/assets/index-D8TP6Foz.js',
  self.location.origin + '/camera/assets/index-Dum9Q8-z.css',
  self.location.origin + '/camera/icons/icon-192.png',
  self.location.origin + '/camera/icons/icon-512.png',
  self.location.origin + '/camera/fonts/NotoSerifJP-VariableFont_wght.ttf',
];

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