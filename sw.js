const CACHE_NAME = "shopplus-v4";

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
  "/my-store/products.json",
  "/my-store/icons/icon-192.png",
  "/my-store/icons/icon-512.png"
];

// ================================
// FIREBASE COMPAT IMPORTS (for SW)
// ================================
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// ================================
// FIREBASE INIT
// ================================
firebase.initializeApp({
  apiKey: "AIzaSyC9nL5__J6cEhaQvl2kcAT0m2A2op7-F_c",
  authDomain: "shopplus-108.firebaseapp.com",
  projectId: "shopplus-108",
  storageBucket: "shopplus-108.firebasestorage.app",
  messagingSenderId: "250259887977",
  appId: "1:250259887977:web:cdddd39da04a5575fd8ff8"
});

const messaging = firebase.messaging();

// ================================
// INSTALL
// ================================
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// ================================
// ACTIVATE
// ================================
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

// ================================
// FETCH
// ================================
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip Firebase CDN / browser extension / non-http requests
  if (
    url.origin.includes("gstatic.com") ||
    url.origin.includes("googleapis.com") ||
    url.protocol !== "http:" && url.protocol !== "https:"
  ) {
    return;
  }

  // NETWORK FIRST for HTML pages
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
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
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
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        });
    })
  );
});

// ================================
// FIREBASE BACKGROUND MESSAGE
// ================================
messaging.onBackgroundMessage((payload) => {
  console.log("[sw.js] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "ShopPlus";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new update!",
    icon: "/my-store/icons/icon-192.png",
    badge: "/my-store/icons/icon-192.png",
    data: {
      url: "/my-store/home.html"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ================================
// NOTIFICATION CLICK
// ================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/my-store/home.html";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/my-store/") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
