/* eslint-disable no-undef */
// public/firebase-messaging-sw.js

// This file is loaded by the main PWA service worker (sw.js) via importScripts.
// It handles background push notifications from Firebase Cloud Messaging natively,
// avoiding the need to load large Firebase SDK scripts in the worker.

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      try {
        payload = { notification: { body: event.data.text() } };
      } catch (err) {
        payload = {};
      }
    }
  }

  // Extract notification details
  const notificationTitle = payload.notification?.title || 'Review Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Your scheduled flashcards are ready for review!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'fcm-reminder',
    renotify: true,
    data: payload.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
