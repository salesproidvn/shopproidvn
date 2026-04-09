/* Service Worker for Ocean Pro Web PWA */
/* Handles push notifications and caching */

const CACHE_NAME = 'ocean-pro-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  let data = { title: 'Ocean Pro Web', body: 'Bạn có thông báo mới', icon: '/icon-192.png' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'order-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/dashboard',
      order_id: data.order_id || '',
    },
    actions: [
      { action: 'view', title: 'Xem đơn hàng' },
      { action: 'dismiss', title: 'Bỏ qua' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Đơn hàng mới!', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return clients.openWindow(urlToOpen);
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  // Analytics or logging could go here
});
