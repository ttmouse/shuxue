// 数学思维训练 — Service Worker
const CACHE = 'math-game-v1';
const URLS = [
  '/math-game/',
  '/math-game/index.html',
  '/math-game/css/style.css',
  '/math-game/js/lucide.js',
  '/math-game/js/knowledge.js',
  '/math-game/js/questions.js',
  '/math-game/js/wrongbook.js',
  '/math-game/js/stats.js',
  '/math-game/js/sound.js',
  '/math-game/js/framework.js',
  '/math-game/js/app.js',
  '/math-game/js/modes/game24.js',
  '/math-game/js/modes/clever.js',
  '/math-game/js/modes/card-draw.js',
  '/math-game/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
