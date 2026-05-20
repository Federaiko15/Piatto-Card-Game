// qui ci sarà lo script eseguito dal service worker, che gestirà lo stato offline del gioco

// Versione semrpe da aggiornare in caso di modifiche al file
const CACHE_NAME = "piatto-cache-v6";

// Asset di base dell'applicazione
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/auth.png",
];

// Genero anche qui tutti i percorsi delle carte che prendo dalla cartella cards in public
const generateCardAssets = () => {
  const assets = [];
  const suits = ["denari", "bastoni", "spade", "coppe"];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const seme of suits) {
    for (const value of values) {
      // IMPORTANTE: Il percorso deve corrispondere a dove si trovano le immagini nella cartella `public`.
      // Se le tue carte sono in `public/assets/cards/`, il percorso corretto è `/assets/cards/`.
      assets.push(`./cards/${seme}_${value}.png`);
    }
  }

  assets.push("./cards/back.png");
  assets.push("/assets/table.png"); // Immagine del tavolo da gioco

  return assets;
};

const CARD_ASSETS = generateCardAssets();

// Uniamo tutti gli asset da mettere in cache all'installazione
const ASSETS_TO_CACHE = [...CORE_ASSETS, ...CARD_ASSETS];

self.addEventListener("install", (event) => {
  console.log("Installing Service Worker... Caching assets.");

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Usiamo un ciclo for invece di addAll per evitare che un singolo 404 faccia fallire tutto
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`Impossibile mettere in cache l'asset: ${asset}`, err);
        }
      }
    }),
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
      .catch((error) => {
        // Ignoriamo gli errori di aborto dovuti al cambio/aggiornamento pagina
        if (error.name !== "AbortError" && !error.message.includes("aborted")) {
          console.log(
            "Sei offline o la risorsa non è raggiungibile:",
            event.request.url,
          );
        }
      }),
  );
});
