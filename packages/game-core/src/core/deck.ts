import { SEEDS, type Card } from "./cards.js";
import type { Rng } from "./rng.js";

// Mazzo di 40 carte siciliane in ordine
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const seed of SEEDS) {
    for (let value = 1; value <= 10; value++) {
      deck.push({ seed, value });
    }
  }
  return deck;
};

// Fisher-Yates: restituisce un nuovo array senza toccare quello passato
export const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled;
};

export const createShuffledDeck = (rng: Rng): Card[] => shuffle(createDeck(), rng);

export interface DrawResult {
  card: Card;
  deck: Card[];
  reshuffled: boolean; // true se il mazzo era finito ed è stato rimescolato prima di pescare
}

// Pesca la carta "in cima" (l'ultima dell'array); se il mazzo è vuoto ne crea uno nuovo
export const drawCard = (deck: readonly Card[], rng: Rng): DrawResult => {
  const reshuffled = deck.length === 0;
  const workingDeck = reshuffled ? createShuffledDeck(rng) : deck;
  return {
    card: workingDeck[workingDeck.length - 1],
    deck: workingDeck.slice(0, -1),
    reshuffled,
  };
};
