/* Service Worker: Offline-Betrieb für Abnahmeprotokoll.ch
   Bei jeder Änderung an den Seiten VERSION erhöhen, damit alte Caches verworfen werden. */
const VERSION = 'v2';
const CACHE = 'abnahme-' + VERSION;
const SHELL = [
  '/', '/app', '/impressum', '/datenschutz', '/404.html',
  '/manifest.webmanifest',
  '/fonts/fonts.css', '/fonts/ibm-plex-sans-latin.woff2', '/fonts/ibm-plex-sans-latin-ext.woff2', '/fonts/ibm-plex-sans-italic-latin.woff',
  '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png'
];

const cacheable = r => r && ((r.ok && !r.redirected) || r.type === 'opaque');

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // einzeln, damit eine fehlende Datei nicht die ganze Installation verhindert
      Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('abnahme-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return; // Feedback-/Kontaktformulare (POST) gehen direkt ans Netz
  const url = new URL(req.url);

  // Seiten: Netz zuerst (immer aktuell), bei Offline aus dem Cache
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (cacheable(res)) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(async () => {
        const c = await caches.open(CACHE);
        return (await c.match(req, { ignoreSearch: true }))
          || (await c.match(url.pathname.startsWith('/app') ? '/app' : '/'))
          || (await c.match('/404.html'));
      })
    );
    return;
  }

  // Eigene Dateien (Icons, Schriften, Manifest): Cache zuerst
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (cacheable(res)) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
