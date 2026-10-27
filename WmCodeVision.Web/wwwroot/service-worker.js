// Bump this version whenever the offline shell changes. Updates activate after old tabs close.
const PREFIX = 'wm-code-vision-' + self.registration.scope + '-';
const CACHE = PREFIX + 'v4';
const ASSETS = [
  "contact.html",
  "content-showcase.css",
  "drone-footage.html",
  "index.html",
  "interactive.css",
  "offline.html",
  "pwa.js",
  "script.js",
  "social-media.html",
  "software.css",
  "software.html",
  "styles.css",
  "manifest.webmanifest",
  "logo-cropped.jpg",
  "helmeringhausen-drone-poster.jpg",
  "DJI_0211-poster.jpg",
  "DJI_0227-poster.jpg",
  "DJI_0478-poster.jpg",
  "code-vision-preview.jpg",
  "farm-app-preview.jpg",
  "work-wise-preview.jpg",
  "IMG-20261023-WA0005.jpg",
  "IMG-20261023-WA0006.jpg",
  "IMG-20261023-WA0008.jpg",
  "icons/favicon-16.png",
  "icons/favicon-32.png",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];
const assetUrls = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    [...assetUrls].map(url => new Request(url, { cache: 'reload' }))
  )));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.headers.has('range') ||
      url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  const canonical = new URL(url.pathname === new URL(self.registration.scope).pathname ? 'index.html' : url.pathname, self.registration.scope);
  const key = canonical.href;
  if (request.mode !== 'navigate' && !assetUrls.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Prefer fresh server content; only explicitly listed public files are stored.
    try {
      const response = await fetch(request, { signal: AbortSignal.timeout(5000) });
      if (response.ok && response.type === 'basic' && assetUrls.has(key)) {
        await cache.put(key, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      return (await cache.match(key)) || (request.mode === 'navigate'
        ? await cache.match(new URL('offline.html', self.registration.scope).href)
        : Response.error());
    }
  })());
});
