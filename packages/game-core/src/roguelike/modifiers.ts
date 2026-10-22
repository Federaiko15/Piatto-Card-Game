import type { Card } from "../core/cards.js";
import type { Rng } from "../core/rng.js";

// Figure: al tavolo della notte fante, cavallo e re hanno un piccolo effetto, per tutti i giocatori.
// I semi non hanno effetti propri, li usano solo alcuni santini. Il Pupo di Orlando raddoppia le figure.

export type CardEffectId = "fante" | "cavallo" | "re";

export interface CardEffectInfo {
  name: string;
  effect: string;
}

export const CARD_EFFECTS: Record<CardEffectId, CardEffectInfo> = {
  fante: { name: "Fante (8)", effect: "ruba 1 moneta all'avversario più ricco" },
  cavallo: { name: "Cavallo (9)", effect: "il turno salta il prossimo giocatore" },
  re: { name: "Re (10)", effect: "raddoppia la vincita" },
};

export const FIGURES: Partial<Record<number, CardEffectId>> = { 8: "fante", 9: "cavallo", 10: "re" };

// Malocchi ed eventi: regole che valgono per un tavolo intero. I boss hanno la loro regola fissa,
// gli altri tavoli possono avere un evento che si scopre in bottega, prima di sedersi.

export type TableModifierId =
  | "niente_piatto"
  | "sei_storto"
  | "malocchio"
  | "finanza"
  | "festa_del_patrono";

export interface TableModifierInfo {
  id: TableModifierId;
  name: string;
  effect: string;
  kind: "boss" | "malocchio" | "evento";
}

export const TABLE_MODIFIERS: Record<TableModifierId, TableModifierInfo> = {
  niente_piatto: {
    id: "niente_piatto",
    name: "Niente Piatto",
    effect: "Al tavolo del Prete nessuno può puntare più di metà del piatto.",
    kind: "boss",
  },
  sei_storto: {
    id: "sei_storto",
    name: "Il 6 storto",
    effect: "A questo tavolo i 6 perdono.",
    kind: "malocchio",
  },
  malocchio: {
    id: "malocchio",
    name: "Malocchio",
    effect: "Il 7 di spade porta sfortuna: chi lo pesca perde la puntata.",
    kind: "malocchio",
  },
  finanza: {
    id: "finanza",
    name: "Arriva la Finanza",
    effect: "Quando ti siedi perdi il 10% delle tue monete.",
    kind: "malocchio",
  },
  festa_del_patrono: {
    id: "festa_del_patrono",
    name: "Festa del patrono",
    effect: "A questo tavolo ogni vincita paga 1 moneta in più, a tutti.",
    kind: "evento",
  },
};

export const CURSED_CARD: Card = { seed: "spade", value: 7 };

export const FINANZA_RATE = 0.1;

const EVENT_POOL: readonly TableModifierId[] = [
  "sei_storto",
  "malocchio",
  "finanza",
  "festa_del_patrono",
];

// Una volta su tre il tavolo successivo è tranquillo, altrimenti c'è un evento
export const rollTableEvent = (rng: Rng): TableModifierId | null => {
  if (rng() < 1 / 3) return null;
  return EVENT_POOL[Math.floor(rng() * EVENT_POOL.length)];
};
