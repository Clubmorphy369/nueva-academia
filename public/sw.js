const CACHE_NAME = 'academia-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/config/firebase.js',
  '/src/config/roles.js',
  '/src/config/defaultSettings.js',
  '/src/state/auth.js',
  '/src/state/data.js',
  '/src/state/ui.js',
  '/src/services/firestore.js',
  '/src/services/storage.js',
  '/src/services/notifications.js',
  '/src/services/theme.js',
  '/src/services/i18n.js',
  '/src/utils/validators.js',
  '/src/utils/formatters.js',
  '/src/components/toast.js',
  '/src/components/modal.js',
  '/src/components/loader.js',
  '/src/components/sidebar.js',
  '/src/components/notification-center.js',
  '/src/components/block-editor.js',
  '/src/components/task-card.js',
  '/src/components/submission-card.js',
  '/src/components/chat-box.js',
  '/src/components/jitsi-meeting.js',
  '/src/components/calendar.js',
  '/src/components/charts.js',
  '/src/views/auth.js',
  '/src/views/home.js',
  '/src/views/courses.js',
  '/src/views/lessons.js',
  '/src/views/tasks.js',
  '/src/views/entregas.js',
  '/src/views/forum.js',
  '/src/views/progress.js',
  '/src/views/calendar.js',
  '/src/views/admin.js',
  '/src/views/leaderboard.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});