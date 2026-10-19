// public/sw.js — PayLink service worker
//
// Deliberately small. It does three things:
//   1. Shows /offline.html when a page can't load (no signal, load shedding).
//   2. Shows push notifications ("Customer says they've paid").
//   3. Opens the right page when a notification is tapped.
//
// It does NOT cache pages, API calls or Supabase responses. Payment status
// must always come fresh from the server — a cached "Pending" or "Paid" would
// be worse than no page at all.
//
// Bump CACHE_VERSION when offline.html or the icons change.

const CACHE_VERSION = "paylink-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/badge-96.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Only full page loads get the offline fallback. Everything else (JS, data,
// images, Server Actions) goes straight to the network untouched.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_VERSION);
      const offline = await cache.match(OFFLINE_URL);
      return offline || Response.error();
    }),
  );
});

// ---- Push notifications ----

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = typeof data.title === "string" ? data.title : "PayLink";
  const options = {
    body: typeof data.body === "string" ? data.body : "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: typeof data.tag === "string" ? data.tag : undefined, // same tag replaces, not stacks
    renotify: Boolean(data.tag),
    vibrate: [100, 50, 100],
    data: { url: typeof data.url === "string" ? data.url : "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Only ever open pages on our own site, whatever the payload said.
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin);
  if (target.origin !== self.location.origin) {
    target.href = new URL("/dashboard", self.location.origin).href;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.navigate(target.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
