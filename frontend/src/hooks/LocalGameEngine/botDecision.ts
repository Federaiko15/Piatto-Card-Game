import type { TypeOfPlayer } from "./types";

export const botDecision = (
  personality: TypeOfPlayer,
  balance: number,
  piatto: number,
  proportionPosNeg: number,
): number => {
  const safeBet = (calculated: number, limitBalancePercentage: number = 1) => {
    const maxAllowedByBalance = balance * limitBalancePercentage;
    const finalBet = Math.min(calculated, maxAllowedByBalance, piatto, balance);
    return Math.max(1, Math.floor(finalBet));
  };

  switch (personality) {
    case "Tirchio":
      if (proportionPosNeg <= -3) return safeBet(piatto * 0.1);
      return safeBet(piatto * 0.05);

    case "Aggressivo":
      if (proportionPosNeg <= -4) return safeBet(piatto * 0.6, 0.8);
      if (proportionPosNeg === -2 || proportionPosNeg === -3) {
        return safeBet(piatto * 0.3, 0.5);
      }
      return safeBet(piatto * 0.15, 0.2);

    case "Calcolatore":
      if (proportionPosNeg < -5) return safeBet(piatto * 0.75, 0.8);
      if (proportionPosNeg === -5) return safeBet(piatto * 0.6, 0.7);
      if (proportionPosNeg === -4) return safeBet(piatto * 0.45, 0.6);
      if (proportionPosNeg === -3) return safeBet(piatto * 0.3, 0.5);
      if (proportionPosNeg === -2) return safeBet(piatto * 0.2, 0.25);
      if (proportionPosNeg === -1) return safeBet(piatto * 0.15, 0.2);
      if (proportionPosNeg === 0 || proportionPosNeg === 1) {
        return safeBet(piatto * 0.15, 0.2);
      }
      if (proportionPosNeg === 2) return safeBet(piatto * 0.1, 0.16);
      return safeBet(piatto * 0.05, 0.12);

    case "Calmo":
      if (proportionPosNeg < 0) return safeBet(piatto * 0.15, 0.2);
      return safeBet(piatto * 0.08, 0.1);

    case "Pazzo": {
      const randomPercent = Math.random();
      if (proportionPosNeg < -3 && Math.random() > 0.5) {
        return safeBet(piatto, 1);
      }
      return safeBet(piatto * randomPercent, randomPercent);
    }

    default:
      return 1;
  }
};
