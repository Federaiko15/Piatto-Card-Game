import type { Edition } from "@piatto/game-core";

// L'edizione di questa build: VITE_EDITION=demo per la demo (web, itch.io, Steam), altrimenti il gioco completo.
// Una run salvata resta nell'edizione in cui è iniziata
export const EDITION: Edition = import.meta.env.VITE_EDITION === "demo" ? "demo" : "full";

// La build per itch.io (npm run build:itch): solo la roguelike, che gira tutta nel browser senza backend
export const ITCH = import.meta.env.VITE_TARGET === "itch";

// Un file di public/ (le carte, le icone): BASE_URL è "/" sul sito e "./" su itch.io.
// L'indirizzo diventa assoluto rispetto alla pagina: passato al CSS in una variabile, un percorso relativo
// verrebbe risolto a partire dal foglio di stile in assets/ e non si troverebbe
export const publicUrl = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href;
