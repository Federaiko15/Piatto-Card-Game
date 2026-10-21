import type { Card } from "../core/cards.js";
import { createRngFromState, type Rng } from "../core/rng.js";
import { nextTurnIndex } from "../core/turns.js";
import {
  applyClassicAction,
  createClassicTable,
  type ClassicError,
  type ClassicEvent,
  type ClassicPlayer,
  type ClassicTable,
} from "../classic/table.js";
import { botBet, cardCount, type BotPersonality } from "../classic/bots.js";

// Una "run" è una notte all'osteria: una serie di tavoli da superare uno dopo l'altro.
// Le monete dell'eroe passano da un tavolo al successivo; si perde andando a zero
// o lasciando un tavolo con meno monete della sua quota.
// A differenza della classica, al tavolo si gioca un solo mazzo: quando il piatto si svuota
// tutti rimettono la posta e si continua, il tavolo finisce quando finiscono le carte
// e quello che resta nel piatto si divide tra chi è ancora seduto.

export const STARTING_BANKROLL = 100;

export interface RunOpponent {
  name: string;
  personality: BotPersonality;
  balance: number;
}

export interface RunTableConfig {
  name: string;
  ante: number; // la posta che ognuno versa nel piatto quando si siede
  quota: number; // le monete minime con cui l'eroe deve alzarsi dal tavolo
  opponents: RunOpponent[];
  boss?: boolean;
}

export const RUN_TABLES: readonly RunTableConfig[] = [
  {
    name: "Il bar della piazza",
    ante: 5,
    quota: 100,
    opponents: [
      { name: "Zio Turi", personality: "Tirchio", balance: 80 },
      { name: "Il Picciotto", personality: "Pazzo", balance: 80 },
    ],
  },
  {
    name: "La bisca del retrobottega",
    ante: 10,
    quota: 105,
    opponents: [
      { name: "'A Zingara", personality: "Calcolatore", balance: 120 },
      { name: "Il Ragioniere", personality: "Calmo", balance: 120 },
    ],
  },
  {
    name: "Il tavolo del Prete",
    ante: 15,
    quota: 115,
    boss: true,
    opponents: [
      { name: "Il Prete", personality: "Aggressivo", balance: 200 },
      { name: "Il Picciotto", personality: "Pazzo", balance: 100 },
      { name: "Zio Turi", personality: "Tirchio", balance: 100 },
    ],
  },
];

export const HERO_ID = "hero";

export interface RunPlayer extends ClassicPlayer {
  hero: boolean;
  personality?: BotPersonality;
}

export type RunPhase = "table" | "table_cleared" | "won" | "lost";
export type RunLossReason = "bankrupt" | "below_quota";

export type TableEndReason = "deck_empty" | "opponents_out" | "hero_out";

export interface RunDraw {
  playerId: string;
  card: Card;
  bet: number;
  outcome: "win" | "lose";
}

export interface RunState {
  seed: number;
  rngState: number; // lo stato del generatore, salvato insieme alla run
  heroName: string;
  phase: RunPhase;
  tableIndex: number;
  bankroll: number; // le monete dell'eroe quando non è seduto a un tavolo
  table: ClassicTable<RunPlayer>;
  draws: number; // carte pescate al tavolo attuale
  lastDraw: RunDraw | null;
  tableEndReason: TableEndReason | null;
  lossReason: RunLossReason | null;
}

export type RunAction =
  | { type: "play"; amount: number } // l'eroe punta e pesca
  | { type: "bot_turn" } // l'avversario di turno sceglie la puntata e pesca
  | { type: "next_table" };

export type RunEvent =
  | ClassicEvent
  | { type: "table_started"; tableIndex: number }
  | { type: "pot_collected"; amount: number }
  | { type: "pot_split"; share: number; players: string[] }
  | { type: "pot_refilled"; amount: number; eliminated: string[] }
  | { type: "table_ended"; reason: TableEndReason }
  | { type: "table_cleared"; balance: number; quota: number }
  | { type: "run_won"; balance: number }
  | { type: "run_lost"; reason: RunLossReason };

export type RunError =
  | ClassicError
  | "wrong_phase"
  | "not_hero_turn"
  | "not_bot_turn";

export type RunResult =
  | { ok: true; run: RunState; events: RunEvent[] }
  | { ok: false; error: RunError };

export const getHero = (run: RunState): RunPlayer =>
  run.table.players.find((p) => p.hero)!;

export const getTableConfig = (run: RunState): RunTableConfig =>
  RUN_TABLES[run.tableIndex];

// Si siedono l'eroe (primo a giocare) e gli avversari; ognuno versa la posta nel piatto
const seatTable = (
  tableIndex: number,
  heroName: string,
  bankroll: number,
  rng: Rng,
): ClassicTable<RunPlayer> => {
  const config = RUN_TABLES[tableIndex];
  const ante = Math.min(config.ante, bankroll);
  const players: RunPlayer[] = [
    {
      id: HERO_ID,
      username: heroName,
      balance: bankroll - ante,
      currentBet: 0,
      status: "playing",
      hero: true,
    },
    ...config.opponents.map((opponent, i) => ({
      id: `opponent-${i}`,
      username: opponent.name,
      balance: opponent.balance - config.ante,
      currentBet: 0,
      status: "playing",
      hero: false,
      personality: opponent.personality,
    })),
  ];
  return createClassicTable(players, ante + config.ante * config.opponents.length, rng);
};

export const createRun = (seed: number, heroName: string): RunState => {
  const rng = createRngFromState(seed);
  const table = seatTable(0, heroName, STARTING_BANKROLL, rng.next);
  return {
    seed,
    rngState: rng.state(),
    heroName,
    phase: "table",
    tableIndex: 0,
    bankroll: STARTING_BANKROLL,
    table,
    draws: 0,
    lastDraw: null,
    tableEndReason: null,
    lossReason: null,
  };
};

// Piatto vuoto: chi è ancora in gioco rimette la posta; chi non può pagarla esce dal tavolo
const refillPot = (
  table: ClassicTable<RunPlayer>,
  ante: number,
  events: RunEvent[],
): ClassicTable<RunPlayer> => {
  let piatto = 0;
  const eliminated: string[] = [];
  const players = table.players.map((p) => {
    if (p.status !== "playing") return p;
    const paid = Math.min(ante, p.balance);
    piatto += paid;
    if (p.balance - paid > 0) return { ...p, balance: p.balance - paid };
    eliminated.push(p.id);
    return { ...p, balance: 0, status: "eliminato" };
  });
  events.push({ type: "pot_refilled", amount: piatto, eliminated });

  const stillPlaying = players.filter((p) => p.status === "playing").length;
  return {
    ...table,
    players,
    piatto,
    currentTurn: nextTurnIndex(players, table.currentTurn),
    finished: stillPlaying <= 1 ? "last_player_standing" : null,
  };
};

// Il tavolo finisce quando l'eroe esce, quando restano solo l'eroe
// o quando il mazzo è finito (al tavolo della run non si rimescola)
const tableEndReason = (table: ClassicTable<RunPlayer>): TableEndReason | null => {
  const hero = table.players.find((p) => p.hero)!;
  if (hero.status !== "playing") return "hero_out";
  if (table.finished === "last_player_standing") return "opponents_out";
  if (table.deck.length === 0) return "deck_empty";
  return null;
};

const closeTable = (
  run: RunState,
  reason: TableEndReason,
  events: RunEvent[],
): RunState => {
  let table = run.table;
  events.push({ type: "table_ended", reason });

  if (reason === "hero_out") {
    events.push({ type: "run_lost", reason: "bankrupt" });
    return {
      ...run,
      bankroll: 0,
      phase: "lost",
      tableEndReason: reason,
      lossReason: "bankrupt",
    };
  }

  // se gli avversari sono tutti fuori, quello che resta nel piatto è dell'eroe
  if (reason === "opponents_out" && table.piatto > 0) {
    events.push({ type: "pot_collected", amount: table.piatto });
    table = {
      ...table,
      players: table.players.map((p) =>
        p.hero ? { ...p, balance: p.balance + table.piatto } : p,
      ),
      piatto: 0,
    };
  }

  // a mazzo finito il piatto si divide in parti uguali; il resto della divisione va all'eroe
  if (reason === "deck_empty" && table.piatto > 0) {
    const seated = table.players.filter((p) => p.status === "playing");
    const share = Math.floor(table.piatto / seated.length);
    const rest = table.piatto - share * seated.length;
    events.push({ type: "pot_split", share, players: seated.map((p) => p.id) });
    table = {
      ...table,
      players: table.players.map((p) =>
        p.status !== "playing"
          ? p
          : { ...p, balance: p.balance + share + (p.hero ? rest : 0) },
      ),
      piatto: 0,
    };
  }

  const balance = table.players.find((p) => p.hero)!.balance;
  const { quota } = RUN_TABLES[run.tableIndex];
  const closed = { ...run, table, bankroll: balance, tableEndReason: reason };

  if (balance < quota) {
    events.push({ type: "run_lost", reason: "below_quota" });
    return { ...closed, phase: "lost", lossReason: "below_quota" };
  }

  events.push({ type: "table_cleared", balance, quota });
  if (run.tableIndex === RUN_TABLES.length - 1) {
    events.push({ type: "run_won", balance });
    return { ...closed, phase: "won" };
  }
  return { ...closed, phase: "table_cleared" };
};

// Puntata e pescata del giocatore di turno, poi controllo di fine tavolo
const playTurn = (
  run: RunState,
  playerId: string,
  amount: number,
  rng: Rng,
): RunResult => {
  const bet = applyClassicAction(run.table, { type: "bet", playerId, amount }, rng);
  if (!bet.ok) return bet;
  const draw = applyClassicAction(bet.table, { type: "draw", playerId }, rng);
  if (!draw.ok) return draw;

  const events: RunEvent[] = [...bet.events, ...draw.events];
  let table = draw.table;
  if (table.finished === "pot_emptied" && table.deck.length > 0) {
    table = refillPot(table, RUN_TABLES[run.tableIndex].ante, events);
  }
  const drawn = draw.events.find((e) => e.type === "card_drawn");
  let next: RunState = {
    ...run,
    table,
    draws: run.draws + 1,
    lastDraw: drawn
      ? {
          playerId: drawn.playerId,
          card: drawn.card,
          bet: drawn.bet,
          outcome: drawn.outcome,
        }
      : run.lastDraw,
  };

  const reason = tableEndReason(next.table);
  if (reason) next = closeTable(next, reason, events);
  return { ok: true, run: next, events };
};

export const applyRunAction = (run: RunState, action: RunAction): RunResult => {
  const rng = createRngFromState(run.rngState);
  const result = applyWithRng(run, action, rng.next);
  if (!result.ok) return result;
  return { ...result, run: { ...result.run, rngState: rng.state() } };
};

const applyWithRng = (run: RunState, action: RunAction, rng: Rng): RunResult => {
  if (action.type === "next_table") {
    if (run.phase !== "table_cleared") return { ok: false, error: "wrong_phase" };
    const tableIndex = run.tableIndex + 1;
    return {
      ok: true,
      run: {
        ...run,
        phase: "table",
        tableIndex,
        table: seatTable(tableIndex, run.heroName, run.bankroll, rng),
        draws: 0,
        lastDraw: null,
        tableEndReason: null,
      },
      events: [{ type: "table_started", tableIndex }],
    };
  }

  if (run.phase !== "table") return { ok: false, error: "wrong_phase" };
  const current = run.table.players[run.table.currentTurn];

  if (action.type === "play") {
    if (!current?.hero) return { ok: false, error: "not_hero_turn" };
    return playTurn(run, current.id, action.amount, rng);
  }

  if (!current || current.hero || !current.personality) {
    return { ok: false, error: "not_bot_turn" };
  }
  const amount = botBet(
    current.personality,
    current.balance,
    run.table.piatto,
    cardCount(run.table.deck),
    rng,
  );
  return playTurn(run, current.id, amount, rng);
};

// Puntata massima consentita all'eroe in questo momento (saldo e piatto)
export const maxHeroBet = (run: RunState): number =>
  Math.max(1, Math.min(getHero(run).balance, run.table.piatto));
