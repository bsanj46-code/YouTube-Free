// SPDX-License-Identifier: GPL-3.0-or-later
const CACHE = 'youtube-free-web-v1';
const SHELL = ['./', './index.html', './styles.css', './app.mjs', './core.mjs',
  './config.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
const localShell = new Set(SHELL.map(path => new URL(path, self.location.href).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('youtube-free-web-')
    && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
  } else if (localShell.has(request.url)) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy))); }
      return response;
    }).catch(() => caches.match(request)));
  }
});
