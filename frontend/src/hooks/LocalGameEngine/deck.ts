import type { SingleCard } from "./types";

export const createDeck = (): SingleCard[] => {
  const seeds = ["denari", "bastoni", "spade", "coppe"];
  const deck: SingleCard[] = [];

  for (const seed of seeds) {
    for (let value = 1; value <= 10; value++) {
      deck.push({ seed, value });
    }
  }

  return deck;
};

export const shuffleDeck = (deck: SingleCard[]): SingleCard[] => {
  const newDeck = [...deck];

  for (let i = newDeck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[randomIndex]] = [newDeck[randomIndex], newDeck[i]];
  }

  return newDeck;
};
