const CACHE_NAME = "shopplus-v3";

const urlsToCache = [
  "/my-store/",
  "/my-store/index.html",
  "/my-store/login.html",
  "/my-store/signup.html",
  "/my-store/verify.html",
  "/my-store/profile.html",
  "/my-store/product.html",
  "/my-store/claim-reward.html",
  "/my-store/manifest.json",
  "/my-store/products.json",
  "/my-store/icons/icon-192.png",
  "/my-store/icons/icon-512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// ACTIVATE
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

// FETCH
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip Firebase CDN files completely
  if (
    url.origin.includes("gstatic.com") ||
    url.origin.includes("googleapis.com") ||
    url.pathname.includes("firebase-messaging-sw.js")
  ) {
    return;
  }

  // NETWORK FIRST for HTML pages (important for latest updates)
  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.endsWith(".html")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CACHE FIRST for static assets (icons, json, images, css, js)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});
