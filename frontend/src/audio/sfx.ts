import type { MouseEvent } from "react";
import { sfxFiles } from "../art/manifest";

// I suoni del gioco: ogni momento ha un nome, e il file con quel nome in src/art/sfx viene suonato.
// Finché i file non ci sono, playSfx non fa niente.

export type SfxName =
  | "card_flip"
  | "coins"
  | "lose"
  | "big_win"
  | "curse"
  | "santino"
  | "shop_buy"
  | "chair"
  | "victory"
  | "button";

const MUTE_KEY = "piattoMuted";

const isMuted = (): boolean => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
};

export const playSfx = (name: SfxName, volume = 0.7) => {
  const url = sfxFiles[name];
  if (!url || isMuted()) return;
  const audio = new Audio(url);
  audio.volume = volume;
  // il browser può bloccare l'audio prima che il giocatore abbia toccato la pagina: non è un errore
  audio.play().catch(() => {});
};

// Il clic dei bottoni di legno: si mette come onClickCapture sul contenitore di una schermata
export const buttonSound = (event: MouseEvent) => {
  if ((event.target as Element).closest(".ui-btn:not(:disabled)")) playSfx("button", 0.5);
};
