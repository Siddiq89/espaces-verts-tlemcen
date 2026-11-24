// Service worker : appli utilisable hors ligne, toujours a jour en ligne.
// Pages et donnees : reseau d'abord (les mises a jour arrivent tout de suite),
// images : cache d'abord. Les appels a la base Supabase ne sont jamais mis en cache ici.
const CACHE = "ev-tlemcen-v3";
const CORE = ["./", "index.html", "config.js", "data.json", "geo.json", "manifest.webmanifest",
  "icon-192.png", "icon-512.png", "fonds/s2.jpg", "fonds/ndvi.jpg", "fonds/wc.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const image = /\.(jpe?g|png|webp)$/i.test(url.pathname);
  if (image) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
      return res;
    })));
  } else {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html"))));
  }
});
