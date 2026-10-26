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

export interface SantinoInfo {
  id: SantinoId;
  name: string;
  effect: string;
  rarity: Rarity;
  full?: boolean;
  stranger?: boolean; // solo come premio dell'incappucciato: mai in bottega né dalla nonna
}

export interface ConsumableInfo {
  id: ConsumableId;
  name: string;
  effect: string;
  full?: boolean;
}

export interface FoodInfo {
  id: FoodId;
  name: string;
  effect: string;
  full?: boolean;
}

export const MAX_SANTINI = 5;
export const MAX_CONSUMABLES = 2;
export const MAX_FOODS = 2; // i posti del panaru

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
    effect: "Quando peschi una figura il suo effetto vale doppio: il fante ruba 2, il cavallo salta 2 giocatori, il re paga il triplo invece del doppio.",
    rarity: "leggendario",
  },
  patto: {
    id: "patto",
    name: "Il Patto",
    effect: "Quando perdi una puntata ne perdi solo metà.",
    rarity: "leggendario",
    stranger: true,
  },
  corona_di_ruggero: {
    id: "corona_di_ruggero",
    name: "Corona di Re Ruggero",
    effect: "Quando vinci con una figura il banco ti paga una puntata in più: fante e cavallo pagano doppio, il re triplo.",
    rarity: "leggendario",
    stranger: true,
  },
  // Le build: carte basse, semi, figure. Nella demo c'è un esempio di ognuna, i leggendari che le chiudono
  // solo nel gioco completo
  sant_agata: {
    id: "sant_agata",
    name: "Sant'Agata",
    effect: "Quando peschi un 4 vinci invece di perdere.",
    rarity: "raro",
  },
  carretto_siciliano: {
    id: "carretto_siciliano",
    name: "Carretto siciliano",
    effect: "+1 moneta per ogni carta di denari che esce, chiunque la peschi.",
    rarity: "raro",
  },
  paladino_rinaldo: {
    id: "paladino_rinaldo",
    name: "Paladino Rinaldo",
    effect: "Il fante che peschi ruba 3 monete invece di 1.",
    rarity: "raro",
  },
  testa_di_moro: {
    id: "testa_di_moro",
    name: "Testa di Moro",
    effect: "Le carte di coppe che peschi vincono sempre.",
    rarity: "leggendario",
    full: true,
  },
  trinacria: {
    id: "trinacria",
    name: "Trinacria",
    effect: "A ogni tavolo, la prima carta da 1 a 5 che peschi vince.",
    rarity: "leggendario",
    full: true,
  },
};

// I santini che si possono trovare in bottega o ricevere dalla nonna nell'edizione giocata
const findable = (edition: Edition) =>
  Object.values(SANTINI).filter((s) => !s.stranger && inEdition(s, edition));

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

// Più sei lontano dalla quota, più la 'Mpanata rende: un salvagente da tenere per il momento brutto
export const MPANATA_MIN = 5;
export const MPURNATU_TURNS = 3;

export const FOODS: Record<FoodId, FoodInfo> = {
  mpanata: {
    id: "mpanata",
    name: "'Mpanata",
    effect: `Ti dà metà delle monete che ti mancano alla quota (almeno ${MPANATA_MIN}).`,
  },
  mpurnatu: {
    id: "mpurnatu",
    name: "'Mpurnatu",
    effect: `Piatto pesante, ti tiene: nei tuoi prossimi ${MPURNATU_TURNS} turni, se perdi, perdi solo metà puntata.`,
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
