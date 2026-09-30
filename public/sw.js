/* Build replaces SHELL_ASSETS with the exact local hashed build files. */
const VERSION = 'drift-shell-v1';
const SHELL_ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL_ASSETS)));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('drift-shell-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 // Do not intercept any remote request: no Deezer JSONP, cover or preview caching.
 if(url.origin !== self.location.origin || event.request.method !== 'GET') return;
 const allowed = SHELL_ASSETS.map(path => new URL(path, self.registration.scope).href);
 if(event.request.mode === 'navigate') {
  event.respondWith(fetch(event.request).catch(() => caches.match(new URL('./index.html', self.registration.scope))));
 } else if(allowed.includes(url.href)) {
  event.respondWith(caches.match(event.request, {ignoreVary:true}).then(cached => cached || fetch(event.request)));
 }
});
