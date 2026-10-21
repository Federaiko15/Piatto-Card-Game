import type { Card } from "../core/cards.js";
import type { Rng } from "../core/rng.js";
import { isWinningCard } from "./table.js";

export const BOT_PERSONALITIES = [
  "Aggressivo",
  "Calmo",
  "Tirchio",
  "Pazzo",
  "Calcolatore",
] as const;

export type BotPersonality = (typeof BOT_PERSONALITIES)[number];

// Il "conteggio" che farebbe un giocatore attento: carte basse rimaste meno carte alte rimaste.
// Negativo = nel mazzo restano più carte vincenti, quindi conviene puntare di più.
export const cardCount = (deck: readonly Card[]): number =>
  deck.reduce((count, card) => count + (isWinningCard(card) ? -1 : 1), 0);

export const botBet = (
  personality: BotPersonality,
  balance: number,
  piatto: number,
  count: number,
  rng: Rng,
): number => {
  const safeBet = (calculated: number, limitBalancePercentage: number = 1) => {
    const maxAllowedByBalance = balance * limitBalancePercentage;
    const finalBet = Math.min(calculated, maxAllowedByBalance, piatto, balance);
    return Math.max(1, Math.floor(finalBet));
  };

  switch (personality) {
    case "Tirchio":
      if (count <= -3) return safeBet(piatto * 0.1);
      return safeBet(piatto * 0.05);

    case "Aggressivo":
      if (count <= -4) return safeBet(piatto * 0.6, 0.8);
      if (count === -2 || count === -3) return safeBet(piatto * 0.3, 0.5);
      return safeBet(piatto * 0.15, 0.2);

    case "Calcolatore":
      if (count < -5) return safeBet(piatto * 0.75, 0.8);
      if (count === -5) return safeBet(piatto * 0.6, 0.7);
      if (count === -4) return safeBet(piatto * 0.45, 0.6);
      if (count === -3) return safeBet(piatto * 0.3, 0.5);
      if (count === -2) return safeBet(piatto * 0.2, 0.25);
      if (count >= -1 && count <= 1) return safeBet(piatto * 0.15, 0.2);
      if (count === 2) return safeBet(piatto * 0.1, 0.16);
      return safeBet(piatto * 0.05, 0.12);

    case "Calmo":
      if (count < 0) return safeBet(piatto * 0.15, 0.2);
      return safeBet(piatto * 0.08, 0.1);

    case "Pazzo": {
      const randomPercent = rng();
      if (count < -3 && rng() > 0.5) return safeBet(piatto, 1);
      return safeBet(piatto * randomPercent, randomPercent);
    }
  }
};
