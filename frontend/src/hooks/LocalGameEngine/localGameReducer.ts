import {
  applyClassicAction,
  createClassicTable,
  BOT_PERSONALITIES,
  type Rng,
} from "@piatto/game-core";
import type { LocalGameState, OfflinePlayer, Action } from "./types.ts";

const BOT_NAMES = [
  "Giovannino",
  "Angela",
  "Giuseppe",
  "Maria",
  "Vincenzo",
  "Giovanna",
] as const;

const buildPlayers = (
  userName: string,
  numPlayers: number,
  rng: Rng,
): OfflinePlayer[] => {
  const initialPlayers: OfflinePlayer[] = [
    {
      playerId: 0,
      id: "hero-0",
      hero: true,
      username: userName,
      balance: 1000,
      status: "playing",
      currentBet: 0,
    },
  ];

  for (let i = 1; i < numPlayers; i++) {
    initialPlayers.push({
      playerId: i,
      id: `bot-${i}`,
      hero: false,
      username: BOT_NAMES[i - 1] ?? `Bot ${i}`,
      balance: 1000,
      status: "playing",
      currentBet: 0,
      personality:
        BOT_PERSONALITIES[Math.floor(rng() * BOT_PERSONALITIES.length)],
    });
  }

  return initialPlayers;
};

export const createInitialState = (
  userName: string,
  starterBet: number,
  numPlayers: number,
  rng: Rng,
): LocalGameState => {
  return {
    table: createClassicTable(
      buildPlayers(userName, numPlayers, rng),
      starterBet * numPlayers,
      rng,
    ),
    card: { seed: "", value: 0 },
    lastTurnOutcome: null,
  };
};

// Il reducer riceve il generatore casuale della partita, usato da game-core quando deve rimescolare il mazzo
export const createReducer =
  (rng: Rng) =>
  (state: LocalGameState, action: Action): LocalGameState => {
    switch (action.type) {
      case "PLAY_TURN": {
        const currentPlayer = state.table.players[state.table.currentTurn];
        if (!currentPlayer) return state;

        // Offline puntata e pescata avvengono insieme: applichiamo le due mosse di fila
        const bet = applyClassicAction(
          state.table,
          { type: "bet", playerId: currentPlayer.id, amount: action.payload.bet },
          rng,
        );
        if (!bet.ok) return state;

        const draw = applyClassicAction(
          bet.table,
          { type: "draw", playerId: currentPlayer.id },
          rng,
        );
        if (!draw.ok) return state;

        const drawn = draw.events.find((e) => e.type === "card_drawn");
        if (!drawn) return state;
        const win = drawn.outcome === "win";

        return {
          table: draw.table,
          card: drawn.card,
          lastTurnOutcome: {
            playerId: currentPlayer.id,
            username: currentPlayer.username,
            action: win ? "preso" : "lasciato",
            amount: drawn.bet,
            type: win ? "win" : "lose",
            id: Date.now() + Math.random(),
          },
        };
      }

      default:
        return state;
    }
  };
