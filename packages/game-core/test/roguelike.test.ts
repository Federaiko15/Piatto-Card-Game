import { describe, expect, it } from "vitest";
import {
  HERO_ID,
  RUN_TABLES,
  STARTING_BANKROLL,
  applyRunAction,
  createRun,
  getHero,
  maxHeroBet,
  type Card,
  type RunAction,
  type RunState,
} from "../src/index.js";

const card = (value: number): Card => ({ seed: "bastoni", value }); // bastoni: il seme senza effetti

// Una run al primo tavolo con mazzo, piatto e saldi scelti dal test (l'ultima carta del mazzo è la prossima)
const runWith = (
  deck: Card[],
  overrides: { piatto?: number; balances?: number[]; tableIndex?: number } = {},
): RunState => {
  const run = createRun(42, "Eroe");
  const players = run.table.players.map((p, i) => ({
    ...p,
    balance: overrides.balances?.[i] ?? p.balance,
  }));
  return {
    ...run,
    tableIndex: overrides.tableIndex ?? 0,
    table: {
      ...run.table,
      players,
      deck,
      piatto: overrides.piatto ?? run.table.piatto,
    },
  };
};

const apply = (run: RunState, action: RunAction) => {
  const result = applyRunAction(run, action);
  if (!result.ok) throw new Error(result.error);
  return result;
};

const balances = (run: RunState) => run.table.players.map((p) => p.balance);

describe("createRun", () => {
  it("fa sedere l'eroe per primo e mette nel piatto la posta di tutti", () => {
    const run = createRun(1, "Eroe");
    const { ante, opponents } = RUN_TABLES[0];

    expect(run.phase).toBe("table");
    expect(run.bankroll).toBe(STARTING_BANKROLL);
    expect(run.table.currentTurn).toBe(0);
    expect(getHero(run)).toMatchObject({ id: HERO_ID, balance: STARTING_BANKROLL - ante });
    expect(run.table.players).toHaveLength(opponents.length + 1);
    expect(run.table.piatto).toBe(ante * (opponents.length + 1));
    expect(run.table.deck).toHaveLength(40);
  });

  it("con lo stesso seed produce la stessa run", () => {
    expect(createRun(7, "Eroe")).toEqual(createRun(7, "Eroe"));
    expect(createRun(7, "Eroe").table.deck).not.toEqual(createRun(8, "Eroe").table.deck);
  });
});

describe("turni", () => {
  it("accetta la mossa dell'eroe solo nel suo turno e quella del bot solo nel turno del bot", () => {
    const run = runWith([card(2), card(3), card(9)]);
    expect(applyRunAction(run, { type: "bot_turn" })).toEqual({ ok: false, error: "not_bot_turn" });

    const afterHero = apply(run, { type: "play", amount: 5 }).run;
    expect(applyRunAction(afterHero, { type: "play", amount: 1 })).toEqual({
      ok: false,
      error: "not_hero_turn",
    });
    expect(applyRunAction(afterHero, { type: "bot_turn" }).ok).toBe(true);
  });

  it("rifiuta una puntata più alta del piatto senza cambiare nulla", () => {
    const run = runWith([card(2), card(9)], { piatto: 10 });
    expect(applyRunAction(run, { type: "play", amount: 11 })).toEqual({
      ok: false,
      error: "bet_exceeds_pot",
    });
    expect(maxHeroBet(run)).toBe(10);
  });

  it("registra l'ultima carta pescata e conta le pescate", () => {
    const { run } = apply(runWith([card(2), card(3), card(9)]), { type: "play", amount: 4 });
    expect(run.lastDraw).toEqual({ playerId: HERO_ID, card: card(9), bet: 4, outcome: "win", delta: 4 });
    expect(run.draws).toBe(1);
  });

  it("non cambia la sequenza casuale se la run viene salvata e ricaricata", () => {
    const run = createRun(99, "Eroe");
    const saved: RunState = JSON.parse(JSON.stringify(run));
    expect(apply(saved, { type: "play", amount: 3 })).toEqual(apply(run, { type: "play", amount: 3 }));

    const afterBot = apply(apply(run, { type: "play", amount: 3 }).run, { type: "bot_turn" });
    const reloaded = apply(
      JSON.parse(JSON.stringify(apply(run, { type: "play", amount: 3 }).run)),
      { type: "bot_turn" },
    );
    expect(reloaded).toEqual(afterBot);
  });
});

describe("piatto vuoto", () => {
  it("chi è in gioco rimette la posta e il turno passa al prossimo", () => {
    const { ante } = RUN_TABLES[0];
    const run = runWith([card(2), card(2), card(9)], { piatto: 10, balances: [50, 50, 50] });
    const { run: next, events } = apply(run, { type: "play", amount: 10 });

    expect(events).toContainEqual({ type: "pot_refilled", amount: ante * 3, eliminated: [] });
    expect(balances(next)).toEqual([60 - ante, 50 - ante, 50 - ante]);
    expect(next.table.piatto).toBe(ante * 3);
    expect(next.table.finished).toBeNull();
    expect(next.table.currentTurn).toBe(1);
    expect(next.phase).toBe("table");
  });

  it("chi non può pagare la posta esce dal tavolo", () => {
    const { ante } = RUN_TABLES[0];
    const run = runWith([card(2), card(2), card(9)], { piatto: 10, balances: [50, ante, 50] });
    const { run: next, events } = apply(run, { type: "play", amount: 10 });

    expect(events).toContainEqual({ type: "pot_refilled", amount: ante * 3, eliminated: ["opponent-0"] });
    expect(next.table.players[1].status).toBe("eliminato");
    expect(next.table.currentTurn).toBe(2);
  });
});

describe("fine del tavolo", () => {
  it("a mazzo finito divide il piatto e, raggiunta la quota, passa al tavolo successivo", () => {
    const { quota } = RUN_TABLES[0];
    const run = runWith([card(9)], { piatto: 31, balances: [quota, 50, 50] });
    const { run: cleared, events } = apply(run, { type: "play", amount: 1 });

    // piatto 30 diviso in 3: 10 a testa
    expect(events).toContainEqual({
      type: "pot_split",
      share: 10,
      players: [HERO_ID, "opponent-0", "opponent-1"],
    });
    expect(cleared.phase).toBe("table_cleared");
    expect(cleared.bankroll).toBe(quota + 11);
    expect(events).toContainEqual({ type: "table_cleared", balance: quota + 11, quota });

    expect(applyRunAction(cleared, { type: "next_table" })).toEqual({ ok: false, error: "wrong_phase" });
    const shop = apply(cleared, { type: "enter_shop" }).run;
    const { run: second, events: started } = apply(shop, { type: "next_table" });
    expect(started).toEqual([{ type: "table_started", tableIndex: 1 }]);
    expect(second.phase).toBe("table");
    expect(second.tableIndex).toBe(1);
    expect(getHero(second).balance).toBe(quota + 11 - RUN_TABLES[1].ante);
    expect(second.table.deck).toHaveLength(40);
    expect(second.lastDraw).toBeNull();
  });

  it("sotto la quota la run è persa", () => {
    const run = runWith([card(2)], { piatto: 3, balances: [50, 50, 50] });
    const { run: lost, events } = apply(run, { type: "play", amount: 1 });

    expect(lost.phase).toBe("lost");
    expect(lost.lossReason).toBe("below_quota");
    expect(events.at(-1)).toEqual({ type: "run_lost", reason: "below_quota" });
  });

  it("l'eroe che resta senza monete perde la run", () => {
    const run = runWith([card(2), card(2)], { piatto: 50, balances: [10, 50, 50] });
    const { run: lost } = apply(run, { type: "play", amount: 10 });

    expect(lost.phase).toBe("lost");
    expect(lost.lossReason).toBe("bankrupt");
    expect(lost.bankroll).toBe(0);
  });

  it("se tutti gli avversari escono l'eroe prende il piatto", () => {
    // gli avversari hanno una moneta sola: con una carta bassa escono
    const run = runWith([card(2), card(2), card(2), card(2), card(2)], {
      piatto: 20,
      balances: [200, 1, 1],
    });
    let next = apply(run, { type: "play", amount: 1 }).run; // l'eroe perde 1: piatto 21
    next = apply(next, { type: "bot_turn" }).run; // il primo avversario esce: piatto 22
    const { run: cleared, events } = apply(next, { type: "bot_turn" }); // esce anche il secondo: piatto 23

    expect(events).toContainEqual({ type: "table_ended", reason: "opponents_out" });
    expect(events).toContainEqual({ type: "pot_collected", amount: 23 });
    expect(cleared.bankroll).toBe(199 + 23);
    expect(cleared.phase).toBe("table_cleared");
  });

  it("superato l'ultimo tavolo la run è vinta", () => {
    const last = RUN_TABLES.length - 1;
    const base = createRun(5, "Eroe");
    const run: RunState = {
      ...base,
      tableIndex: last,
      table: {
        ...base.table,
        players: [
          { ...getHero(base), balance: RUN_TABLES[last].quota },
          ...base.table.players.slice(1),
        ],
        deck: [card(9)],
        piatto: 10,
      },
    };
    const { run: won, events } = apply(run, { type: "play", amount: 1 });

    expect(won.phase).toBe("won");
    expect(events.at(-1)).toMatchObject({ type: "run_won" });
    expect(applyRunAction(won, { type: "next_table" })).toEqual({ ok: false, error: "wrong_phase" });
    expect(applyRunAction(won, { type: "play", amount: 1 })).toEqual({ ok: false, error: "wrong_phase" });
  });
});
