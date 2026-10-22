import { describe, expect, it } from "vitest";
import {
  CONSUMABLES,
  MAX_CONSUMABLES,
  MAX_SANTINI,
  RUN_TABLES,
  SANTINI,
  SHOP_SIZE,
  applyRunAction,
  createRng,
  createRun,
  getHero,
  rememberedCards,
  rerollPrice,
  rollShop,
  type Card,
  type ConsumableId,
  type RunAction,
  type RunState,
  type SantinoId,
  type ShopItem,
} from "../src/index.js";

const card = (value: number, seed: Card["seed"] = "bastoni"): Card => ({ seed, value }); // bastoni: il seme senza effetti

// Una run al primo tavolo con mazzo, piatto, saldi e oggetti scelti dal test (l'ultima carta del mazzo è la prossima)
const runWith = (
  deck: Card[],
  overrides: {
    piatto?: number;
    balances?: number[];
    santini?: SantinoId[];
    consumables?: ConsumableId[];
    lossStreak?: number;
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
    consumables: overrides.consumables ?? [],
    lossStreak: overrides.lossStreak ?? 0,
    table: { ...run.table, players, deck, piatto: overrides.piatto ?? run.table.piatto },
  };
};

// Una run in bottega con la vetrina e le monete scelte dal test
const shopWith = (offers: (ShopItem | null)[], bankroll: number, extra: Partial<RunState> = {}): RunState => ({
  ...createRun(42, "Eroe"),
  phase: "shop",
  bankroll,
  shop: { offers, rerolls: 0 },
  ...extra,
});

const apply = (run: RunState, action: RunAction) => {
  const result = applyRunAction(run, action);
  if (!result.ok) throw new Error(result.error);
  return result;
};

const santino = (id: SantinoId): ShopItem => ({ kind: "santino", id, price: 10 });
const consumable = (id: ConsumableId): ShopItem => ({ kind: "consumable", id, price: 5 });

describe("vetrina della bottega", () => {
  it("offre tre oggetti senza santini doppi né santini già equipaggiati", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const offers = rollShop(["corno_rosso"], createRng(seed));
      const ids = offers.flatMap((o) => (o?.kind === "santino" ? [o.id] : []));
      expect(offers).toHaveLength(SHOP_SIZE);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain("corno_rosso");
    }
  });

  it("con tutti i santini già presi offre solo consumabili", () => {
    const all = Object.keys(SANTINI) as SantinoId[];
    const offers = rollShop(all, createRng(3));
    expect(offers.every((o) => o?.kind === "consumable")).toBe(true);
  });
});

describe("bottega", () => {
  it("si apre solo a tavolo superato e porta al tavolo successivo", () => {
    const run = createRun(1, "Eroe");
    expect(applyRunAction(run, { type: "enter_shop" })).toEqual({ ok: false, error: "wrong_phase" });

    const cleared: RunState = { ...run, phase: "table_cleared", bankroll: 120 };
    const { run: shop } = apply(cleared, { type: "enter_shop" });
    expect(shop.phase).toBe("shop");
    expect(shop.shop?.offers).toHaveLength(SHOP_SIZE);

    const { run: next } = apply(shop, { type: "next_table" });
    expect(next.phase).toBe("table");
    expect(next.tableIndex).toBe(1);
    expect(next.shop).toBeNull();
    expect(getHero(next).balance).toBe(120 - RUN_TABLES[1].ante);
  });

  it("comprare toglie le monete e mette il santino o il consumabile nella build", () => {
    const run = shopWith([santino("corno_rosso"), consumable("passo"), null], 50);
    const afterSantino = apply(run, { type: "buy", index: 0 });
    expect(afterSantino.events).toEqual([{ type: "item_bought", item: santino("corno_rosso") }]);
    expect(afterSantino.run.bankroll).toBe(40);
    expect(afterSantino.run.santini).toEqual(["corno_rosso"]);
    expect(afterSantino.run.shop?.offers[0]).toBeNull();

    const afterConsumable = apply(afterSantino.run, { type: "buy", index: 1 }).run;
    expect(afterConsumable.consumables).toEqual(["passo"]);
    expect(afterConsumable.bankroll).toBe(35);
    expect(applyRunAction(afterConsumable, { type: "buy", index: 0 })).toEqual({
      ok: false,
      error: "sold_out",
    });
  });

  it("bisogna tenere almeno una moneta per sedersi al tavolo", () => {
    const run = shopWith([santino("corno_rosso")], 10);
    expect(applyRunAction(run, { type: "buy", index: 0 })).toEqual({
      ok: false,
      error: "not_enough_coins",
    });
  });

  it("rispetta il limite di santini e di consumabili", () => {
    const fullSantini = shopWith([santino("salvadanaio")], 100, {
      santini: (Object.keys(SANTINI) as SantinoId[]).slice(0, MAX_SANTINI),
    });
    expect(applyRunAction(fullSantini, { type: "buy", index: 0 })).toEqual({
      ok: false,
      error: "santini_full",
    });

    const fullPocket = shopWith([consumable("brucia")], 100, {
      consumables: Array<ConsumableId>(MAX_CONSUMABLES).fill("passo"),
    });
    expect(applyRunAction(fullPocket, { type: "buy", index: 0 })).toEqual({
      ok: false,
      error: "pocket_full",
    });
  });

  it("rimescolare la vetrina costa una moneta in più ogni volta", () => {
    const run = shopWith([santino("corno_rosso")], 50);
    const first = apply(run, { type: "reroll" }).run;
    expect(first.bankroll).toBe(50 - rerollPrice(run.shop!));
    expect(first.shop?.rerolls).toBe(1);

    const second = apply(first, { type: "reroll" }).run;
    expect(first.bankroll - second.bankroll).toBe(rerollPrice(run.shop!) + 1);
  });
});

describe("santini", () => {
  it("San Giuseppe: il 5 vince", () => {
    const run = runWith([card(2), card(5)], { piatto: 20, santini: ["san_giuseppe"] });
    const { run: next, events } = apply(run, { type: "play", amount: 4 });
    expect(events).toContainEqual({ type: "santino_triggered", santino: "san_giuseppe" });
    expect(next.lastDraw).toMatchObject({ outcome: "win", delta: 4 });
    expect(next.table.piatto).toBe(16);
  });

  it("senza San Giuseppe il 5 perde", () => {
    const { run } = apply(runWith([card(2), card(5)], { piatto: 20 }), { type: "play", amount: 4 });
    expect(run.lastDraw).toMatchObject({ outcome: "lose", delta: -4 });
  });

  it("Corno rosso: restituisce solo la prima puntata persa del tavolo", () => {
    const run = runWith([card(2), card(2), card(2), card(2), card(2)], {
      piatto: 20,
      balances: [50, 50, 50],
      santini: ["corno_rosso"],
    });
    const first = apply(run, { type: "play", amount: 5 });
    expect(first.events).toContainEqual({ type: "santino_triggered", santino: "corno_rosso", amount: 5 });
    expect(getHero(first.run).balance).toBe(50);
    expect(first.run.table.piatto).toBe(20);

    let next = apply(first.run, { type: "bot_turn" }).run;
    next = apply(next, { type: "bot_turn" }).run;
    const second = apply(next, { type: "play", amount: 5 }).run;
    expect(getHero(second).balance).toBe(45);
  });

  it("Santa Rosalia: dopo 3 perdite di fila la vincita paga il doppio, preso dal piatto", () => {
    const run = runWith([card(2), card(9)], { piatto: 30, lossStreak: 3, santini: ["santa_rosalia"] });
    const { run: next, events } = apply(run, { type: "play", amount: 10 });
    expect(events).toContainEqual({ type: "santino_triggered", santino: "santa_rosalia", amount: 10 });
    expect(next.lastDraw?.delta).toBe(20);
    expect(next.table.piatto).toBe(10);
    expect(next.lossStreak).toBe(0);
  });

  it("Santa Rosalia non prende più di quello che c'è nel piatto", () => {
    const run = runWith([card(2), card(2), card(9)], {
      piatto: 15,
      lossStreak: 4,
      santini: ["santa_rosalia"],
    });
    const { run: next } = apply(run, { type: "play", amount: 10 });
    expect(next.lastDraw?.delta).toBe(15);
  });

  it("Fico d'India: +1 moneta per i bastoni pescati da chiunque", () => {
    const run = runWith([card(2), card(3, "bastoni"), card(2, "bastoni")], {
      piatto: 30,
      balances: [50, 50, 50],
      santini: ["fico_d_india"],
    });
    const afterHero = apply(run, { type: "play", amount: 3 });
    expect(getHero(afterHero.run).balance).toBe(50 - 3 + 1);
    const afterBot = apply(afterHero.run, { type: "bot_turn" });
    expect(afterBot.events).toContainEqual({ type: "santino_triggered", santino: "fico_d_india", amount: 1 });
    expect(getHero(afterBot.run).balance).toBe(49);
  });

  it("Sant'Antonio: l'eroe non paga la posta quando si siede né quando il piatto si svuota", () => {
    const { ante } = RUN_TABLES[1];
    const cleared: RunState = {
      ...createRun(1, "Eroe"),
      phase: "shop",
      bankroll: 120,
      shop: { offers: [], rerolls: 0 },
      santini: ["sant_antonio"],
    };
    const seated = apply(cleared, { type: "next_table" }).run;
    expect(getHero(seated).balance).toBe(120);
    expect(seated.table.piatto).toBe(ante * RUN_TABLES[1].opponents.length);

    const run = runWith([card(2), card(2), card(9)], {
      piatto: 10,
      balances: [50, 50, 50],
      santini: ["sant_antonio"],
    });
    const { run: refilled } = apply(run, { type: "play", amount: 10 });
    expect(getHero(refilled).balance).toBe(60);
  });

  it("Salvadanaio: interessi a tavolo superato, ma non per raggiungere la quota", () => {
    const { quota } = RUN_TABLES[0];
    const run = runWith([card(9)], { piatto: 31, balances: [quota, 50, 50], santini: ["salvadanaio"] });
    const { run: cleared, events } = apply(run, { type: "play", amount: 1 });
    // 100 + 11 di piatto: 11 monete di interessi sarebbero 11, ma il massimo è 5
    expect(events).toContainEqual({ type: "santino_triggered", santino: "salvadanaio", amount: 5 });
    expect(cleared.bankroll).toBe(quota + 11 + 5);

    const short = runWith([card(2)], { piatto: 3, balances: [quota - 2, 50, 50], santini: ["salvadanaio"] });
    expect(apply(short, { type: "play", amount: 1 }).run.phase).toBe("lost");
  });

  it("Coppola del nonno: una volta per tavolo mostra la prossima carta, che poi esce davvero", () => {
    const run = runWith([card(2), card(7, "spade")], { santini: ["coppola_del_nonno"] });
    const { run: peeked, events } = apply(run, { type: "peek" });
    expect(events).toEqual([{ type: "card_peeked", card: card(7, "spade") }]);
    expect(peeked.peeked).toEqual(card(7, "spade"));
    expect(applyRunAction(peeked, { type: "peek" })).toEqual({ ok: false, error: "already_used" });

    const drawn = apply(peeked, { type: "play", amount: 1 }).run;
    expect(drawn.lastDraw?.card).toEqual(card(7, "spade"));
    expect(drawn.peeked).toBeNull();
  });

  it("senza Coppola non si sbircia", () => {
    expect(applyRunAction(runWith([card(2)]), { type: "peek" })).toEqual({ ok: false, error: "not_owned" });
  });

  it("Memoria di ferro: mostra solo le ultime 5 carte uscite", () => {
    let run = runWith(
      Array.from({ length: 10 }, (_, i) => card((i % 4) + 1)),
      { piatto: 100, balances: [200, 200, 200], santini: ["memoria_di_ferro"] },
    );
    for (let i = 0; i < 6; i++) {
      const current = run.table.players[run.table.currentTurn];
      run = apply(run, current.hero ? { type: "play", amount: 1 } : { type: "bot_turn" }).run;
    }
    expect(run.seen).toHaveLength(6);
    expect(rememberedCards(run)).toEqual(run.seen.slice(-5));
    expect(rememberedCards({ ...run, santini: [] })).toEqual([]);
  });
});

describe("consumabili", () => {
  it("Passo: il turno va all'avversario senza puntare e il consumabile si consuma", () => {
    const run = runWith([card(2)], { consumables: ["passo", "brucia"] });
    const { run: next, events } = apply(run, { type: "use", item: "passo" });
    expect(events).toEqual([{ type: "consumable_used", item: "passo" }]);
    expect(next.table.currentTurn).toBe(1);
    expect(next.consumables).toEqual(["brucia"]);
    expect(getHero(next).balance).toBe(getHero(run).balance);
  });

  it("Brucia: scarta la prima carta senza farla vedere", () => {
    const run = runWith([card(2), card(3), card(9)], { consumables: ["brucia"] });
    const { run: next } = apply(run, { type: "use", item: "brucia" });
    expect(next.table.deck).toEqual([card(2), card(3)]);
    expect(next.seen).toEqual([]);
    expect(next.table.currentTurn).toBe(0);
  });

  it("Brucia sull'ultima carta chiude il tavolo", () => {
    const { quota } = RUN_TABLES[0];
    const run = runWith([card(9)], { piatto: 30, balances: [quota, 50, 50], consumables: ["brucia"] });
    const { run: next } = apply(run, { type: "use", item: "brucia" });
    expect(next.phase).toBe("table_cleared");
    expect(next.bankroll).toBe(quota + 10);
  });

  it("Mischia: le stesse carte in un altro ordine", () => {
    const deck = Array.from({ length: 10 }, (_, i) => card(i + 1));
    const run = runWith(deck, { consumables: ["mischia"] });
    const { run: next } = apply(run, { type: "use", item: "mischia" });
    expect([...next.table.deck].sort((a, b) => a.value - b.value)).toEqual(deck);
    expect(next.table.deck).not.toEqual(deck);
  });

  it("non si usa un consumabile che non si ha, né fuori dal proprio turno", () => {
    const run = runWith([card(2)], { consumables: ["passo"] });
    expect(applyRunAction(run, { type: "use", item: "brucia" })).toEqual({ ok: false, error: "not_owned" });
    const botTurn = apply(run, { type: "use", item: "passo" }).run;
    expect(applyRunAction({ ...botTurn, consumables: ["passo"] }, { type: "use", item: "passo" })).toEqual({
      ok: false,
      error: "not_hero_turn",
    });
  });
});

it("ogni oggetto del catalogo ha nome ed effetto", () => {
  for (const item of [...Object.values(SANTINI), ...Object.values(CONSUMABLES)]) {
    expect(item.name.length).toBeGreaterThan(0);
    expect(item.effect.length).toBeGreaterThan(0);
  }
});
