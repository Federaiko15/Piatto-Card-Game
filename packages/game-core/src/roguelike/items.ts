import type { Rng } from "../core/rng.js";

// Gli oggetti della bottega: i santini restano equipaggiati per tutta la notte (la build),
// i consumabili si usano una volta al tavolo nel proprio turno.

export type Rarity = "comune" | "raro" | "leggendario";

export type SantinoId =
  | "san_giuseppe"
  | "corno_rosso"
  | "coppola_del_nonno"
  | "memoria_di_ferro"
  | "santa_rosalia"
  | "fico_d_india"
  | "sant_antonio"
  | "salvadanaio"
  | "pupo_di_orlando";

export type ConsumableId = "brucia" | "passo" | "mischia";

export interface SantinoInfo {
  id: SantinoId;
  name: string;
  effect: string;
  rarity: Rarity;
}

export interface ConsumableInfo {
  id: ConsumableId;
  name: string;
  effect: string;
}

export const MAX_SANTINI = 5;
export const MAX_CONSUMABLES = 2;

export const SANTINI: Record<SantinoId, SantinoInfo> = {
  san_giuseppe: {
    id: "san_giuseppe",
    name: "San Giuseppe",
    effect: "Quando peschi un 5 vinci invece di perdere.",
    rarity: "raro",
  },
  corno_rosso: {
    id: "corno_rosso",
    name: "Corno rosso",
    effect: "La tua prima puntata persa a ogni tavolo ti viene restituita.",
    rarity: "comune",
  },
  coppola_del_nonno: {
    id: "coppola_del_nonno",
    name: "Coppola del nonno",
    effect: "Una volta per tavolo, nel tuo turno, puoi sbirciare la prossima carta.",
    rarity: "raro",
  },
  memoria_di_ferro: {
    id: "memoria_di_ferro",
    name: "Memoria di ferro",
    effect: "Vedi le ultime 5 carte uscite al tavolo.",
    rarity: "comune",
  },
  santa_rosalia: {
    id: "santa_rosalia",
    name: "Santa Rosalia",
    effect: "Dopo 3 puntate perse di fila, la prossima vincita paga il doppio.",
    rarity: "raro",
  },
  fico_d_india: {
    id: "fico_d_india",
    name: "Fico d'India",
    effect: "+1 moneta per ogni carta di bastoni che esce, chiunque la peschi.",
    rarity: "raro",
  },
  sant_antonio: {
    id: "sant_antonio",
    name: "Sant'Antonio",
    effect: "Non paghi mai la posta: né quando ti siedi né quando il piatto si svuota.",
    rarity: "raro",
  },
  salvadanaio: {
    id: "salvadanaio",
    name: "Salvadanaio",
    effect: "A ogni tavolo superato guadagni 1 moneta ogni 10 che hai (massimo 5).",
    rarity: "comune",
  },
  pupo_di_orlando: {
    id: "pupo_di_orlando",
    name: "Pupo di Orlando",
    effect: "Quando peschi una figura il suo effetto vale doppio: il fante ruba 2, il cavallo salta 2 giocatori, il re triplica.",
    rarity: "leggendario",
  },
};

export const CONSUMABLES: Record<ConsumableId, ConsumableInfo> = {
  brucia: {
    id: "brucia",
    name: "Brucia",
    effect: "Scarta la prima carta del mazzo senza guardarla.",
  },
  passo: {
    id: "passo",
    name: "Passo",
    effect: "Salti il turno senza puntare.",
  },
  mischia: {
    id: "mischia",
    name: "Mischia",
    effect: "Rimescola le carte rimaste nel mazzo.",
  },
};

export const RARITY_PRICES: Record<Rarity, number> = {
  comune: 10,
  raro: 18,
  leggendario: 30,
};
export const CONSUMABLE_PRICE = 5;

// Rimescolare la vetrina costa sempre di più nella stessa bottega
export const REROLL_BASE_PRICE = 2;
export const SHOP_SIZE = 3;

export type ShopItem =
  | { kind: "santino"; id: SantinoId; price: number }
  | { kind: "consumable"; id: ConsumableId; price: number };

export interface ShopState {
  offers: (ShopItem | null)[]; // null = già comprato
  rerolls: number;
}

export const rerollPrice = (shop: ShopState): number => REROLL_BASE_PRICE + shop.rerolls;

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

// Ogni posto della vetrina: due volte su tre un santino che l'eroe non ha ancora
// (raro una volta su tre, leggendario una su dodici), altrimenti un consumabile
export const rollShop = (owned: readonly SantinoId[], rng: Rng): (ShopItem | null)[] => {
  const offers: ShopItem[] = [];
  const taken = new Set<SantinoId>(owned);
  for (let i = 0; i < SHOP_SIZE; i++) {
    const free = Object.values(SANTINI).filter((s) => !taken.has(s.id));
    if (free.length > 0 && rng() < 2 / 3) {
      const roll = rng();
      const wanted: Rarity = roll < 0.08 ? "leggendario" : roll < 0.4 ? "raro" : "comune";
      const pool = free.filter((s) => s.rarity === wanted);
      const santino = pick(pool.length > 0 ? pool : free, rng);
      taken.add(santino.id);
      offers.push({ kind: "santino", id: santino.id, price: RARITY_PRICES[santino.rarity] });
    } else {
      const consumable = pick(Object.values(CONSUMABLES), rng);
      offers.push({ kind: "consumable", id: consumable.id, price: CONSUMABLE_PRICE });
    }
  }
  return offers;
};
