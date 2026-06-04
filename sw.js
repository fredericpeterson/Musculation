const CACHE = 'musculation-v1';
const ASSETS = [
  '/musculation/',
  '/musculation/index.html',
  '/musculation/manifest.json',
  '/musculation/icon-192.png',
  '/musculation/icon-512.png'
];

// Installation : mise en cache des assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : cache-first pour les assets, network-first pour l'API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // L'API Anthropic : toujours réseau (pas de cache)
  if (url.hostname === 'api.anthropic.com') return;

  // Google Fonts : réseau avec fallback cache
  if (url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets locaux : cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
