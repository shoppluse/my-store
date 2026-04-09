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

// Background notifications (when app is not open)
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification?.title || "ShopPlus";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new update from ShopPlus.",
    icon: "/my-store/icons/icon-192.png",
    badge: "/my-store/icons/icon-192.png",
    data: {
      url: "/my-store/home.html"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Open app when user clicks notification
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/my-store/home.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
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
