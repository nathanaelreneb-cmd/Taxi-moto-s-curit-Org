self.addEventListener('push', function (event) {
  let data = { title: 'Sécurité Taxis-Motos', body: 'Nouvelle alerte.' };
  try {
    data = event.data.json();
  } catch (e) {
    // ignore, use default
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      badge: '/icon.png',
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
