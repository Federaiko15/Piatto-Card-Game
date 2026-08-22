// Service Worker per Piatto Card Game
// Gestione stato offline e caching asset
const CACHE_NAME = "piatto-cache-v8";

// Asset di base dell'applicazione
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/auth.png",
  "/assets/table.png",
  "/cards/back.png",
];

// Genera tutti i percorsi delle carte siciliane
const generateCardAssets = () => {
  const assets = [];
  const suits = ["denari", "bastoni", "spade", "coppe"];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const seme of suits) {
    for (const value of values) {
      assets.push(`/cards/${seme}_${value}.png`);
    }
  }

  return assets;
};

const CARD_ASSETS = generateCardAssets();
const ASSETS_TO_CACHE = [...CORE_ASSETS, ...CARD_ASSETS];

self.addEventListener("install", (event) => {
  console.log("[SW] Installazione nuova versione:", CACHE_NAME);
  // Forza l'attivazione immediata del nuovo Service Worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Impossibile mettere in cache l'asset: ${asset}`, err);
        }
      }
    }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Attivazione nuova versione:", CACHE_NAME);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Pulizia vecchia cache obsoleta:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => {
      // Prende subito il controllo dei client aperti
      return self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // Non intercettare chiamate API, Socket.io o estensioni browser
  if (
    url.includes("/api/v1/") ||
    url.includes("socket.io") ||
    url.startsWith("chrome-extension")
  ) {
    return;
  }

  // Per le richieste di navigazione HTML (quando l'utente cambia pagina o fa refresh)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      }),
    );
    return;
  }

  // Strategia Cache-First per immagini e carte
  if (url.includes("/cards/") || url.includes("/assets/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // Per il resto degli asset: Network con fallback in cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      }),
  );
});
