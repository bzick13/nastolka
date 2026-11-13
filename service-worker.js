const CACHE_NAME = 'nastolka';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './games/draw.js',
  './games/speak.js',
  './games/show.js',
  './games/reverse.js',
  './games/yesno.js',
  './games/blitz.js',
  './games/dice.js',
  './games/rules.js'
];

/* ============ INSTALL ============ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())   // не ждём закрытия вкладок
  );
});

/* ============ ACTIVATE ============ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // сразу берём контроль над страницами
  );
});

/* ============ FETCH ============ */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  const dest = event.request.destination;

  // HTML, JS, CSS, manifest → Network First (всегда свежие)
  const isNetworkFirst =
    event.request.mode === 'navigate' ||
    dest === 'script' ||
    dest === 'style' ||
    dest === 'document' ||
    url.endsWith('manifest.json') ||
    url.endsWith('/');

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Остальное (иконки и т.п.) → Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
