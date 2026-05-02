import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
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
