import type { Player } from "../../types";

export type TypeOfPlayer =
  | "Aggressivo"
  | "Calmo"
  | "Tirchio"
  | "Pazzo"
  | "Calcolatore";

export interface OfflinePlayer extends Player {
  playerId: number;
  hero: boolean;
  personality?: TypeOfPlayer;
}

export interface SingleCard {
  seed: string;
  value: number;
}

export interface TurnOutcome {
  playerId: number | string;
  username: string;
  action: "preso" | "lasciato";
  amount: number;
  type: "win" | "lose";
  id: number;
}

export interface LocalGameState {
  players: OfflinePlayer[];
  piatto: number;
  card: SingleCard;
  currentTurn: number;
  currentDeck: SingleCard[];
  proportionPosNeg: number;
  lastTurnOutcome?: TurnOutcome | null;
}


export type Action =
  | { type: "RESET_DECK"; payload: { deck: SingleCard[] } }
  | { type: "PLAY_TURN"; payload: { bet: number } };
