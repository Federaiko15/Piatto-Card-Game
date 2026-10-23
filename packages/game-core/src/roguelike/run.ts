import type { Card } from "../core/cards.js";
import { validateBet } from "../core/bet.js";
import { drawCard, shuffle } from "../core/deck.js";
import { createRngFromState, type Rng } from "../core/rng.js";
import { nextTurnIndex } from "../core/turns.js";
import {
  createClassicTable,
  isWinningCard,
  type ClassicError,
  type ClassicEvent,
  type ClassicPlayer,
  type ClassicTable,
} from "../classic/table.js";
import { botBet, cardCount, type BotPersonality } from "../classic/bots.js";
import {
  MAX_CONSUMABLES,
  MAX_SANTINI,
  rerollPrice,
  rollShop,
  type ConsumableId,
  type SantinoId,
  type ShopItem,
  type ShopState,
} from "./items.js";
import {
  CURSED_CARD,
  FIGURES,
  FINANZA_RATE,
  rollTableEvent,
  type CardEffectId,
  type TableModifierId,
} from "./modifiers.js";

// Una "run" è una notte all'osteria: una serie di tavoli da superare uno dopo l'altro.
// Le monete dell'eroe passano da un tavolo al successivo; si perde andando a zero
// o lasciando un tavolo con meno monete della sua quota.
// A differenza della classica, al tavolo si gioca un solo mazzo: quando il piatto si svuota
// tutti rimettono la posta e si continua, il tavolo finisce quando finiscono le carte
// e quello che resta nel piatto si divide tra chi è ancora seduto.
// Tra un tavolo e l'altro c'è la bottega, dove le monete si spendono in santini e consumabili.
// Fante, cavallo e re hanno un effetto, e un tavolo può avere un malocchio o un evento.

export const STARTING_BANKROLL = 100;

export interface RunOpponent {
  character: string; // chi è, per ritratti ed espressioni (lo stesso personaggio può sedere a più tavoli)
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
  modifiers?: TableModifierId[]; // la regola fissa del boss
}

export const RUN_TABLES: readonly RunTableConfig[] = [
  {
    name: "Il bar della piazza",
    ante: 5,
    quota: 110,
    opponents: [
      { character: "zio_turi", name: "Zio Turi", personality: "Tirchio", balance: 80 },
      { character: "picciotto", name: "Il Picciotto", personality: "Pazzo", balance: 80 },
    ],
  },
  {
    name: "La bisca del retrobottega",
    ante: 10,
    quota: 120,
    opponents: [
      { character: "zingara", name: "'A Zingara", personality: "Calcolatore", balance: 120 },
      { character: "ragioniere", name: "Il Ragioniere", personality: "Calmo", balance: 120 },
    ],
  },
  {
    name: "Il tavolo del Prete",
    ante: 15,
    quota: 135,
    boss: true,
    modifiers: ["niente_piatto"],
    opponents: [
      { character: "prete", name: "Il Prete", personality: "Aggressivo", balance: 200 },
      { character: "picciotto", name: "Il Picciotto", personality: "Pazzo", balance: 100 },
      { character: "zio_turi", name: "Zio Turi", personality: "Tirchio", balance: 100 },
    ],
  },
];

export const HERO_ID = "hero";

export interface RunPlayer extends ClassicPlayer {
  hero: boolean;
  character: string;
  personality?: BotPersonality;
}

export type RunPhase = "table" | "table_cleared" | "shop" | "won" | "lost";
export type RunLossReason = "bankrupt" | "below_quota";

export type TableEndReason = "deck_empty" | "opponents_out" | "hero_out";

export interface RunDraw {
  playerId: string;
  card: Card;
  bet: number;
  outcome: "win" | "lose";
  delta: number; // quanto è cambiato il saldo di chi ha pescato (i santini possono cambiarlo)
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
  santini: SantinoId[];
  consumables: ConsumableId[];
  shop: ShopState | null; // la vetrina della bottega, solo nella fase "shop"
  seen: Card[]; // le carte uscite al tavolo attuale, in ordine
  peeked: Card | null; // la prossima carta, se l'eroe l'ha sbirciata con la Coppola
  peekUsed: boolean;
  refundUsed: boolean; // il Corno rosso ha già restituito una puntata a questo tavolo
  lossStreak: number; // puntate perse di fila dall'eroe
  modifiers: TableModifierId[]; // malocchi, eventi e regola del boss del tavolo attuale
  nextEvent: TableModifierId | null; // l'evento del prossimo tavolo, scoperto in bottega
}

export type RunAction =
  | { type: "play"; amount: number } // l'eroe punta e pesca
  | { type: "bot_turn" } // l'avversario di turno sceglie la puntata e pesca
  | { type: "peek" } // Coppola del nonno
  | { type: "use"; item: ConsumableId }
  | { type: "enter_shop" }
  | { type: "buy"; index: number }
  | { type: "reroll" }
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
  | { type: "run_lost"; reason: RunLossReason }
  | { type: "santino_triggered"; santino: SantinoId; amount?: number }
  | {
      type: "card_effect";
      effect: CardEffectId;
      playerId: string;
      amount?: number;
      targetId?: string;
    }
  | { type: "modifier_triggered"; modifier: TableModifierId; amount?: number }
  | { type: "card_peeked"; card: Card }
  | { type: "consumable_used"; item: ConsumableId }
  | { type: "shop_opened" }
  | { type: "item_bought"; item: ShopItem }
  | { type: "shop_rerolled"; price: number };

export type RunError =
  | ClassicError
  | "wrong_phase"
  | "not_hero_turn"
  | "not_bot_turn"
  | "not_owned" // santino o consumabile che l'eroe non ha
  | "already_used"
  | "sold_out"
  | "not_enough_coins" // in bottega bisogna tenere almeno una moneta per sedersi
  | "santini_full"
  | "pocket_full";

export type RunResult =
  { ok: true; run: RunState; events: RunEvent[] } | { ok: false; error: RunError };

export const getHero = (run: RunState): RunPlayer => run.table.players.find((p) => p.hero)!;

export const getTableConfig = (run: RunState): RunTableConfig => RUN_TABLES[run.tableIndex];

const has = (run: RunState, santino: SantinoId): boolean => run.santini.includes(santino);
const rule = (run: RunState, modifier: TableModifierId): boolean =>
  run.modifiers.includes(modifier);

// La puntata più alta che un giocatore può fare: il piatto (metà, al tavolo del Prete) e il suo saldo
export const maxBet = (run: RunState, balance: number): number => {
  const { piatto } = run.table;
  const limit = rule(run, "niente_piatto") ? Math.floor(piatto / 2) : piatto;
  return Math.max(1, Math.min(balance, limit));
};

// Si siedono l'eroe (primo a giocare) e gli avversari; ognuno versa la posta nel piatto
// (l'eroe no, se ha Sant'Antonio)
const seatTable = (
  tableIndex: number,
  heroName: string,
  bankroll: number,
  heroPaysAnte: boolean,
  rng: Rng,
): ClassicTable<RunPlayer> => {
  const config = RUN_TABLES[tableIndex];
  const ante = heroPaysAnte ? Math.min(config.ante, bankroll) : 0;
  const players: RunPlayer[] = [
    {
      id: HERO_ID,
      username: heroName,
      balance: bankroll - ante,
      currentBet: 0,
      status: "playing",
      hero: true,
      character: HERO_ID,
    },
    ...config.opponents.map((opponent, i) => ({
      id: `opponent-${i}`,
      username: opponent.name,
      balance: opponent.balance - config.ante,
      currentBet: 0,
      status: "playing",
      hero: false,
      character: opponent.character,
      personality: opponent.personality,
    })),
  ];
  return createClassicTable(players, ante + config.ante * config.opponents.length, rng);
};

// I dati che valgono per un solo tavolo ripartono da zero quando ci si siede
const freshTable = {
  draws: 0,
  lastDraw: null,
  tableEndReason: null,
  seen: [],
  peeked: null,
  peekUsed: false,
  refundUsed: false,
} satisfies Partial<RunState>;

export const createRun = (seed: number, heroName: string): RunState => {
  const rng = createRngFromState(seed);
  const table = seatTable(0, heroName, STARTING_BANKROLL, true, rng.next);
  return {
    seed,
    rngState: rng.state(),
    heroName,
    phase: "table",
    tableIndex: 0,
    bankroll: STARTING_BANKROLL,
    table,
    ...freshTable,
    lossReason: null,
    santini: [],
    consumables: [],
    shop: null,
    lossStreak: 0,
    modifiers: RUN_TABLES[0].modifiers ?? [],
    nextEvent: null,
  };
};

// Piatto vuoto: chi è ancora in gioco rimette la posta; chi non può pagarla esce dal tavolo
const refillPot = (
  table: ClassicTable<RunPlayer>,
  ante: number,
  heroPaysAnte: boolean,
  events: RunEvent[],
): ClassicTable<RunPlayer> => {
  let piatto = 0;
  const eliminated: string[] = [];
  const players = table.players.map((p) => {
    if (p.status !== "playing" || (p.hero && !heroPaysAnte)) return p;
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

const closeTable = (run: RunState, reason: TableEndReason, events: RunEvent[]): RunState => {
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
      players: table.players.map((p) => (p.hero ? { ...p, balance: p.balance + table.piatto } : p)),
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
        p.status !== "playing" ? p : { ...p, balance: p.balance + share + (p.hero ? rest : 0) },
      ),
      piatto: 0,
    };
  }

  let balance = table.players.find((p) => p.hero)!.balance;
  const { quota } = RUN_TABLES[run.tableIndex];
  const closed = { ...run, table, bankroll: balance, tableEndReason: reason };

  if (balance < quota) {
    events.push({ type: "run_lost", reason: "below_quota" });
    return { ...closed, phase: "lost", lossReason: "below_quota" };
  }

  // il Salvadanaio paga gli interessi solo a tavolo superato: non aiuta a raggiungere la quota
  if (has(run, "salvadanaio")) {
    const interest = Math.min(5, Math.floor(balance / 10));
    balance += interest;
    events.push({ type: "santino_triggered", santino: "salvadanaio", amount: interest });
  }

  events.push({ type: "table_cleared", balance, quota });
  if (run.tableIndex === RUN_TABLES.length - 1) {
    events.push({ type: "run_won", balance });
    return { ...closed, bankroll: balance, phase: "won" };
  }
  return { ...closed, bankroll: balance, phase: "table_cleared" };
};

type DrawResult = { ok: true; run: RunState; events: RunEvent[] } | { ok: false; error: RunError };

// La pescata di un giocatore: la regola base (1-5 perdi, 6-10 vinci), gli effetti delle figure,
// i malocchi del tavolo e, se pesca l'eroe, i suoi santini
const resolveDraw = (run: RunState, index: number, amount: number, rng: Rng): DrawResult => {
  const { table } = run;
  const player = table.players[index];
  const betError = validateBet(amount, player.balance, table.piatto);
  if (betError) return { ok: false, error: betError };
  if (amount > maxBet(run, player.balance)) return { ok: false, error: "bet_exceeds_pot" };

  const { card, deck } = drawCard(table.deck, rng);
  const blessed = (santino: SantinoId) => player.hero && has(run, santino);
  const before: RunEvent[] = [{ type: "bet_placed", playerId: player.id, amount }];
  const after: RunEvent[] = [];
  const effect = (id: CardEffectId, extra: { amount?: number; targetId?: string } = {}) =>
    after.push({ type: "card_effect", effect: id, playerId: player.id, ...extra });
  const figure = FIGURES[card.value];
  const figureTimes = figure && blessed("pupo_di_orlando") ? 2 : 1;
  if (figureTimes === 2) after.push({ type: "santino_triggered", santino: "pupo_di_orlando" });

  let win = isWinningCard(card);
  if (card.value === 6 && rule(run, "sei_storto")) {
    win = false;
    after.push({ type: "modifier_triggered", modifier: "sei_storto" });
  }
  if (
    card.seed === CURSED_CARD.seed &&
    card.value === CURSED_CARD.value &&
    rule(run, "malocchio")
  ) {
    win = false;
    after.push({ type: "modifier_triggered", modifier: "malocchio" });
  }
  if (card.value === 5 && blessed("san_giuseppe")) {
    win = true;
    after.push({ type: "santino_triggered", santino: "san_giuseppe" });
  }

  let { piatto } = table;
  let balance = player.balance;
  let { lossStreak, refundUsed } = run;

  if (win) {
    // i bonus si sommano alla puntata, ma nessuno può prendere più di quello che c'è nel piatto.
    // Il re fa eccezione: il piatto paga solo la puntata e il raddoppio lo mette il banco,
    // altrimenti un re svuoterebbe il piatto in un colpo
    let gain = amount;
    let bankBonus = 0;
    if (figure === "re") {
      bankBonus = amount * figureTimes;
      effect("re");
    }
    if (rule(run, "festa_del_patrono")) gain += 1;
    if (blessed("santa_rosalia") && lossStreak >= 3) {
      gain += amount;
      after.push({ type: "santino_triggered", santino: "santa_rosalia", amount });
    }
    gain = Math.min(gain, piatto);
    piatto -= gain;
    balance += gain + bankBonus;
    if (player.hero) lossStreak = 0;
  } else {
    let loss = amount;
    if (player.hero) lossStreak += 1;
    if (blessed("corno_rosso") && !refundUsed) {
      refundUsed = true;
      after.push({ type: "santino_triggered", santino: "corno_rosso", amount: loss });
      loss = 0;
    }
    piatto += loss;
    balance -= loss;
  }

  let players = table.players.map((p, i) => (i === index ? { ...p, balance, currentBet: 0 } : p));

  // il Fante ruba all'avversario più ricco ancora seduto
  if (figure === "fante") {
    const victim = players
      .filter((p, i) => i !== index && p.status === "playing")
      .reduce<RunPlayer | null>(
        (richest, p) => (!richest || p.balance > richest.balance ? p : richest),
        null,
      );
    if (victim) {
      const stolen = Math.min(figureTimes, victim.balance);
      players = players.map((p) =>
        p.id === victim.id
          ? { ...p, balance: p.balance - stolen }
          : p.id === player.id
            ? { ...p, balance: p.balance + stolen }
            : p,
      );
      effect("fante", { amount: stolen, targetId: victim.id });
    }
  }

  const eliminatedNow: string[] = [];
  players = players.map((p) => {
    if (p.status !== "playing" || p.balance > 0) return p;
    eliminatedNow.push(p.id);
    return { ...p, balance: 0, status: "eliminato" };
  });
  const drawer = players[index];

  // il Cavallo fa saltare il turno al prossimo giocatore
  let currentTurn = nextTurnIndex(players, index);
  if (figure === "cavallo") {
    for (let i = 0; i < figureTimes; i++) currentTurn = nextTurnIndex(players, currentTurn);
    effect("cavallo");
  }

  const events: RunEvent[] = [
    ...before,
    {
      type: "card_drawn",
      playerId: player.id,
      card,
      bet: amount,
      outcome: win ? "win" : "lose",
      balance: drawer.balance,
      piatto,
      automatic: false,
    },
    ...after,
    ...eliminatedNow.map((playerId) => ({ type: "player_eliminated" as const, playerId })),
  ];

  const stillPlaying = players.filter((p) => p.status === "playing").length;
  const finished = piatto <= 0 ? "pot_emptied" : stillPlaying <= 1 ? "last_player_standing" : null;
  if (finished) events.push({ type: "game_over", reason: finished });

  return {
    ok: true,
    run: {
      ...run,
      lossStreak,
      refundUsed,
      table: {
        players,
        piatto,
        deck,
        currentTurn: finished ? index : currentTurn,
        finished,
      },
    },
    events,
  };
};

// Puntata e pescata del giocatore di turno, poi santini, piatto da rimettere e controllo di fine tavolo
const playTurn = (run: RunState, playerId: string, amount: number, rng: Rng): RunResult => {
  const index = run.table.players.findIndex((p) => p.id === playerId);
  const before = run.table.players[index].balance;
  const result = resolveDraw(run, index, amount, rng);
  if (!result.ok) return result;

  const { events } = result;
  let table = result.run.table;
  const drawn = events.find((e) => e.type === "card_drawn")!;
  const delta = table.players.find((p) => p.id === playerId)!.balance - before;

  const hero = table.players.find((p) => p.hero)!;
  const bastoni = drawn.card.seed === "bastoni";
  if (bastoni && has(run, "fico_d_india") && hero.status === "playing") {
    events.push({ type: "santino_triggered", santino: "fico_d_india", amount: 1 });
    table = {
      ...table,
      players: table.players.map((p) => (p.hero ? { ...p, balance: p.balance + 1 } : p)),
    };
  }

  if (table.finished === "pot_emptied" && table.deck.length > 0) {
    const { ante } = RUN_TABLES[run.tableIndex];
    table = refillPot(table, ante, !has(run, "sant_antonio"), events);
  }
  let next: RunState = {
    ...result.run,
    table,
    draws: run.draws + 1,
    seen: [...run.seen, drawn.card],
    peeked: null,
    lastDraw: {
      playerId: drawn.playerId,
      card: drawn.card,
      bet: drawn.bet,
      outcome: drawn.outcome,
      delta,
    },
  };

  const reason = tableEndReason(next.table);
  if (reason) next = closeTable(next, reason, events);
  return { ok: true, run: next, events };
};

// I consumabili si usano nel turno dell'eroe, prima di puntare
const useConsumable = (run: RunState, item: ConsumableId, rng: Rng): RunResult => {
  const slot = run.consumables.indexOf(item);
  if (slot === -1) return { ok: false, error: "not_owned" };
  const consumables = run.consumables.filter((_, i) => i !== slot);
  const events: RunEvent[] = [{ type: "consumable_used", item }];
  const { table } = run;

  if (item === "passo") {
    const currentTurn = nextTurnIndex(table.players, table.currentTurn);
    return { ok: true, run: { ...run, consumables, table: { ...table, currentTurn } }, events };
  }

  // Mischia rimescola le carte rimaste, Brucia scarta la prima senza che finisca tra quelle viste
  const deck = item === "mischia" ? shuffle(table.deck, rng) : table.deck.slice(0, -1);
  let next: RunState = { ...run, consumables, peeked: null, table: { ...table, deck } };
  if (next.table.deck.length === 0) next = closeTable(next, "deck_empty", events);
  return { ok: true, run: next, events };
};

const applyShopAction = (
  run: RunState,
  action: Extract<RunAction, { type: "buy" | "reroll" | "next_table" }>,
  rng: Rng,
): RunResult => {
  const shop = run.shop!;

  if (action.type === "next_table") {
    const tableIndex = run.tableIndex + 1;
    const modifiers = [
      ...(RUN_TABLES[tableIndex].modifiers ?? []),
      ...(run.nextEvent ? [run.nextEvent] : []),
    ];
    const events: RunEvent[] = [{ type: "table_started", tableIndex }];
    let { bankroll } = run;
    if (modifiers.includes("finanza")) {
      const taken = Math.floor(bankroll * FINANZA_RATE);
      bankroll -= taken;
      events.push({ type: "modifier_triggered", modifier: "finanza", amount: taken });
    }
    return {
      ok: true,
      run: {
        ...run,
        phase: "table",
        tableIndex,
        bankroll,
        table: seatTable(tableIndex, run.heroName, bankroll, !has(run, "sant_antonio"), rng),
        ...freshTable,
        shop: null,
        modifiers,
        nextEvent: null,
      },
      events,
    };
  }

  if (action.type === "reroll") {
    const price = rerollPrice(shop);
    if (price >= run.bankroll) return { ok: false, error: "not_enough_coins" };
    return {
      ok: true,
      run: {
        ...run,
        bankroll: run.bankroll - price,
        shop: { offers: rollShop(run.santini, rng), rerolls: shop.rerolls + 1 },
      },
      events: [{ type: "shop_rerolled", price }],
    };
  }

  const item = shop.offers[action.index];
  if (!item) return { ok: false, error: "sold_out" };
  if (item.price >= run.bankroll) return { ok: false, error: "not_enough_coins" };
  if (item.kind === "santino" && run.santini.length >= MAX_SANTINI) {
    return { ok: false, error: "santini_full" };
  }
  if (item.kind === "consumable" && run.consumables.length >= MAX_CONSUMABLES) {
    return { ok: false, error: "pocket_full" };
  }
  return {
    ok: true,
    run: {
      ...run,
      bankroll: run.bankroll - item.price,
      santini: item.kind === "santino" ? [...run.santini, item.id] : run.santini,
      consumables: item.kind === "consumable" ? [...run.consumables, item.id] : run.consumables,
      shop: { ...shop, offers: shop.offers.map((o, i) => (i === action.index ? null : o)) },
    },
    events: [{ type: "item_bought", item }],
  };
};

export const applyRunAction = (run: RunState, action: RunAction): RunResult => {
  const rng = createRngFromState(run.rngState);
  const result = applyWithRng(run, action, rng.next);
  if (!result.ok) return result;
  return { ...result, run: { ...result.run, rngState: rng.state() } };
};

const applyWithRng = (run: RunState, action: RunAction, rng: Rng): RunResult => {
  if (action.type === "enter_shop") {
    if (run.phase !== "table_cleared") return { ok: false, error: "wrong_phase" };
    return {
      ok: true,
      run: {
        ...run,
        phase: "shop",
        shop: { offers: rollShop(run.santini, rng), rerolls: 0 },
        nextEvent: rollTableEvent(rng),
      },
      events: [{ type: "shop_opened" }],
    };
  }

  if (action.type === "buy" || action.type === "reroll" || action.type === "next_table") {
    if (run.phase !== "shop" || !run.shop) return { ok: false, error: "wrong_phase" };
    return applyShopAction(run, action, rng);
  }

  if (run.phase !== "table") return { ok: false, error: "wrong_phase" };
  const current = run.table.players[run.table.currentTurn];

  if (action.type === "play" || action.type === "peek" || action.type === "use") {
    if (!current?.hero) return { ok: false, error: "not_hero_turn" };
  }

  if (action.type === "play") return playTurn(run, current.id, action.amount, rng);

  if (action.type === "use") return useConsumable(run, action.item, rng);

  if (action.type === "peek") {
    if (!has(run, "coppola_del_nonno")) return { ok: false, error: "not_owned" };
    if (run.peekUsed) return { ok: false, error: "already_used" };
    const card = run.table.deck[run.table.deck.length - 1];
    return {
      ok: true,
      run: { ...run, peeked: card, peekUsed: true },
      events: [{ type: "card_peeked", card }],
    };
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
  return playTurn(run, current.id, Math.min(amount, maxBet(run, current.balance)), rng);
};

// Puntata massima consentita all'eroe in questo momento (saldo e piatto)
export const maxHeroBet = (run: RunState): number => maxBet(run, getHero(run).balance);

// Le ultime carte uscite che la Memoria di ferro lascia vedere
export const MEMORY_SIZE = 5;
export const rememberedCards = (run: RunState): Card[] =>
  has(run, "memoria_di_ferro") ? run.seen.slice(-MEMORY_SIZE) : [];
