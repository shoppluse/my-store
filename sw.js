const CACHE_NAME = "shopplus-v6-offline";

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
  "/my-store/plans.html",
  "/my-store/add-product.html",
  "/my-store/apply-affiliate.html",
  "/my-store/offline.html",
  "/my-store/manifest.json",
  "/my-store/products.json",
  "/my-store/apps.json",
  "/my-store/ads.json",
  "/my-store/icons/icon-192.png",
  "/my-store/icons/icon-512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn("Cache failed for:", url, error);
        }
      }
    })
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

  if (request.method !== "GET") return;

  // Ignore Google font/CDN requests
  if (
    url.origin.includes("gstatic.com") ||
    url.origin.includes("googleapis.com")
  ) {
    return;
  }

  // Ignore backend API calls (let them fail normally if offline)
  if (url.origin.includes("onrender.com") && url.pathname.startsWith("/api/")) {
    return;
  }

  // NETWORK FIRST for HTML / page navigation
  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.endsWith(".html")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            });
          }
          return response;
        })
        .catch(async () => {
          // Try exact page from cache first
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          // Fallback to offline page
          const offlinePage = await caches.match("/my-store/offline.html");
          if (offlinePage) return offlinePage;

          return new Response("Offline", {
            status: 503,
            statusText: "Offline"
          });
        })
    );
    return;
  }

  // CACHE FIRST for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            request.url.startsWith(self.location.origin)
          ) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            });
          }
          return response;
        })
        .catch(async () => {
          // If asset exists in cache by exact request
          const fallback = await caches.match(request);
          if (fallback) return fallback;

          // If image fails, show app icon
          if (request.destination === "image") {
            const fallbackImage = await caches.match("/my-store/icons/icon-192.png");
            if (fallbackImage) return fallbackImage;
          }

          return new Response("Offline asset not available", {
            status: 503,
            statusText: "Offline"
          });
        });
    })
  );
});
