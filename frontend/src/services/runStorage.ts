import type { RunState } from "@piatto/game-core";

// La run del roguelike vive solo sul dispositivo: si salva dopo ogni mossa e si riprende con "Continua".
// Se il formato della run cambia in modo incompatibile basta cambiare la versione nella chiave.
const RUN_KEY = "piattoRun:v1";
const NAME_KEY = "piattoRunName";

// localStorage può non esserci o lanciare un errore (navigazione privata, spazio pieno): in quel caso
// si gioca lo stesso, solo senza salvataggio
export const loadRun = (): RunState | null => {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as RunState;
    return run?.table?.players && run.phase ? run : null;
  } catch {
    return null;
  }
};

export const saveRun = (run: RunState) => {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    // salvataggio non disponibile
  }
};

export const clearRun = () => {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // salvataggio non disponibile
  }
};

export const loadHeroName = (): string => {
  try {
    return localStorage.getItem(NAME_KEY) || "Giocatore";
  } catch {
    return "Giocatore";
  }
};

export const saveHeroName = (name: string) => {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // salvataggio non disponibile
  }
};
