export type BetError = "invalid_bet" | "insufficient_balance" | "bet_exceeds_pot";

// Una puntata è valida se è un numero positivo, coperto dal saldo e non più alta del piatto
export const validateBet = (
  amount: unknown,
  balance: number,
  piatto: number,
): BetError | null => {
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return "invalid_bet";
  }
  if (amount > balance) return "insufficient_balance";
  if (amount > piatto) return "bet_exceeds_pot";
  return null;
};

// Il pulsante "Piatto": punta tutto il piatto, o tutto il saldo se non basta
export const piattoBet = (balance: number, piatto: number): number =>
  Math.min(balance, piatto);
