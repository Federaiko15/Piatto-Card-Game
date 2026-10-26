import { useSyncExternalStore } from "react";
import { en } from "./en";
import { it, type CharacterId, type Text } from "./it";

// La lingua del gioco: alla prima visita quella del browser (italiano per chi ha il browser in italiano,
// inglese per tutti gli altri), poi quella scelta nel menu, che resta salvata.

export type Lang = "it" | "en";
export type { Text };
export const LANGS: Lang[] = ["it", "en"];

const DICTIONARIES: Record<Lang, Text> = { it, en };
const KEY = "piattoLang";

const detect = (): Lang => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "it" || saved === "en") return saved;
  } catch {
    // salvataggio non disponibile
  }
  return navigator.language?.toLowerCase().startsWith("it") ? "it" : "en";
};

let current: Lang = detect();
document.documentElement.lang = current;
const listeners = new Set<() => void>();

export const setLang = (lang: Lang) => {
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // la lingua vale solo per questa visita
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useLang = (): Lang => useSyncExternalStore(subscribe, () => current);

// I testi nella lingua scelta; il componente si ridisegna quando la lingua cambia
export const useText = (): Text => DICTIONARIES[useLang()];

// Nome e carattere di un personaggio (gli avversari sono identificati dal personaggio, non dal nome)
export const characterText = (t: Text, character: string) =>
  t.characters[character as CharacterId] ?? { name: character, tagline: "" };
