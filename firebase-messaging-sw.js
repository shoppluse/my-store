importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC9nL5__J6cEhaQvl2kcAT0m2A2op7-F_c",
  authDomain: "shopplus-108.firebaseapp.com",
  projectId: "shopplus-108",
  storageBucket: "shopplus-108.firebasestorage.app",
  messagingSenderId: "250259887977",
  appId: "1:250259887977:web:cdddd39da04a5575fd8ff8"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "ShopPlus";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new update!",
    icon: "/my-store/icons/icon-192.png",
    badge: "/my-store/icons/icon-192.png",
    data: {
      url:
        payload?.fcmOptions?.link ||
        payload?.data?.url ||
        "https://shoppluse.github.io/my-store/home.html"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url ||
    "https://shoppluse.github.io/my-store/home.html";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes("/my-store/")) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
