const CACHE_NAME = 'whiteboard-photo-booth-v2';
const urlsToCache = [
  '.',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './components/CameraView.tsx',
  './components/ChalkboardInput.tsx',
  './components/Icons.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return response from cache if available
        if (response) {
          return response;
        }

        // Otherwise, fetch from network, cache it, and return it
        return fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = networkResponse.clone();

          cache.put(event.request, responseToCache);
          
          return networkResponse;
        }).catch(err => {
            console.error('Fetch failed; returning offline page instead.', err);
            // If the fetch fails, you might want to return a fallback page.
            // For this app, if the initial assets are cached, it should work.
        });
      });
    })
  );
});