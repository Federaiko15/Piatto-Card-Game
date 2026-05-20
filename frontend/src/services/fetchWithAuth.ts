// REQUESTINIT è un tipo nativo react che mi permette di utilizzare un tipo che contiene tutto quello che potrebbe essere passato
// in una chiamata fetch. quindi tutto quello presente nel body ma anche tutto quello presente nell'header.

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const accessToken = localStorage.getItem("tokenPiatto");

  // preparo gli header con il token
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Aggiungiamo credentials: "include" in modo che il browser accetti
  // i comandi Set-Cookie (come il clearCookie) inviati dal server
  const finalOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || "include",
  };

  // 3. Fa la chiamata originale con l'oggetto completo con tutti i campi necessari
  console.log(`[fetchWithAuth] Richiesta iniziale a: ${url}`);
  let response = await fetch(url, finalOptions);

  // 4. Se il token è scaduto o non valido, il backend risponde 401 (o 403)
  if (response.status === 401 || response.status === 403) {
    console.log(
      `[fetchWithAuth] Ricevuto errore ${response.status} da ${url}. Access Token scaduto! Tento il refresh...`,
    );

    try {
      console.log(
        `[fetchWithAuth] Chiamo l'endpoint di refresh: /api/v1/users/refresh`,
      );
      // Chiamo la rotta di refresh (credentials: "include" è FONDAMENTALE per inviare il cookie httpOnly)
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/refresh`,
        {
          method: "POST",
          credentials: "include", // fondamentale perchè così react dice al browser di utilizzare il refresh token salvato in maniera
          // sicura in un http cookie
        },
      );

      console.log(
        `[fetchWithAuth] Risposta dal refresh: ${refreshResponse.status}`,
      );

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        console.log(
          `[fetchWithAuth] Refresh token valido, nuovo access token ricevuto!`,
        );

        // 5. Salvo il nuovo token
        localStorage.setItem("tokenPiatto", data.accessToken);

        // 6. E riprovo la chiamata originale con il nuovo headers dentro il quale inserisco il token aggiornato
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${data.accessToken}`,
        };
        console.log(
          `[fetchWithAuth] Riprovo la richiesta originale a: ${url} con il nuovo token...`,
        );
        response = await fetch(url, { ...finalOptions, headers: newHeaders });
        console.log(
          `[fetchWithAuth] Esito della richiesta riprovata: ${response.status}`,
        );
      } else {
        // Il refresh token è scaduto o invalido. L'utente deve rifare il login vero e proprio.
        console.log(
          "Refresh token scaduto. Tento il logout e ritorno al login.",
        );

        // Chiamiamo l'endpoint di logout per assicurarci che l'utente non rimanga bloccato su 'online'
        try {
          await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/users/forcedLogout`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              credentials: "include",
            },
          );
        } catch (e) {
          console.error("Errore durante il logout forzato", e);
        }

        localStorage.removeItem("tokenPiatto");
        window.location.href = "/"; // Reindirizzamento forzato al login
      }
    } catch (error) {
      console.error("Errore durante il refresh del token", error);
    }
  }

  return response;
};
