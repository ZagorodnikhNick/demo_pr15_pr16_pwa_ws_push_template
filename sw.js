/**
 * Service Worker (Практики 15–16)
 *
 * Практика 15:
 * - HTTPS + App Shell: оболочка приложения (index.html) и статика должны работать офлайн.
 * - Контент вынесен в /content/*.html и подгружается fetch‑ом.
 * - Для контента обычно подходит стратегия Network First (если сеть есть — обновить, иначе взять из кеша).
 *
 * Практика 16:
 * - Push API: Service Worker принимает push‑события и показывает уведомления.
 */

const SHELL_CACHE = 'pwa-shell-v1';
const RUNTIME_CACHE = 'pwa-runtime-v1';

// --- App Shell (precache) ---
// Это «оболочка»: минимальный набор, чтобы приложение стартовало офлайн.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/assets/hero.png',

  // Иконки (важно для установки PWA)
  '/assets/icons/favicon.ico',
  '/assets/icons/favicon-16x16.png',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/favicon-48x48.png',
  '/assets/icons/favicon-64x64.png',
  '/assets/icons/favicon-128x128.png',
  '/assets/icons/favicon-256x256.png',
  '/assets/icons/favicon-512x512.png',
  '/assets/icons/apple-touch-icon.png'
];

// Контентные страницы (App Shell)
const CONTENT_PAGES = [
  '/content/home.html',
  '/content/theory.html',
  '/content/push.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_ASSETS);

      // Практика 15: можно также положить стартовый контент в precache
      // (чтобы навигация работала офлайн сразу).
      // TODO (студентам): решите, нужно ли precache для content.
      await cache.addAll(CONTENT_PAGES);
    })()
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );

      self.clients.claim();
    })()
  );
});

/**
 * Fetch handler
 *
 * 1) App Shell: Cache First (быстро и офлайн)
 * 2) /content/*.html: Network First (обновляем при наличии сети)
 * 3) Остальное: simple fallback (Cache First)
 */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1) Контентные страницы (App Shell): Network First
  if (url.pathname.startsWith('/content/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 2) «Оболочка» и статика: Cache First
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    // TODO (студентам): можно положить часть ресурсов в runtime cache
    return res;
  } catch {
    return new Response('Офлайн: ресурс недоступен и не найден в кеше.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const res = await fetch(request);
    // Кешируем свежую версию
    cache.put(request, res.clone());
    return res;
  } catch {
    // Сети нет — отдаём из runtime cache
    const cached = await cache.match(request);
    if (cached) return cached;

    // Последний шанс — shell cache (если положили content в precache)
    const shellCached = await caches.match(request);
    if (shellCached) return shellCached;

    return new Response('Офлайн: контент недоступен и не найден в кеше.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// =========================
// Практика 16: Push API
// =========================

self.addEventListener('push', (event) => {
  // payload обычно приходит строкой JSON
  const data = event.data ? safeJson(event.data.text()) : {};

  const title = data.title || 'PWA уведомление';
  const options = {
    body: data.body || 'У вас новое событие.',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Если вкладка уже открыта — фокусируем её
      for (const client of allClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }

      // Иначе открываем новую
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
