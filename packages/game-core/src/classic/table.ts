import type { Card } from "../core/cards.js";
import { createShuffledDeck, drawCard } from "../core/deck.js";
import type { Rng } from "../core/rng.js";
import { nextTurnIndex } from "../core/turns.js";
import { validateBet, type BetError } from "../core/bet.js";

// La regola originale di Piatto: con 1-5 si perde la puntata, con 6-10 la si prende dal piatto
export const isWinningCard = (card: Card): boolean => card.value > 5;

// La puntata automatica quando scade il tempo del turno
export const TIMEOUT_BET = 1;

export interface ClassicPlayer {
  id: string;
  username: string;
  balance: number;
  currentBet: number;
  status: string; // "waiting" | "playing" | "eliminato" | "logout"
}

export type FinishReason = "pot_emptied" | "last_player_standing";

export interface ClassicTable<P extends ClassicPlayer = ClassicPlayer> {
  players: P[];
  piatto: number;
  deck: Card[];
  currentTurn: number;
  finished: FinishReason | null;
}

export type ClassicAction =
  | { type: "bet"; playerId: string; amount: number }
  | { type: "draw"; playerId: string }
  | { type: "timeout" }; // il giocatore di turno non ha giocato in tempo

export type ClassicEvent =
  | { type: "bet_placed"; playerId: string; amount: number }
  | { type: "deck_reshuffled" }
  | {
      type: "card_drawn";
      playerId: string;
      card: Card;
      bet: number;
      outcome: "win" | "lose";
      balance: number;
      piatto: number;
      automatic: boolean; // true se la pescata è stata fatta dal timer
    }
  | { type: "player_eliminated"; playerId: string }
  | {
      type: "turn_skipped";
      playerId: string;
      reason: "not_playing" | "insufficient_balance";
    }
  | { type: "game_over"; reason: FinishReason };

export type ClassicError =
  | BetError
  | "game_over"
  | "unknown_player"
  | "not_your_turn"
  | "no_bet";

export type ClassicResult<P extends ClassicPlayer> =
  | { ok: true; table: ClassicTable<P>; events: ClassicEvent[] }
  | { ok: false; error: ClassicError };

// L'array dei giocatori non viene copiato: il server ci aggiunge chi entra in lobby finché la partita non parte
export const createClassicTable = <P extends ClassicPlayer>(
  players: P[],
  piatto: number,
  rng: Rng,
): ClassicTable<P> => ({
  players,
  piatto,
  deck: createShuffledDeck(rng),
  currentTurn: 0,
  finished: null,
});

const replacePlayer = <P extends ClassicPlayer>(
  players: readonly P[],
  index: number,
  changes: Partial<ClassicPlayer>,
): P[] =>
  players.map((player, i) => (i === index ? { ...player, ...changes } : player));

const resolveDraw = <P extends ClassicPlayer>(
  table: ClassicTable<P>,
  playerIndex: number,
  bet: number,
  automatic: boolean,
  rng: Rng,
): ClassicResult<P> => {
  const events: ClassicEvent[] = [];
  const { card, deck, reshuffled } = drawCard(table.deck, rng);
  if (reshuffled) events.push({ type: "deck_reshuffled" });

  const player = table.players[playerIndex];
  const win = isWinningCard(card);
  const piatto = win ? table.piatto - bet : table.piatto + bet;
  const rawBalance = win ? player.balance + bet : player.balance - bet;
  const eliminated = rawBalance <= 0;
  const balance = Math.max(0, rawBalance);

  const players = replacePlayer(table.players, playerIndex, {
    balance,
    currentBet: 0,
    status: eliminated ? "eliminato" : player.status,
  });

  events.push({
    type: "card_drawn",
    playerId: player.id,
    card,
    bet,
    outcome: win ? "win" : "lose",
    balance,
    piatto,
    automatic,
  });
  if (eliminated) events.push({ type: "player_eliminated", playerId: player.id });

  const stillPlaying = players.filter((p) => p.status === "playing").length;
  const finished: FinishReason | null =
    piatto <= 0
      ? "pot_emptied"
      : stillPlaying <= 1
        ? "last_player_standing"
        : null;
  if (finished) events.push({ type: "game_over", reason: finished });

  return {
    ok: true,
    table: {
      players,
      piatto,
      deck,
      currentTurn: finished
        ? table.currentTurn
        : nextTurnIndex(players, playerIndex),
      finished,
    },
    events,
  };
};

const applyTimeout = <P extends ClassicPlayer>(
  table: ClassicTable<P>,
  rng: Rng,
): ClassicResult<P> => {
  const index = table.currentTurn;
  const player = table.players[index];
  if (!player) return { ok: false, error: "unknown_player" };

  if (player.status !== "playing" || player.balance < TIMEOUT_BET) {
    // una puntata rimasta in sospeso non deve valere per il turno successivo
    const players = replacePlayer(table.players, index, { currentBet: 0 });
    return {
      ok: true,
      table: { ...table, players, currentTurn: nextTurnIndex(players, index) },
      events: [
        {
          type: "turn_skipped",
          playerId: player.id,
          reason:
            player.status !== "playing" ? "not_playing" : "insufficient_balance",
        },
      ],
    };
  }

  return resolveDraw(table, index, TIMEOUT_BET, true, rng);
};

export const applyClassicAction = <P extends ClassicPlayer>(
  table: ClassicTable<P>,
  action: ClassicAction,
  rng: Rng,
): ClassicResult<P> => {
  if (table.finished) return { ok: false, error: "game_over" };

  if (action.type === "timeout") return applyTimeout(table, rng);

  const index = table.players.findIndex((p) => p.id === action.playerId);
  if (index === -1) return { ok: false, error: "unknown_player" };

  const player = table.players[index];
  if (index !== table.currentTurn || player.status !== "playing") {
    return { ok: false, error: "not_your_turn" };
  }

  if (action.type === "bet") {
    const betError = validateBet(action.amount, player.balance, table.piatto);
    if (betError) return { ok: false, error: betError };

    return {
      ok: true,
      table: {
        ...table,
        players: replacePlayer(table.players, index, {
          currentBet: action.amount,
        }),
      },
      events: [
        { type: "bet_placed", playerId: player.id, amount: action.amount },
      ],
    };
  }

  if (!player.currentBet || player.currentBet <= 0) {
    return { ok: false, error: "no_bet" };
  }
  return resolveDraw(table, index, player.currentBet, false, rng);
};
