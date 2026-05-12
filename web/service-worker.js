const CACHE_NAME = 'kakeibo-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/api.js',
  '/manifest.json',
]

// Install: キャッシュに静的アセットを保存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch: Cache First（静的アセット）+ Network Only（APIリクエスト）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // APIリクエストはキャッシュしない
  if (url.pathname.startsWith('/api/') || url.hostname.includes('workers.dev')) {
    return
  }

  // Google Fonts はネットワークファースト
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // 静的アセット: キャッシュファースト
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const toCache = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache))
        return response
      })
    })
  )
})
