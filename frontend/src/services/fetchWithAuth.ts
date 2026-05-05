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

  // 3. Fai la chiamata originale
  let response = await fetch(url, { ...options, headers });

  // 4. Se il token è scaduto, il backend risponde 401
  if (response.status === 401) {
    console.log("Access Token scaduto! Tento il refresh...");

    try {
      // Chiamo la rotta di refresh (credentials: "include" è FONDAMENTALE per inviare il cookie httpOnly)
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/refresh`,
        {
          method: "GET",
          credentials: "include", // fondamentale perchè così react dice al browser di utilizzare il refresh token salvato in maniera
          // sicura in un http cookie
        },
      );

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();

        // 5. Salvo il nuovo token
        localStorage.setItem("tokenPiatto", data.accessToken);

        // 6. RIPROVO la chiamata originale con il nuovo token
        headers["Authorization"] = `Bearer ${data.accessToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        // Il refresh token è scaduto o invalido. L'utente deve rifare il login vero e proprio.
        console.log("Refresh token scaduto. Ritorno al login.");
        localStorage.removeItem("tokenPiatto");
        window.location.href = "/"; // Reindirizzamento forzato al login
      }
    } catch (error) {
      console.error("Errore durante il refresh del token", error);
    }
  }

  return response;
};
