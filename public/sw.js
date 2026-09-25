// OpenMind offline shell — the low-bandwidth story.
// Strategy: network-first with cache fallback for visited pages and their
// assets — never stale while online, still readable when the connection drops.
// API routes are NEVER cached: grading and diagnostics are live-only, and a
// cached answer would be a lie.
// When nothing is cached (first visit, then offline), navigations fall back
// to the cached /offline plan — never a bare network error, never a throw.
const CACHE = "openmind-v2";
const FALLBACKS = ["/offline", "/"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const p of FALLBACKS) {
        try {
          const res = await fetch(p);
          if (res.ok) await cache.put(p, res.clone());
        } catch { /* first install may be offline; fallbacks fill in later */ }
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // grading is live-only, always

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(event.request);
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        // "You're offline. That's okay." — land on the offline plan, which
        // renders from the last downloaded snapshot with no connection.
        for (const p of FALLBACKS) {
          const fb = await cache.match(p);
          if (fb) return fb;
        }
        return new Response("You're offline. That's okay — reconnect and keep learning.", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })(),
  );
});
