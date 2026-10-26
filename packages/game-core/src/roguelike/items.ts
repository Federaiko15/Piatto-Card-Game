import type { Rng } from "../core/rng.js";

// Gli oggetti della bottega: i santini restano equipaggiati per tutta la notte (la build),
// i consumabili si usano una volta al tavolo nel proprio turno, i cibi stanno nel panaru e
// rimettono in piedi l'eroe quando è in difficoltà.

export type Rarity = "comune" | "raro" | "leggendario";

// Il gioco esce in due edizioni dallo stesso codice: la demo (web e Steam) e il gioco completo.
// Tavoli, santini e consumabili segnati full: true esistono solo nel gioco completo
export type Edition = "demo" | "full";

export const inEdition = (content: { full?: boolean }, edition: Edition): boolean =>
  edition === "full" || !content.full;

export type SantinoId =
  | "san_giuseppe"
  | "corno_rosso"
  | "coppola_del_nonno"
  | "memoria_di_ferro"
  | "santa_rosalia"
  | "fico_d_india"
  | "sant_antonio"
  | "salvadanaio"
  | "pupo_di_orlando"
  | "patto"
  | "corona_di_ruggero"
  | "sant_agata"
  | "carretto_siciliano"
  | "paladino_rinaldo"
  | "testa_di_moro"
  | "trinacria";

export type ConsumableId = "brucia" | "passo" | "mischia";

// Le specialità di Campobello di Licata; nel gioco completo arriveranno altri cibi siciliani
export type FoodId = "mpanata" | "mpurnatu";

// Nomi ed effetti dei santini, dei consumabili e dei cibi stanno nei dizionari dell'interfaccia
// (italiano e inglese): qui restano solo le regole
export interface SantinoInfo {
  id: SantinoId;
  rarity: Rarity;
  full?: boolean;
  stranger?: boolean; // solo come premio dell'incappucciato: mai in bottega né dalla nonna
}

export interface ConsumableInfo {
  id: ConsumableId;
  full?: boolean;
}

export interface FoodInfo {
  id: FoodId;
  full?: boolean;
}

export const MAX_SANTINI = 5;
// con i santini al completo se ne può comprare uno nuovo lasciandone uno vecchio, poche volte a notte
export const MAX_SWAPS = 2;
export const MAX_CONSUMABLES = 2;
export const MAX_FOODS = 2; // i posti del panaru

export const SANTINI: Record<SantinoId, SantinoInfo> = {
  san_giuseppe: {
    id: "san_giuseppe",
    rarity: "raro",
  },
  corno_rosso: {
    id: "corno_rosso",
    rarity: "comune",
  },
  coppola_del_nonno: {
    id: "coppola_del_nonno",
    rarity: "raro",
  },
  memoria_di_ferro: {
    id: "memoria_di_ferro",
    rarity: "comune",
  },
  santa_rosalia: {
    id: "santa_rosalia",
    rarity: "raro",
  },
  fico_d_india: {
    id: "fico_d_india",
    rarity: "raro",
  },
  sant_antonio: {
    id: "sant_antonio",
    rarity: "raro",
  },
  salvadanaio: {
    id: "salvadanaio",
    rarity: "comune",
  },
  pupo_di_orlando: {
    id: "pupo_di_orlando",
    rarity: "leggendario",
  },
  patto: {
    id: "patto",
    rarity: "leggendario",
    stranger: true,
  },
  corona_di_ruggero: {
    id: "corona_di_ruggero",
    rarity: "leggendario",
    stranger: true,
  },
  // Le build: carte basse, semi, figure. Nella demo c'è un esempio di ognuna e un solo leggendario
  // che le chiude (la Trinacria); gli altri solo nel gioco completo
  sant_agata: {
    id: "sant_agata",
    rarity: "raro",
  },
  carretto_siciliano: {
    id: "carretto_siciliano",
    rarity: "raro",
  },
  paladino_rinaldo: {
    id: "paladino_rinaldo",
    rarity: "raro",
  },
  testa_di_moro: {
    id: "testa_di_moro",
    rarity: "leggendario",
    full: true,
  },
  trinacria: {
    id: "trinacria",
    rarity: "leggendario",
  },
};

// I santini che si possono trovare in bottega o ricevere dalla nonna nell'edizione giocata
const findable = (edition: Edition) =>
  Object.values(SANTINI).filter((s) => !s.stranger && inEdition(s, edition));

export const CONSUMABLES: Record<ConsumableId, ConsumableInfo> = {
  brucia: {
    id: "brucia",
  },
  passo: {
    id: "passo",
  },
  mischia: {
    id: "mischia",
  },
};

// Più sei lontano dalla quota, più la 'Mpanata rende: un salvagente da tenere per il momento brutto
export const MPANATA_MIN = 5;
export const MPURNATU_TURNS = 3;

export const FOODS: Record<FoodId, FoodInfo> = {
  mpanata: {
    id: "mpanata",
  },
  mpurnatu: {
    id: "mpurnatu",
  },
};

export const RARITY_PRICES: Record<Rarity, number> = {
  comune: 10,
  raro: 18,
  leggendario: 30,
};
export const CONSUMABLE_PRICE = 5;
export const FOOD_PRICE = 6;

// Rimescolare la vetrina costa sempre di più nella stessa bottega
export const REROLL_BASE_PRICE = 2;
export const SHOP_SIZE = 3;

export type ShopItem =
  | { kind: "santino"; id: SantinoId; price: number }
  | { kind: "consumable"; id: ConsumableId; price: number }
  | { kind: "food"; id: FoodId; price: number };

export interface ShopState {
  offers: (ShopItem | null)[]; // null = già comprato
  rerolls: number;
}

export const rerollPrice = (shop: ShopState): number => REROLL_BASE_PRICE + shop.rerolls;

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

// Il santino della nonna: all'inizio della notte l'eroe ne sceglie uno fra tre, comuni o rari
// (i leggendari si trovano solo in bottega), così ogni notte parte in una direzione diversa
export const BLESSING_SIZE = 3;

export const rollBlessing = (rng: Rng, edition: Edition = "full"): SantinoId[] => {
  const pool = findable(edition).filter((s) => s.rarity !== "leggendario");
  const offers: SantinoId[] = [];
  while (offers.length < BLESSING_SIZE && pool.length > 0) {
    const [santino] = pool.splice(Math.floor(rng() * pool.length), 1);
    offers.push(santino.id);
  }
  return offers;
};

// L'incappucciato della cantina: a tavolo superato regala monete o uno dei suoi oggetti, a scelta.
// L'oggetto in palio si decide quando ci si siede, fra quelli che l'eroe non ha ancora
export const STRANGER_COINS = 30;

export const rollStrangerItem = (
  owned: readonly SantinoId[],
  rng: Rng,
  edition: Edition = "full",
): SantinoId | null => {
  const pool = Object.values(SANTINI).filter((s) => s.stranger && inEdition(s, edition) && !owned.includes(s.id));
  return pool.length > 0 ? pick(pool, rng).id : null;
};

// Ogni posto della vetrina: due volte su tre un santino che l'eroe non ha ancora
// (raro una volta su tre, leggendario una su dodici), altrimenti un consumabile o un cibo.
// La vetrina offre solo quello che esiste nell'edizione giocata
export const rollShop = (
  owned: readonly SantinoId[],
  rng: Rng,
  edition: Edition = "full",
): (ShopItem | null)[] => {
  const offers: ShopItem[] = [];
  const taken = new Set<SantinoId>(owned);
  const consumables = Object.values(CONSUMABLES).filter((c) => inEdition(c, edition));
  const foods = Object.values(FOODS).filter((f) => inEdition(f, edition));
  for (let i = 0; i < SHOP_SIZE; i++) {
    const free = findable(edition).filter((s) => !taken.has(s.id));
    if (free.length > 0 && rng() < 2 / 3) {
      const roll = rng();
      const wanted: Rarity = roll < 0.08 ? "leggendario" : roll < 0.4 ? "raro" : "comune";
      const pool = free.filter((s) => s.rarity === wanted);
      const santino = pick(pool.length > 0 ? pool : free, rng);
      taken.add(santino.id);
      offers.push({ kind: "santino", id: santino.id, price: RARITY_PRICES[santino.rarity] });
    } else if (foods.length > 0 && rng() < 0.5) {
      offers.push({ kind: "food", id: pick(foods, rng).id, price: FOOD_PRICE });
    } else {
      const consumable = pick(consumables, rng);
      offers.push({ kind: "consumable", id: consumable.id, price: CONSUMABLE_PRICE });
    }
  }
  return offers;
};
