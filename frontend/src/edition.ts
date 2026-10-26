import type { Edition } from "@piatto/game-core";

// L'edizione di questa build: VITE_EDITION=demo per la demo (web, itch.io, Steam), altrimenti il gioco completo.
// Una run salvata resta nell'edizione in cui è iniziata
export const EDITION: Edition = import.meta.env.VITE_EDITION === "demo" ? "demo" : "full";

// La build per itch.io (npm run build:itch): solo la roguelike, che gira tutta nel browser senza backend
export const ITCH = import.meta.env.VITE_TARGET === "itch";

// Un file di public/ (le carte, le icone): BASE_URL è "/" sul sito e "./" su itch.io
export const publicUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
