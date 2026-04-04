const CACHE_NAME = "shopplus-cache-v1";
const APP_PREFIX = "shopplus_";
const GHPATH = "/my-store";

const URLS = [
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/home.html`,
  `${GHPATH}/login.html`,
  `${GHPATH}/signup.html`,
  `${GHPATH}/verify.html`,
  `${GHPATH}/profile.html`,
  `${GHPATH}/product.html`,
  `${GHPATH}/claim-reward.html`,
  `${GHPATH}/manifest.json`,
  `${GHPATH}/icons/icon-192.png`,
  `${GHPATH}/icons/icon-512.png`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_PREFIX + CACHE_NAME).then((cache) => {
      return cache.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(APP_PREFIX) && key !== APP_PREFIX + CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match(`${GHPATH}/index.html`);
          }
        })
      );
    })
  );
});
