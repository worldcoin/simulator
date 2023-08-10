importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.3.0/workbox-sw.js');

const files = ['/semaphore/semaphore.wasm', '/semaphore/semaphore.zkey'];

workbox.routing.registerRoute(
  ({ url }) => files.includes(url.pathname),
  new workbox.strategies.CacheFirst({
    cacheName: 'semaphore-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      }),
    ],
  })
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('semaphore-cache')
    .then((cache) => cache.addAll(files))
    .then(() => self.clients.matchAll({ includeUncontrolled: true }))
    .then((clients) => {
      clients.forEach((client) =>
        client.postMessage('CACHE_COMPLETE')
      );
    })
    .catch((error) => {
      console.error('Error during service worker installation:', error);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'RETRY_DOWNLOAD') {
    caches.open('semaphore-cache')
    .then((cache) => cache.addAll(files))
    .then(() => self.clients.matchAll({ includeUncontrolled: true }))
    .then((clients) => {
      clients.forEach((client) =>
        client.postMessage('CACHE_COMPLETE')
      );
    })
    .catch((error) => {
      console.error('Error during file download:', error);
    })
  }
});

self.__WB_MANIFEST;
