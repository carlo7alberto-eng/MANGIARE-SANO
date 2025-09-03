const CACHE_NAME = 'cibo-sano-cache-v1';
const PRECACHE_URLS = [
  '.', // index.html
  './index.html',
  './manifest.json',
  // aggiungi eventuali risorse esterne che vuoi cache-are (css, immagini locali, ecc.)
];

// Install — cache delle risorse principali
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Activate — pulizia vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch — strategy: cache-first for same-origin, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  // Non cachiamo richieste verso Open Food Facts API (lasciare dinamico)
  if (request.url.includes('world.openfoodfacts.org/api')) {
    return; // lascialo al network
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // cloniamo la risposta per cachearla (solo same-origin e ok)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, clone);
        });
        return response;
      }).catch(() => {
        // fallback: opzionale - potresti restituire una pagina offline statica
        return caches.match('./index.html');
      });
    })
  );
});

