import type { BotPersonality, ClassicTable } from "@piatto/game-core";
import type { Player, SingleCard } from "../../types";

export type TypeOfPlayer = BotPersonality;

export interface OfflinePlayer extends Player {
  playerId: number;
  hero: boolean;
  personality?: TypeOfPlayer;
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
  // giocatori, piatto, mazzo e turno: lo stato del tavolo gestito dalle regole di game-core
  table: ClassicTable<OfflinePlayer>;
  card: SingleCard; // l'ultima carta pescata, da mostrare sul tavolo
  lastTurnOutcome: TurnOutcome | null;
}

export type Action = { type: "PLAY_TURN"; payload: { bet: number } };
