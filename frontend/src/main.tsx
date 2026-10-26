import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ITCH } from "./edition";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// su itch.io niente service worker: la cache la gestisce già itch, e il nostro sw.js lì non c'è
if ("serviceWorker" in navigator && import.meta.env.PROD && !ITCH) {
  window.addEventListener("load", () => {
    // aggiungo questo controllo perchè aspetto prima di renderizzare l'intera pagina
    navigator.serviceWorker
      .register("/sw.js")
      .then((serviceWorker) => {
        console.log(
          "Service Worker registrato con successo. Scope: ",
          serviceWorker.scope,
        );
      })
      .catch((error) => {
        console.error("Registrazione del service worker fallita: ", error);
      });
  });
}
