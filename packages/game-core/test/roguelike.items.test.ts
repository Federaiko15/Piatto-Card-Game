import { describe, expect, it } from "vitest";
import {
  CONSUMABLES,
  FOODS,
  MAX_FOODS,
  MAX_SWAPS,
  MPANATA_MIN,
  MPURNATU_TURNS,
  MAX_CONSUMABLES,
  MAX_SANTINI,
  RUN_TABLES,
  BLESSING_SIZE,
  SANTINI,
  SHOP_SIZE,
  STARTING_BANKROLL,
  STRANGER_COINS,
  applyRunAction,
  createRng,
  createRun,
  editionTables,
  getHero,
  rememberedCards,
  rerollPrice,
  rollBlessing,
  rollShop,
  runTables,
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

  it("con tutti i santini già presi offre solo consumabili e cibi", () => {
    const all = Object.keys(SANTINI) as SantinoId[];
    const offers = Array.from({ length: 50 }, (_, seed) => rollShop(all, createRng(seed))).flat();
    expect(offers.every((o) => o?.kind === "consumable" || o?.kind === "food")).toBe(true);
    expect(offers.some((o) => o?.kind === "food")).toBe(true);
  });
});

describe("edizioni", () => {
  it("la demo non offre i santini del gioco completo", () => {
    const pupo = SANTINI.pupo_di_orlando;
    pupo.full = true;
    try {
      for (let seed = 1; seed <= 200; seed++) {
        const ids = rollShop([], createRng(seed), "demo").flatMap((o) => (o?.kind === "santino" ? [o.id] : []));
        expect(ids).not.toContain("pupo_di_orlando");
      }
      const full = Array.from({ length: 200 }, (_, seed) => rollShop([], createRng(seed), "full")).flat();
      expect(full.some((o) => o?.kind === "santino" && o.id === "pupo_di_orlando")).toBe(true);
    } finally {
      delete pupo.full;
    }
  });

  it("la notte della demo salta i tavoli del gioco completo", () => {
    const bisca = RUN_TABLES[1] as { full?: boolean };
    bisca.full = true;
    try {
      expect(editionTables("demo").map((t) => t.id)).toEqual(
        RUN_TABLES.filter((t) => t !== RUN_TABLES[1]).map((t) => t.id),
      );
      expect(editionTables("full")).toHaveLength(RUN_TABLES.length);
      const demo = createRun(1, "Eroe", "demo");
      expect(demo.edition).toBe("demo");
      expect(runTables(demo)).toHaveLength(RUN_TABLES.length - 1);
    } finally {
      delete bisca.full;
    }
  });
});

describe("santino della nonna", () => {
  it("offre tre santini diversi, comuni o rari, mai leggendari", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const offers = rollBlessing(createRng(seed));
      expect(offers).toHaveLength(BLESSING_SIZE);
      expect(new Set(offers).size).toBe(BLESSING_SIZE);
      for (const id of offers) expect(SANTINI[id].rarity).not.toBe("leggendario");
    }
  });

  it("la notte comincia dalla scelta, e il santino scelto entra nella build", () => {
    const run = createRun(7, "Eroe", "full", { blessing: true });
    expect(run.phase).toBe("blessing");
    expect(applyRunAction(run, { type: "play", amount: 1 })).toEqual({ ok: false, error: "wrong_phase" });
    expect(applyRunAction(run, { type: "choose_blessing", index: 5 })).toEqual({ ok: false, error: "invalid_choice" });

    const chosen = applyRunAction(run, { type: "choose_blessing", index: 1 });
    if (!chosen.ok) throw new Error(chosen.error);
    expect(chosen.run.phase).toBe("table");
    expect(chosen.run.santini).toEqual([run.blessing![1]]);
    expect(chosen.run.blessing).toBeNull();
    expect(applyRunAction(chosen.run, { type: "choose_blessing", index: 0 }).ok).toBe(false);
  });

  it("con Sant'Antonio l'eroe non paga la posta già al primo tavolo", () => {
    const seed = Array.from({ length: 500 }, (_, i) => i + 1).find((s) =>
      createRun(s, "Eroe", "full", { blessing: true }).blessing!.includes("sant_antonio"),
    )!;
    const run = createRun(seed, "Eroe", "full", { blessing: true });
    expect(getHero(run).balance).toBe(STARTING_BANKROLL - RUN_TABLES[0].ante);

    const chosen = applyRunAction(run, { type: "choose_blessing", index: run.blessing!.indexOf("sant_antonio") });
    if (!chosen.ok) throw new Error(chosen.error);
    expect(getHero(chosen.run).balance).toBe(STARTING_BANKROLL);
    expect(chosen.run.table.piatto).toBe(RUN_TABLES[0].ante * RUN_TABLES[0].opponents.length);
  });

  it("senza scelta iniziale (test e simulatore) si parte dal primo tavolo", () => {
    const run = createRun(7, "Eroe");
    expect(run.phase).toBe("table");
    expect(run.blessing).toBeNull();
  });
});

describe("l'incappucciato", () => {
  const strangerIndex = RUN_TABLES.findIndex((t) => t.stranger);

  // l'eroe esce dalla bottega prima della cantina e si siede con l'incappucciato
  const seatAtStranger = (santini: SantinoId[] = []) =>
    apply(shopWith([], 200, { tableIndex: strangerIndex - 1, santini }), { type: "next_table" }).run;

  // il tavolo dell'incappucciato appena superato
  const clearedStranger = (santini: SantinoId[] = []): RunState => ({
    ...seatAtStranger(santini),
    phase: "table_cleared",
    bankroll: 200,
  });

  it("siede alla cantina e mette in palio un oggetto che non si trova in bottega", () => {
    const run = seatAtStranger();
    expect(run.table.players.map((p) => p.character)).toContain("incappucciato");
    expect(SANTINI[run.strangerReward!.santino!].stranger).toBe(true);
    for (let seed = 1; seed <= 200; seed++) {
      const ids = rollShop([], createRng(seed)).flatMap((o) => (o?.kind === "santino" ? [o.id] : []));
      for (const id of ids) expect(SANTINI[id].stranger).toBeFalsy();
    }
  });

  it("prima della bottega va scelto il premio: monete o il suo oggetto", () => {
    const cleared = clearedStranger();
    expect(applyRunAction(cleared, { type: "enter_shop" })).toEqual({ ok: false, error: "reward_pending" });

    const coins = apply(cleared, { type: "choose_reward", reward: "coins" }).run;
    expect(coins.phase).toBe("shop");
    expect(coins.bankroll).toBe(200 + STRANGER_COINS);
    expect(coins.strangerReward).toBeNull();

    const item = apply(cleared, { type: "choose_reward", reward: "santino" }).run;
    expect(item.santini).toEqual([cleared.strangerReward!.santino]);
    expect(item.bankroll).toBe(200);
  });

  it("con i santini al completo il suo oggetto si prende solo con uno scambio", () => {
    const full: SantinoId[] = ["san_giuseppe", "corno_rosso", "fico_d_india", "salvadanaio", "santa_rosalia"];
    const cleared = clearedStranger(full);
    expect(applyRunAction(cleared, { type: "choose_reward", reward: "santino" })).toEqual({
      ok: false,
      error: "santini_full",
    });
    const swapped = apply(cleared, { type: "choose_reward", reward: "santino", replace: 0 }).run;
    expect(swapped.santini[0]).toBe(cleared.strangerReward!.santino);
    expect(swapped.swapsLeft).toBe(MAX_SWAPS - 1);
    expect(apply(cleared, { type: "choose_reward", reward: "coins" }).run.phase).toBe("shop");
  });

  it("Il Patto: si perde solo metà della puntata", () => {
    const run = runWith([card(9), card(3)], { piatto: 20, santini: ["patto"] });
    const { run: next, events } = apply(run, { type: "play", amount: 9 });
    expect(events).toContainEqual({ type: "santino_triggered", santino: "patto", amount: 4 });
    expect(next.lastDraw).toMatchObject({ outcome: "lose", delta: -5 });
    expect(next.table.piatto).toBe(25);
  });

  it("Corona di Re Ruggero: le figure pagano una puntata in più, dal banco", () => {
    const fante = apply(runWith([card(2), card(8)], { piatto: 20, santini: ["corona_di_ruggero"] }), {
      type: "play",
      amount: 5,
    }).run;
    // la puntata, una in più dal banco e la moneta che il fante ruba come sempre
    expect(fante.lastDraw).toMatchObject({ outcome: "win", delta: 11 });
    expect(fante.table.piatto).toBe(15);

    const re = apply(runWith([card(2), card(10)], { piatto: 20, santini: ["corona_di_ruggero"] }), {
      type: "play",
      amount: 5,
    }).run;
    expect(re.lastDraw).toMatchObject({ outcome: "win", delta: 15 });
  });
});

describe("santini delle build", () => {
  it("Sant'Agata: il 4 vince", () => {
    const { run: next, events } = apply(runWith([card(2), card(4)], { piatto: 20, santini: ["sant_agata"] }), {
      type: "play",
      amount: 4,
    });
    expect(events).toContainEqual({ type: "santino_triggered", santino: "sant_agata" });
    expect(next.lastDraw).toMatchObject({ outcome: "win", delta: 4 });
  });

  it("Carretto siciliano: +1 moneta per i denari pescati da chiunque", () => {
    const run = runWith([card(2), card(7, "denari")], { piatto: 20, santini: ["carretto_siciliano"] });
    const { run: next, events } = apply(run, { type: "play", amount: 3 });
    expect(events).toContainEqual({ type: "santino_triggered", santino: "carretto_siciliano", amount: 1 });
    expect(getHero(next).balance).toBe(getHero(run).balance + 3 + 1);
  });

  it("Paladino Rinaldo: il fante dell'eroe ruba 3", () => {
    const run = runWith([card(2), card(8)], { piatto: 20, santini: ["paladino_rinaldo"] });
    const { events } = apply(run, { type: "play", amount: 3 });
    expect(events).toContainEqual(expect.objectContaining({ type: "card_effect", effect: "fante", amount: 3 }));
  });

  it("Testa di Moro: le coppe vincono sempre", () => {
    const run = runWith([card(2), card(2, "coppe")], { piatto: 20, santini: ["testa_di_moro"] });
    expect(apply(run, { type: "play", amount: 3 }).run.lastDraw).toMatchObject({ outcome: "win" });
  });

  it("Trinacria: solo la prima carta bassa del tavolo vince", () => {
    const run = runWith([card(2), card(2), card(3)], { piatto: 20, santini: ["trinacria"] });
    const first = apply(run, { type: "play", amount: 3 }).run;
    expect(first.lastDraw).toMatchObject({ outcome: "win" });
    expect(first.trinacriaUsed).toBe(true);
    const again = apply({ ...first, table: { ...first.table, currentTurn: 0 } }, { type: "play", amount: 3 }).run;
    expect(again.lastDraw).toMatchObject({ outcome: "lose" });
  });

  it("nella demo c'è la Trinacria, la Testa di Moro solo nel gioco completo", () => {
    const demo = Array.from({ length: 300 }, (_, seed) => rollShop([], createRng(seed), "demo"))
      .flat()
      .flatMap((o) => (o?.kind === "santino" ? [o.id] : []));
    expect(demo).not.toContain("testa_di_moro");
    expect(demo).toContain("trinacria");
  });
});

describe("scambio dei santini", () => {
  const full: SantinoId[] = ["san_giuseppe", "corno_rosso", "fico_d_india", "salvadanaio", "santa_rosalia"];
  const offer = { kind: "santino" as const, id: "sant_agata" as const, price: 18 };

  it("con i santini al completo se ne compra uno nuovo lasciandone uno, finché ci sono scambi", () => {
    const run = shopWith([offer], 100, { santini: full });
    expect(run.swapsLeft).toBe(MAX_SWAPS);
    expect(applyRunAction(run, { type: "buy", index: 0 })).toEqual({ ok: false, error: "santini_full" });

    const { run: next, events } = apply(run, { type: "buy", index: 0, replace: 1 });
    expect(next.santini).toEqual(["san_giuseppe", "sant_agata", "fico_d_india", "salvadanaio", "santa_rosalia"]);
    expect(next.swapsLeft).toBe(MAX_SWAPS - 1);
    expect(next.bankroll).toBe(82);
    expect(events).toEqual([{ type: "item_bought", item: offer, replaced: "corno_rosso" }]);

    const noSwaps = shopWith([offer], 100, { santini: full, swapsLeft: 0 });
    expect(applyRunAction(noSwaps, { type: "buy", index: 0, replace: 1 })).toEqual({ ok: false, error: "no_swaps" });
  });

  it("con un posto libero lo scambio non serve e non si consuma", () => {
    const next = apply(shopWith([offer], 100, { santini: ["corno_rosso"] }), { type: "buy", index: 0, replace: 0 }).run;
    expect(next.santini).toEqual(["corno_rosso", "sant_agata"]);
    expect(next.swapsLeft).toBe(MAX_SWAPS);
  });
});

describe("cibi", () => {
  it("si comprano in bottega e vanno nel panaru, che ha un limite", () => {
    const item = { kind: "food" as const, id: "mpanata" as const, price: 6 };
    const bought = apply(shopWith([item], 50), { type: "buy", index: 0 }).run;
    expect(bought.foods).toEqual(["mpanata"]);
    expect(bought.bankroll).toBe(44);
    const full = shopWith([item], 50, { foods: Array(MAX_FOODS).fill("mpurnatu") });
    expect(applyRunAction(full, { type: "buy", index: 0 })).toEqual({ ok: false, error: "basket_full" });
  });

  it("'Mpanata: metà di quello che manca alla quota, almeno il minimo", () => {
    const run = { ...runWith([card(2)], { balances: [60] }), foods: ["mpanata" as const] };
    const quota = RUN_TABLES[0].quota;
    const { run: next, events } = apply(run, { type: "eat", food: "mpanata" });
    expect(events).toEqual([{ type: "food_eaten", food: "mpanata", amount: Math.ceil((quota - 60) / 2) }]);
    expect(getHero(next).balance).toBe(60 + Math.ceil((quota - 60) / 2));
    expect(next.foods).toEqual([]);

    const rich = { ...runWith([card(2)], { balances: [quota + 20] }), foods: ["mpanata" as const] };
    expect(getHero(apply(rich, { type: "eat", food: "mpanata" }).run).balance).toBe(quota + 20 + MPANATA_MIN);
  });

  it("'Mpurnatu: per qualche turno le perdite si dimezzano, poi passa", () => {
    const deck = Array.from({ length: MPURNATU_TURNS + 1 }, () => card(3));
    let run: RunState = { ...runWith(deck, { piatto: 30 }), foods: ["mpurnatu"] };
    run = apply(run, { type: "eat", food: "mpurnatu" }).run;
    expect(run.satiety).toBe(MPURNATU_TURNS);
    for (let turn = 0; turn < MPURNATU_TURNS; turn++) {
      const { run: next, events } = apply({ ...run, table: { ...run.table, currentTurn: 0 } }, { type: "play", amount: 6 });
      expect(events).toContainEqual({ type: "food_effect", food: "mpurnatu", amount: 3 });
      run = next;
    }
    const last = apply({ ...run, table: { ...run.table, currentTurn: 0 } }, { type: "play", amount: 6 }).run;
    expect(last.lastDraw).toMatchObject({ outcome: "lose", delta: -6 });
  });

  it("si mangia solo quello che si ha, e solo nel proprio turno", () => {
    const run = runWith([card(2)]);
    expect(applyRunAction(run, { type: "eat", food: "mpanata" })).toEqual({ ok: false, error: "not_owned" });
    const notMine = { ...run, foods: ["mpanata" as const], table: { ...run.table, currentTurn: 1 } };
    expect(applyRunAction(notMine, { type: "eat", food: "mpanata" })).toEqual({ ok: false, error: "not_hero_turn" });
    expect(Object.keys(FOODS)).toEqual(["mpanata", "mpurnatu"]);
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

it("ogni oggetto del catalogo ha il suo id come chiave", () => {
  for (const [key, item] of [...Object.entries(SANTINI), ...Object.entries(CONSUMABLES), ...Object.entries(FOODS)]) {
    expect(item.id).toBe(key);
  }
});
