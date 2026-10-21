const CACHE_NAME = "kiwiplay-19a390b49830";
// A release uses one URL version across HTML, runtime files, and its offline pack.
// This also avoids stale responses in a CDN cache outside the browser.
function versionedURL(value) {
  const url = new URL(value, self.location.origin);
  // Kiosk changes client presentation; its HTML and assets are the same offline files.
  url.searchParams.delete("kiosk");
  if (!url.searchParams.has("v"))
    url.searchParams.set("v", CACHE_NAME.slice("kiwiplay-".length));
  return url.href;
}
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(versionedURL("./precache.json"), { cache: "no-store" })
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
  const url = versionedURL(event.request.url);
  event.respondWith(
    fetch(url, { cache: "no-cache" })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(url, copy))
              .catch(() => {}),
          );
        }
        return response;
      })
      .catch(
        async () => (await caches.match(url)) || Response.error(),
      ),
  );
});
