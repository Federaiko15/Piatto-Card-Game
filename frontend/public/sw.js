// qui ci sarà lo script eseguito dal service worker, che gestirà lo stato offline del gioco
const assets = ["/index.html", "/public/cards", "/assets"];

const CACHE_NAME = "piatto-cache-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  console.log("Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  console.log("Activating");

  // Elimina le vecchie cache quando aggiorno CACHE_NAME
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: pulizia vecchia cache", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  // evento che gestisce il collegamento tra il server e la proxy
  if (event.request.method !== "GET") return;

  // Intercetto le chiamate api che viaggiano tra il client e il server
  if (event.request.url.includes("/api/v1/")) return;

  event.respondWith(
    caches
      .match(event.request.url)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // se troviamo il file in cache lo restituiamo subito
        }

        return fetch(event.request).then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
      .catch(() => {
        console.log("Sei offline e la risorsa non è in cache.");
      }),
  );
});
