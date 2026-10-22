// Service worker de la demo: permite instalar la app y abrir la interfaz sin red.
// No guarda datos de usuarios ni videos. Subir VERSION al cambiar esta lógica.
const VERSION = 'horizonte-demo-v1';
const PRECARGA = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION)
    .then((c) => Promise.all(PRECARGA.map((u) => c.add(u).catch(() => null))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // nada de terceros (GitHub, etc.)
  if (url.pathname.endsWith('.mp4')) return;             // el video no se cachea

  if (req.mode === 'navigate') {                          // páginas: red primero, caché si no hay red
    e.respondWith(fetch(req).then((r) => {
      if (r.ok) { const c = r.clone(); caches.open(VERSION).then((x) => x.put('./', c)); }
      return r;
    }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(VERSION).then((x) => x.put(req, c)); }
    return r;
  })));
});
