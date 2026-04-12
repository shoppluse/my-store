importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// ===============================
// FIREBASE INIT
// ===============================
firebase.initializeApp({
  apiKey: "AIzaSyC9nL5__J6cEhaQvl2kcAT0m2A2op7-F_c",
  authDomain: "shopplus-108.firebaseapp.com",
  projectId: "shopplus-108",
  storageBucket: "shopplus-108.firebasestorage.app",
  messagingSenderId: "250259887977",
  appId: "1:250259887977:web:cdddd39da04a5575fd8ff8"
});

const messaging = firebase.messaging();

const DEFAULT_URL = "https://shoppluse.github.io/my-store/home.html";
const DEFAULT_ICON = "https://shoppluse.github.io/my-store/icons/icon-192.png";
const DEFAULT_BADGE = "https://shoppluse.github.io/my-store/icons/icon-192.png";

// ===============================
// SAFE URL HELPER
// ===============================
function getSafeUrl(url) {
  try {
    if (!url || typeof url !== "string") return DEFAULT_URL;

    const trimmed = url.trim();
    if (!trimmed) return DEFAULT_URL;

    // If relative path is passed like "home.html" or "/my-store/home.html"
    if (!/^https?:\/\//i.test(trimmed)) {
      return new URL(trimmed, "https://shoppluse.github.io/my-store/").href;
    }

    const parsed = new URL(trimmed);

    // Optional safety: allow only your own domain
    if (parsed.origin !== "https://shoppluse.github.io") {
      return DEFAULT_URL;
    }

    return parsed.href;
  } catch (error) {
    console.error("[firebase-messaging-sw.js] Invalid URL:", url, error);
    return DEFAULT_URL;
  }
}

// ===============================
// BACKGROUND MESSAGE HANDLER
// ===============================
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const title = payload?.notification?.title || "ShopPlus";
  const body = payload?.notification?.body || "You have a new update!";

  const targetUrl = getSafeUrl(
    payload?.fcmOptions?.link ||
    payload?.data?.url ||
    DEFAULT_URL
  );

  const notificationOptions = {
    body,
    icon: payload?.notification?.icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    data: {
      url: targetUrl
    },
    requireInteraction: true
  };

  return self.registration.showNotification(title, notificationOptions);
});

// ===============================
// NOTIFICATION CLICK HANDLER
// ===============================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = getSafeUrl(
    event?.notification?.data?.url || DEFAULT_URL
  );

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      // First try: exact same page already open
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      // Second try: any ShopPlus tab open -> navigate it
      for (const client of clientList) {
        if ("focus" in client && client.url.includes("/my-store/")) {
          if ("navigate" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
          return client.focus();
        }
      }

      // Third: open new tab/window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }).catch((error) => {
      console.error("[firebase-messaging-sw.js] notificationclick error:", error);
      if (clients.openWindow) {
        return clients.openWindow(DEFAULT_URL);
      }
    })
  );
});
