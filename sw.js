const CACHE_NAME = "shopplus-v2";

const urlsToCache = [
  "/my-store/",
  "/my-store/index.html",
  "/my-store/home.html",
  "/my-store/login.html",
  "/my-store/signup.html",
  "/my-store/verify.html",
  "/my-store/profile.html",
  "/my-store/product.html",
  "/my-store/claim-reward.html",
  "/my-store/manifest.json",
  "/my-store/icons/icon-192.png",
  "/my-store/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
