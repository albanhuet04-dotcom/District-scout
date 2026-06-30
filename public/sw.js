self.addEventListener('push', function (event) {
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'District Scout', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'District Scout';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.openWindow(url));
});
