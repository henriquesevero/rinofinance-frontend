// Minimal service worker giving RinoFinance offline/PWA support without a
// build-time precache manifest: the app shell falls back to a cached index
// when offline, and same-origin static assets are cached as they're used.
const CACHE = "rinofinance-v5"
const APP_SHELL = "/index.html"
const STATIC_ASSETS = ["/", APP_SHELL, "/manifest.webmanifest", "/favicon.svg", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || "RinoFinance"
  const body = data.body || "Hora de atualizar suas finanças 💸"
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "rinofinance-reminder",
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => "focus" in c)
      if (existing) return existing.focus()
      return self.clients.openWindow("/")
    })
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // SPA navigations: network-first, fall back to the cached app shell so the
  // app opens offline and deep links still resolve.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(APP_SHELL, copy))
          return res
        })
        .catch(() => caches.match(APP_SHELL).then((r) => r || caches.match("/")))
    )
    return
  }

  // Never cache API calls — always go to the network.
  if (url.pathname.startsWith("/api/")) return

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
