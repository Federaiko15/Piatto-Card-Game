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
  MAX_FOODS,
  MAX_SANTINI,
  MAX_SWAPS,
  MPANATA_MIN,
  MPURNATU_TURNS,
  inEdition,
  rerollPrice,
  STRANGER_COINS,
  rollBlessing,
  rollShop,
  rollStrangerItem,
  type ConsumableId,
  type Edition,
  type FoodId,
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
  stranger?: boolean; // siede l'incappucciato: a tavolo superato offre un premio a scelta
  full?: boolean; // solo nel gioco completo, non nella demo
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
  // Nella demo l'incappucciato c'è sempre; nel gioco completo la sua comparsa sarà da decidere
  // (a caso, o solo a certe condizioni)
  {
    name: "La cantina",
    ante: 10,
    quota: 130,
    stranger: true,
    opponents: [
      { character: "incappucciato", name: "L'Incappucciato", personality: "Calcolatore", balance: 160 },
    ],
  },
  {
    name: "Il tavolo del Prete",
    ante: 15,
    quota: 145,
    boss: true,
    modifiers: ["niente_piatto"],
    opponents: [
      { character: "prete", name: "Il Prete", personality: "Aggressivo", balance: 200 },
      { character: "picciotto", name: "Il Picciotto", personality: "Pazzo", balance: 100 },
      { character: "zio_turi", name: "Zio Turi", personality: "Tirchio", balance: 100 },
    ],
  },
];

// I tavoli della notte nell'edizione giocata, in ordine
export const editionTables = (edition: Edition): RunTableConfig[] =>
  RUN_TABLES.filter((table) => inEdition(table, edition));

export const HERO_ID = "hero";

export interface RunPlayer extends ClassicPlayer {
  hero: boolean;
  character: string;
  personality?: BotPersonality;
}

// "blessing": prima del primo tavolo l'eroe sceglie il santino della nonna
export type RunPhase = "blessing" | "table" | "table_cleared" | "shop" | "won" | "lost";
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
  edition: Edition;
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
  foods: FoodId[]; // il panaru
  swapsLeft: number; // gli scambi di santini rimasti per la notte
  shop: ShopState | null; // la vetrina della bottega, solo nella fase "shop"
  blessing: SantinoId[] | null; // i santini della nonna fra cui scegliere, solo nella fase "blessing"
  // il premio dell'incappucciato finché l'eroe non l'ha scelto: monete o il santino in palio (null se li ha già tutti)
  strangerReward: { santino: SantinoId | null } | null;
  seen: Card[]; // le carte uscite al tavolo attuale, in ordine
  peeked: Card | null; // la prossima carta, se l'eroe l'ha sbirciata con la Coppola
  peekUsed: boolean;
  refundUsed: boolean; // il Corno rosso ha già restituito una puntata a questo tavolo
  trinacriaUsed: boolean; // la Trinacria ha già salvato una carta bassa a questo tavolo
  satiety: number; // i turni in cui il 'Mpurnatu dimezza ancora le perdite
  lossStreak: number; // puntate perse di fila dall'eroe
  modifiers: TableModifierId[]; // malocchi, eventi e regola del boss del tavolo attuale
  nextEvent: TableModifierId | null; // l'evento del prossimo tavolo, scoperto in bottega
}

export type RunAction =
  | { type: "play"; amount: number } // l'eroe punta e pesca
  | { type: "bot_turn" } // l'avversario di turno sceglie la puntata e pesca
  | { type: "peek" } // Coppola del nonno
  | { type: "use"; item: ConsumableId }
  | { type: "eat"; food: FoodId }
  | { type: "choose_blessing"; index: number } // il santino della nonna, all'inizio della notte
  | { type: "choose_reward"; reward: "coins" | "santino"; replace?: number } // il premio dell'incappucciato, poi la bottega
  | { type: "enter_shop" }
  | { type: "buy"; index: number; replace?: number } // replace: il santino da lasciare, con i santini al completo
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
  | { type: "food_eaten"; food: FoodId; amount?: number }
  | { type: "food_effect"; food: FoodId; amount: number } // il 'Mpurnatu dimezza una perdita
  | { type: "shop_opened" }
  | { type: "blessing_chosen"; santino: SantinoId }
  | { type: "reward_chosen"; santino?: SantinoId; amount?: number; replaced?: SantinoId }
  | { type: "item_bought"; item: ShopItem; replaced?: SantinoId }
  | { type: "shop_rerolled"; price: number };

export type RunError =
  | ClassicError
  | "wrong_phase"
  | "not_hero_turn"
  | "not_bot_turn"
  | "not_owned" // santino o consumabile che l'eroe non ha
  | "already_used"
  | "invalid_choice"
  | "reward_pending" // prima della bottega va scelto il premio dell'incappucciato
  | "sold_out"
  | "not_enough_coins" // in bottega bisogna tenere almeno una moneta per sedersi
  | "santini_full"
  | "pocket_full"
  | "basket_full"
  | "no_swaps"; // santini al completo e nessuno scambio rimasto

export type RunResult =
  { ok: true; run: RunState; events: RunEvent[] } | { ok: false; error: RunError };

export const getHero = (run: RunState): RunPlayer => run.table.players.find((p) => p.hero)!;

export const runTables = (run: RunState): RunTableConfig[] => editionTables(run.edition);

export const getTableConfig = (run: RunState): RunTableConfig => runTables(run)[run.tableIndex];

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
  config: RunTableConfig,
  heroName: string,
  bankroll: number,
  heroPaysAnte: boolean,
  rng: Rng,
): ClassicTable<RunPlayer> => {
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
  trinacriaUsed: false,
  satiety: 0,
} satisfies Partial<RunState>;

// Con blessing la notte comincia dalla scelta del santino della nonna; senza (test e simulatore)
// si parte direttamente dal primo tavolo
export const createRun = (
  seed: number,
  heroName: string,
  edition: Edition = "full",
  { blessing = false }: { blessing?: boolean } = {},
): RunState => {
  const rng = createRngFromState(seed);
  const [first] = editionTables(edition);
  const table = seatTable(first, heroName, STARTING_BANKROLL, true, rng.next);
  const offers = blessing ? rollBlessing(rng.next, edition) : null;
  return {
    seed,
    edition,
    rngState: rng.state(),
    heroName,
    phase: offers ? "blessing" : "table",
    tableIndex: 0,
    bankroll: STARTING_BANKROLL,
    table,
    ...freshTable,
    lossReason: null,
    santini: [],
    consumables: [],
    foods: [],
    swapsLeft: MAX_SWAPS,
    shop: null,
    blessing: offers,
    strangerReward: first.stranger ? { santino: rollStrangerItem([], rng.next, edition) } : null,
    lossStreak: 0,
    modifiers: first.modifiers ?? [],
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
  const { quota } = getTableConfig(run);
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
  if (run.tableIndex === runTables(run).length - 1) {
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
  if (card.value === 4 && blessed("sant_agata")) {
    win = true;
    after.push({ type: "santino_triggered", santino: "sant_agata" });
  }
  if (!win && card.seed === "coppe" && blessed("testa_di_moro")) {
    win = true;
    after.push({ type: "santino_triggered", santino: "testa_di_moro" });
  }
  let { trinacriaUsed } = run;
  if (!win && card.value <= 5 && blessed("trinacria") && !trinacriaUsed) {
    win = true;
    trinacriaUsed = true;
    after.push({ type: "santino_triggered", santino: "trinacria" });
  }
  // il 'Mpurnatu dura un certo numero di turni dell'eroe, vinti o persi
  const sated = player.hero && run.satiety > 0;
  const satiety = sated ? run.satiety - 1 : run.satiety;

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
    if (figure && blessed("corona_di_ruggero")) {
      bankBonus += amount;
      after.push({ type: "santino_triggered", santino: "corona_di_ruggero", amount });
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
    // il Patto e il 'Mpurnatu non si sommano: la perdita si dimezza una volta sola
    if (loss > 0 && (blessed("patto") || sated)) {
      const saved = Math.floor(loss / 2);
      loss -= saved;
      if (saved > 0) {
        after.push(
          blessed("patto")
            ? { type: "santino_triggered", santino: "patto", amount: saved }
            : { type: "food_effect", food: "mpurnatu", amount: saved },
        );
      }
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
      const theft = (blessed("paladino_rinaldo") ? 3 : 1) * figureTimes;
      const stolen = Math.min(theft, victim.balance);
      if (blessed("paladino_rinaldo")) after.push({ type: "santino_triggered", santino: "paladino_rinaldo", amount: stolen });
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
      trinacriaUsed,
      satiety,
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
  // il Carretto siciliano fa per i denari quello che il Fico d'India fa per i bastoni
  if (drawn.card.seed === "denari" && has(run, "carretto_siciliano") && hero.status === "playing") {
    events.push({ type: "santino_triggered", santino: "carretto_siciliano", amount: 1 });
    table = {
      ...table,
      players: table.players.map((p) => (p.hero ? { ...p, balance: p.balance + 1 } : p)),
    };
  }

  if (table.finished === "pot_emptied" && table.deck.length > 0) {
    const { ante } = getTableConfig(run);
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
// I cibi del panaru: si mangiano nel proprio turno e non fanno pescare
const eat = (run: RunState, food: FoodId): RunResult => {
  const slot = run.foods.indexOf(food);
  if (slot === -1) return { ok: false, error: "not_owned" };
  const foods = run.foods.filter((_, i) => i !== slot);

  if (food === "mpurnatu") {
    return { ok: true, run: { ...run, foods, satiety: MPURNATU_TURNS }, events: [{ type: "food_eaten", food }] };
  }

  // la 'Mpanata: metà di quello che manca alla quota, e mai meno di un minimo
  const hero = getHero(run);
  const missing = getTableConfig(run).quota - hero.balance;
  const amount = Math.max(MPANATA_MIN, Math.ceil(missing / 2));
  const players = run.table.players.map((p) => (p.hero ? { ...p, balance: p.balance + amount } : p));
  return {
    ok: true,
    run: { ...run, foods, table: { ...run.table, players } },
    events: [{ type: "food_eaten", food, amount }],
  };
};

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
    const config = runTables(run)[tableIndex];
    const modifiers = [
      ...(config.modifiers ?? []),
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
        table: seatTable(config, run.heroName, bankroll, !has(run, "sant_antonio"), rng),
        ...freshTable,
        shop: null,
        strangerReward: config.stranger ? { santino: rollStrangerItem(run.santini, rng, run.edition) } : null,
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
        shop: { offers: rollShop(run.santini, rng, run.edition), rerolls: shop.rerolls + 1 },
      },
      events: [{ type: "shop_rerolled", price }],
    };
  }

  const item = shop.offers[action.index];
  if (!item) return { ok: false, error: "sold_out" };
  if (item.price >= run.bankroll) return { ok: false, error: "not_enough_coins" };
  const added = item.kind === "santino" ? addSantino(run, item.id, action.replace) : null;
  if (typeof added === "string") return { ok: false, error: added };
  if (item.kind === "consumable" && run.consumables.length >= MAX_CONSUMABLES) {
    return { ok: false, error: "pocket_full" };
  }
  if (item.kind === "food" && run.foods.length >= MAX_FOODS) {
    return { ok: false, error: "basket_full" };
  }
  return {
    ok: true,
    run: {
      ...run,
      bankroll: run.bankroll - item.price,
      santini: added?.santini ?? run.santini,
      swapsLeft: added?.swapsLeft ?? run.swapsLeft,
      consumables: item.kind === "consumable" ? [...run.consumables, item.id] : run.consumables,
      foods: item.kind === "food" ? [...run.foods, item.id] : run.foods,
      shop: { ...shop, offers: shop.offers.map((o, i) => (i === action.index ? null : o)) },
    },
    events: [{ type: "item_bought", item, ...(added?.replaced ? { replaced: added.replaced } : {}) }],
  };
};

// Un santino nuovo entra nella build: in un posto libero, oppure al posto di quello che l'eroe lascia
// (con i santini al completo, finché ha scambi)
const addSantino = (
  run: RunState,
  santino: SantinoId,
  replace: number | undefined,
): { santini: SantinoId[]; swapsLeft: number; replaced?: SantinoId } | RunError => {
  if (run.santini.length < MAX_SANTINI) return { santini: [...run.santini, santino], swapsLeft: run.swapsLeft };
  if (replace === undefined) return "santini_full";
  if (run.swapsLeft <= 0) return "no_swaps";
  const replaced = run.santini[replace];
  if (!replaced) return "invalid_choice";
  return {
    santini: run.santini.map((s, i) => (i === replace ? santino : s)),
    swapsLeft: run.swapsLeft - 1,
    replaced,
  };
};

const openShop = (run: RunState, events: RunEvent[], rng: Rng): RunResult => ({
  ok: true,
  run: {
    ...run,
    phase: "shop",
    shop: { offers: rollShop(run.santini, rng, run.edition), rerolls: 0 },
    nextEvent: rollTableEvent(rng),
  },
  events: [...events, { type: "shop_opened" }],
});

export const applyRunAction = (run: RunState, action: RunAction): RunResult => {
  const rng = createRngFromState(run.rngState);
  const result = applyWithRng(run, action, rng.next);
  if (!result.ok) return result;
  return { ...result, run: { ...result.run, rngState: rng.state() } };
};

const applyWithRng = (run: RunState, action: RunAction, rng: Rng): RunResult => {
  if (action.type === "choose_blessing") {
    if (run.phase !== "blessing" || !run.blessing) return { ok: false, error: "wrong_phase" };
    const santino = run.blessing[action.index];
    if (!santino) return { ok: false, error: "invalid_choice" };
    // con Sant'Antonio la posta del primo tavolo, già versata quando ci si è seduti, torna all'eroe
    const table =
      santino === "sant_antonio"
        ? seatTable(runTables(run)[0], run.heroName, run.bankroll, false, rng)
        : run.table;
    return {
      ok: true,
      run: { ...run, phase: "table", table, santini: [...run.santini, santino], blessing: null },
      events: [
        { type: "blessing_chosen", santino },
        { type: "table_started", tableIndex: 0 },
      ],
    };
  }

  if (action.type === "enter_shop") {
    if (run.phase !== "table_cleared") return { ok: false, error: "wrong_phase" };
    if (run.strangerReward) return { ok: false, error: "reward_pending" };
    return openShop(run, [], rng);
  }

  // il premio dell'incappucciato: le monete vanno subito in tasca, da spendere nella bottega che si apre dopo
  if (action.type === "choose_reward") {
    const reward = run.strangerReward;
    if (run.phase !== "table_cleared" || !reward) return { ok: false, error: "wrong_phase" };
    if (action.reward === "coins") {
      return openShop(
        { ...run, bankroll: run.bankroll + STRANGER_COINS, strangerReward: null },
        [{ type: "reward_chosen", amount: STRANGER_COINS }],
        rng,
      );
    }
    if (!reward.santino) return { ok: false, error: "invalid_choice" };
    const added = addSantino(run, reward.santino, action.replace);
    if (typeof added === "string") return { ok: false, error: added };
    return openShop(
      { ...run, santini: added.santini, swapsLeft: added.swapsLeft, strangerReward: null },
      [{ type: "reward_chosen", santino: reward.santino, ...(added.replaced ? { replaced: added.replaced } : {}) }],
      rng,
    );
  }

  if (action.type === "buy" || action.type === "reroll" || action.type === "next_table") {
    if (run.phase !== "shop" || !run.shop) return { ok: false, error: "wrong_phase" };
    return applyShopAction(run, action, rng);
  }

  if (run.phase !== "table") return { ok: false, error: "wrong_phase" };
  const current = run.table.players[run.table.currentTurn];

  if (action.type === "play" || action.type === "peek" || action.type === "use" || action.type === "eat") {
    if (!current?.hero) return { ok: false, error: "not_hero_turn" };
  }

  if (action.type === "play") return playTurn(run, current.id, action.amount, rng);

  if (action.type === "use") return useConsumable(run, action.item, rng);

  if (action.type === "eat") return eat(run, action.food);

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
