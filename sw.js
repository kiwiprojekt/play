const CACHE_NAME = "kiwiplay-236e5a690a82";
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("./precache.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Offline pack is unavailable");
        return response.json();
      })
      .then((assets) =>
        caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)),
      )
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("kiwiplay-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
// Fresh code online; the complete game pack remains available offline after installation.
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copy))
              .catch(() => {}),
          );
        }
        return response;
      })
      .catch(
        async () => (await caches.match(event.request)) || Response.error(),
      ),
  );
});
