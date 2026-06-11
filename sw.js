/* HorasApp Pro — Service Worker (offline-first)
   Cachea el shell de la app para que funcione sin conexión.
   Sube el número de versión del caché cuando cambies archivos. */
const CACHE = "horasapp-pro-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Estrategia: cache-first para el shell, network-first como respaldo.
   Los datos del usuario viven en localStorage, no en el caché. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Solo gestionamos el shell de la app (mismo origen). Supabase y CDNs van directos a la red,
  // así la sincronización nunca devuelve datos cacheados/obsoletos.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
