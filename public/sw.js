// Minimal service worker for iOS PWA installation
const CACHE_NAME = 'elocalpass-pwa';

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating');
  event.waitUntil(self.clients.claim());
});

// Fetch event - minimal implementation
self.addEventListener('fetch', function(event) {
  // Just pass through all requests
  event.respondWith(fetch(event.request));
}); 