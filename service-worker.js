/* ==========================================
   Roastify AI — Service Worker
   Adds offline support + install support.
   Does NOT alter any app logic in script.js /
   roasts.js — those are loaded and cached as-is.
========================================== */

const CACHE_VERSION = "v1";
const CACHE_NAME = "roastify-ai-" + CACHE_VERSION;

// Paths are relative to this file's location so this works
// correctly under the GitHub Pages project subpath (/Roast-apk/).
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./roasts.js",
  "./manifest.json",
  "./offline.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png"
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("roastify-ai-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Navigation requests (HTML): network-first, fall back to cache, then offline page.
// - Same-origin static assets: cache-first, then network, then update cache.
// - Cross-origin (fonts, GTM/GA, etc.): network passthrough, cached opportunistically.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Navigation (page loads)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./offline.html"))
        )
    );
    return;
  }

  if (isSameOrigin) {
    // Cache-first for local static assets
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached);
      })
    );
  } else {
    // Network-first for third-party (fonts, GTM/GA), cache as fallback only
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
