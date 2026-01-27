// Firebase Messaging Service Worker for HeyDoc
// This handles push notifications when the app is in the background

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config (must match your app's config)
firebase.initializeApp({
  apiKey: "AIzaSyAv2YInxCnvmFHkgpkJAYvh5Q_MI_Qt2qo",
  authDomain: "heydoc-562fe.firebaseapp.com",
  projectId: "heydoc-562fe",
  storageBucket: "heydoc-562fe.firebasestorage.app",
  messagingSenderId: "662640014650",
  appId: "1:662640014650:web:c4298e58ec9bae789dcc03"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'HeyDoc Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/heydoc-icon-192.png',
    badge: '/heydoc-badge-72.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: payload.data?.type === 'new_case', // Keep notification visible for new cases
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Determine URL based on notification type
  let targetUrl = 'https://doctors.heydoccare.com/doctor/dashboard';

  const notificationData = event.notification.data;
  if (notificationData?.type === 'new_case') {
    targetUrl = 'https://doctors.heydoccare.com/doctor/cases';
  } else if (notificationData?.type === 'message') {
    targetUrl = `https://doctors.heydoccare.com/doctor/cases/${notificationData.caseId}`;
  } else if (notificationData?.type === 'payout') {
    targetUrl = 'https://doctors.heydoccare.com/doctor/earnings';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes('doctors.heydoccare.com') && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
