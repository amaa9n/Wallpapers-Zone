const CACHE = 'wallpapers-v1';
const CORE = [ '/', '/index.html', '/css/styles.css', '/js/app.js', '/data/wallpapers.json' ];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
  }
});
