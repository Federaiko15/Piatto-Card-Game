import type { Card } from "../core/cards.js";
import type { Rng } from "../core/rng.js";

// Figure: al tavolo della notte fante, cavallo e re hanno un piccolo effetto, per tutti i giocatori.
// I semi non hanno effetti propri, li usano solo alcuni santini. Il Pupo di Orlando raddoppia le figure.

export type CardEffectId = "fante" | "cavallo" | "re";

// le figure e il loro valore; cosa fanno lo raccontano i dizionari dell'interfaccia
export const CARD_EFFECTS: Record<CardEffectId, { value: number }> = {
  fante: { value: 8 },
  cavallo: { value: 9 },
  re: { value: 10 },
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
  kind: "boss" | "malocchio" | "evento";
}

export const TABLE_MODIFIERS: Record<TableModifierId, TableModifierInfo> = {
  niente_piatto: {
    id: "niente_piatto",
    kind: "boss",
  },
  sei_storto: {
    id: "sei_storto",
    kind: "malocchio",
  },
  malocchio: {
    id: "malocchio",
    kind: "malocchio",
  },
  finanza: {
    id: "finanza",
    kind: "malocchio",
  },
  festa_del_patrono: {
    id: "festa_del_patrono",
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
