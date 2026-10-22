import { describe, expect, it } from "vitest";
import {
  FINANZA_RATE,
  HERO_ID,
  RUN_TABLES,
  applyRunAction,
  createRun,
  getHero,
  maxHeroBet,
  rollTableEvent,
  createRng,
  type Card,
  type RunAction,
  type RunState,
  type SantinoId,
  type TableModifierId,
} from "../src/index.js";

const card = (value: number, seed: Card["seed"] = "bastoni"): Card => ({ seed, value });

// Una run al primo tavolo con mazzo, piatto, saldi, santini e regole del tavolo scelti dal test
const runWith = (
  deck: Card[],
  overrides: {
    piatto?: number;
    balances?: number[];
    santini?: SantinoId[];
    modifiers?: TableModifierId[];
  } = {},
): RunState => {
  const run = createRun(42, "Eroe");
  const players = run.table.players.map((p, i) => ({
    ...p,
    balance: overrides.balances?.[i] ?? p.balance,
  }));
  return {
    ...run,
    santini: overrides.santini ?? [],
    modifiers: overrides.modifiers ?? [],
    table: { ...run.table, players, deck, piatto: overrides.piatto ?? run.table.piatto },
  };
};

const apply = (run: RunState, action: RunAction) => {
  const result = applyRunAction(run, action);
  if (!result.ok) throw new Error(result.error);
  return result;
};

const heroPlays = (run: RunState, amount: number) => apply(run, { type: "play", amount });
const balances = (run: RunState) => run.table.players.map((p) => p.balance);

describe("semi", () => {
  it("non hanno effetti propri", () => {
    for (const seed of ["denari", "coppe", "spade", "bastoni"] as const) {
      const win = heroPlays(runWith([card(2), card(7, seed)], { piatto: 40 }), 10);
      expect(win.run.lastDraw?.delta).toBe(10);
      expect(win.events.some((e) => e.type === "card_effect")).toBe(false);
      const loss = heroPlays(runWith([card(2), card(3, seed)], { piatto: 40, balances: [50, 50, 50] }), 10);
      expect(loss.run.lastDraw?.delta).toBe(-10);
    }
  });
});

describe("figure", () => {
  it("re: raddoppia la vincita, entro il piatto", () => {
    expect(heroPlays(runWith([card(2), card(10)], { piatto: 40 }), 10).run.lastDraw?.delta).toBe(20);
    expect(heroPlays(runWith([card(2), card(10)], { piatto: 15 }), 10).run.lastDraw?.delta).toBe(15);
  });

  it("gli effetti valgono anche per gli avversari", () => {
    let run = runWith([card(2), card(10), card(2)], { piatto: 40, balances: [50, 50, 50] });
    run = heroPlays(run, 1).run;
    const { run: next, events } = apply(run, { type: "bot_turn" });
    expect(events).toContainEqual({ type: "card_effect", effect: "re", playerId: "opponent-0" });
    expect(next.lastDraw!.delta).toBe(next.lastDraw!.bet * 2);
  });

  it("fante: ruba 1 moneta all'avversario più ricco", () => {
    const { run, events } = heroPlays(runWith([card(2), card(8)], { piatto: 40, balances: [50, 30, 70] }), 5);
    expect(events).toContainEqual({
      type: "card_effect",
      effect: "fante",
      playerId: HERO_ID,
      amount: 1,
      targetId: "opponent-1",
    });
    expect(balances(run)).toEqual([56, 30, 69]);
  });

  it("fante: chi resta senza monete per il furto esce dal tavolo", () => {
    const { run, events } = heroPlays(runWith([card(2), card(2), card(8)], { piatto: 40, balances: [50, 1, 1] }), 5);
    expect(events).toContainEqual({ type: "player_eliminated", playerId: "opponent-0" });
    expect(run.table.players[1].status).toBe("eliminato");
  });

  it("cavallo: il turno salta il prossimo giocatore", () => {
    const { run } = heroPlays(runWith([card(2), card(2), card(9)], { piatto: 40 }), 5);
    expect(run.table.currentTurn).toBe(2);
  });
});

describe("Pupo di Orlando", () => {
  it("raddoppia gli effetti delle figure dell'eroe", () => {
    const santini: SantinoId[] = ["pupo_di_orlando"];
    const re = heroPlays(runWith([card(2), card(10)], { piatto: 60, santini }), 10);
    expect(re.run.lastDraw?.delta).toBe(30);
    expect(re.events).toContainEqual({ type: "santino_triggered", santino: "pupo_di_orlando" });

    const fante = heroPlays(runWith([card(2), card(8)], { piatto: 40, balances: [50, 30, 70], santini }), 5);
    expect(balances(fante.run)).toEqual([57, 30, 68]);

    // con il cavallo saltano entrambi gli avversari: tocca di nuovo all'eroe
    const cavallo = heroPlays(runWith([card(2), card(2), card(9)], { piatto: 40, santini }), 5);
    expect(cavallo.run.table.currentTurn).toBe(0);
  });
});

describe("malocchi ed eventi", () => {
  it("il 6 storto: i 6 perdono", () => {
    const { run, events } = heroPlays(runWith([card(2), card(6)], { piatto: 40, modifiers: ["sei_storto"] }), 5);
    expect(events).toContainEqual({ type: "modifier_triggered", modifier: "sei_storto" });
    expect(run.lastDraw?.outcome).toBe("lose");
  });

  it("malocchio: il 7 di spade perde", () => {
    const run = runWith([card(2), card(7, "spade")], { piatto: 40, balances: [50, 50, 50], modifiers: ["malocchio"] });
    const { run: next } = heroPlays(run, 5);
    expect(next.lastDraw).toMatchObject({ outcome: "lose", delta: -5 });
  });

  it("festa del patrono: ogni vincita paga 1 moneta in più", () => {
    const { run } = heroPlays(runWith([card(2), card(7)], { piatto: 40, modifiers: ["festa_del_patrono"] }), 5);
    expect(run.lastDraw?.delta).toBe(6);
  });

  it("niente piatto: al tavolo del Prete si punta al massimo metà del piatto", () => {
    const run = runWith([card(2), card(7)], { piatto: 40, modifiers: ["niente_piatto"] });
    expect(maxHeroBet(run)).toBe(20);
    expect(applyRunAction(run, { type: "play", amount: 21 })).toEqual({ ok: false, error: "bet_exceeds_pot" });
  });

  it("il tavolo del Prete ha la sua regola fissa", () => {
    expect(RUN_TABLES.at(-1)?.modifiers).toEqual(["niente_piatto"]);
  });

  it("la Finanza prende il 10% quando ci si siede, e l'evento si conosce già in bottega", () => {
    const cleared: RunState = { ...createRun(1, "Eroe"), phase: "table_cleared", bankroll: 120 };
    const shop = apply(cleared, { type: "enter_shop" }).run;
    expect(shop.nextEvent === null || typeof shop.nextEvent === "string").toBe(true);

    const { run, events } = apply({ ...shop, nextEvent: "finanza" }, { type: "next_table" });
    const taken = Math.floor(120 * FINANZA_RATE);
    expect(events).toContainEqual({ type: "modifier_triggered", modifier: "finanza", amount: taken });
    expect(run.bankroll).toBe(120 - taken);
    expect(getHero(run).balance).toBe(120 - taken - RUN_TABLES[1].ante);
    expect(run.modifiers).toEqual(["finanza"]);
    expect(run.nextEvent).toBeNull();
  });

  it("un tavolo su tre circa è tranquillo", () => {
    const rng = createRng(11);
    const rolls = Array.from({ length: 3000 }, () => rollTableEvent(rng));
    const quiet = rolls.filter((r) => r === null).length / rolls.length;
    expect(quiet).toBeGreaterThan(0.28);
    expect(quiet).toBeLessThan(0.39);
  });
});
