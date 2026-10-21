import { describe, expect, it } from "vitest";
import {
  applyClassicAction,
  botBet,
  cardCount,
  createDeck,
  createRng,
  type Card,
  type ClassicPlayer,
  type ClassicTable,
} from "../src/index.js";

const rng = createRng(1);
const card = (value: number): Card => ({ seed: "denari", value });

const player = (id: string, balance = 100, status = "playing"): ClassicPlayer => ({
  id,
  username: id,
  balance,
  currentBet: 0,
  status,
});

// Le carte si pescano dalla fine dell'array: l'ultima è la prossima
const table = (
  overrides: Partial<ClassicTable> = {},
): ClassicTable => ({
  players: [player("a"), player("b"), player("c")],
  piatto: 30,
  deck: [card(2), card(7)],
  currentTurn: 0,
  finished: null,
  ...overrides,
});

const play = (t: ClassicTable, playerId: string, amount: number) => {
  const bet = applyClassicAction(t, { type: "bet", playerId, amount }, rng);
  if (!bet.ok) throw new Error(bet.error);
  return applyClassicAction(bet.table, { type: "draw", playerId }, rng);
};

describe("puntata", () => {
  it("registra la puntata senza toccare saldo e piatto", () => {
    const result = applyClassicAction(table(), { type: "bet", playerId: "a", amount: 5 }, rng);
    expect(result.ok && result.table.players[0].currentBet).toBe(5);
    expect(result.ok && result.table.players[0].balance).toBe(100);
    expect(result.ok && result.table.piatto).toBe(30);
    expect(result.ok && result.events).toEqual([{ type: "bet_placed", playerId: "a", amount: 5 }]);
  });

  it("rifiuta chi non è di turno", () => {
    expect(applyClassicAction(table(), { type: "bet", playerId: "b", amount: 5 }, rng))
      .toEqual({ ok: false, error: "not_your_turn" });
  });

  it("rifiuta un giocatore sconosciuto", () => {
    expect(applyClassicAction(table(), { type: "bet", playerId: "z", amount: 5 }, rng))
      .toEqual({ ok: false, error: "unknown_player" });
  });

  it("rifiuta puntate oltre il piatto o il saldo", () => {
    expect(applyClassicAction(table(), { type: "bet", playerId: "a", amount: 31 }, rng))
      .toEqual({ ok: false, error: "bet_exceeds_pot" });
    const poor = table({ players: [player("a", 4), player("b")] });
    expect(applyClassicAction(poor, { type: "bet", playerId: "a", amount: 5 }, rng))
      .toEqual({ ok: false, error: "insufficient_balance" });
  });
});

describe("pescata", () => {
  it("serve prima una puntata", () => {
    expect(applyClassicAction(table(), { type: "draw", playerId: "a" }, rng))
      .toEqual({ ok: false, error: "no_bet" });
  });

  it("chi non è di turno non può pescare", () => {
    expect(applyClassicAction(table(), { type: "draw", playerId: "b" }, rng))
      .toEqual({ ok: false, error: "not_your_turn" });
  });

  it("con 6-10 prende la puntata dal piatto e passa il turno", () => {
    const result = play(table({ deck: [card(6)] }), "a", 10);
    if (!result.ok) throw new Error(result.error);
    expect(result.table.players[0]).toMatchObject({ balance: 110, currentBet: 0 });
    expect(result.table.piatto).toBe(20);
    expect(result.table.currentTurn).toBe(1);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "card_drawn", outcome: "win" }));
  });

  it("con 1-5 lascia la puntata nel piatto", () => {
    const result = play(table({ deck: [card(5)] }), "a", 10);
    if (!result.ok) throw new Error(result.error);
    expect(result.table.players[0].balance).toBe(90);
    expect(result.table.piatto).toBe(40);
  });

  it("non modifica lo stato di partenza", () => {
    const start = table({ deck: [card(9)] });
    const snapshot = structuredClone(start);
    play(start, "a", 10);
    expect(start).toEqual(snapshot);
  });

  it("conserva i campi extra dei giocatori (es. dbSynced del server)", () => {
    const start = {
      ...table({ deck: [card(9)] }),
      players: [{ ...player("a"), avatar: "x" }, player("b")],
    };
    const bet = applyClassicAction(start, { type: "bet", playerId: "a", amount: 1 }, rng);
    if (!bet.ok) throw new Error(bet.error);
    expect(bet.table.players[0]).toHaveProperty("avatar", "x");
  });

  it("rimescola quando il mazzo è finito", () => {
    const result = play(table({ deck: [] }), "a", 1);
    if (!result.ok) throw new Error(result.error);
    expect(result.events[0]).toEqual({ type: "deck_reshuffled" });
    expect(result.table.deck).toHaveLength(39);
  });
});

describe("fine partita", () => {
  it("finisce quando il piatto si svuota", () => {
    const result = play(table({ piatto: 10, deck: [card(10)] }), "a", 10);
    if (!result.ok) throw new Error(result.error);
    expect(result.table.finished).toBe("pot_emptied");
    expect(result.table.currentTurn).toBe(0);
    expect(result.events.at(-1)).toEqual({ type: "game_over", reason: "pot_emptied" });
  });

  it("elimina chi resta senza soldi e finisce se resta un solo giocatore", () => {
    const start = table({ players: [player("a", 10), player("b")], deck: [card(1)] });
    const result = play(start, "a", 10);
    if (!result.ok) throw new Error(result.error);
    expect(result.table.players[0]).toMatchObject({ balance: 0, status: "eliminato" });
    expect(result.events).toContainEqual({ type: "player_eliminated", playerId: "a" });
    expect(result.table.finished).toBe("last_player_standing");
  });

  it("salta i giocatori eliminati nel giro dei turni", () => {
    const start = table({
      players: [player("a"), player("b", 0, "eliminato"), player("c")],
      deck: [card(8)],
    });
    const result = play(start, "a", 1);
    expect(result.ok && result.table.currentTurn).toBe(2);
  });

  it("a partita finita rifiuta ogni azione", () => {
    expect(applyClassicAction(table({ finished: "pot_emptied" }), { type: "timeout" }, rng))
      .toEqual({ ok: false, error: "game_over" });
  });
});

describe("timeout", () => {
  it("pesca automaticamente con puntata 1", () => {
    const result = applyClassicAction(table({ deck: [card(3)] }), { type: "timeout" }, rng);
    if (!result.ok) throw new Error(result.error);
    expect(result.table.players[0].balance).toBe(99);
    expect(result.table.piatto).toBe(31);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "card_drawn", bet: 1, automatic: true }));
  });

  it("ignora una puntata rimasta in sospeso", () => {
    const start = table({ players: [{ ...player("a"), currentBet: 20 }, player("b")], deck: [card(9)] });
    const result = applyClassicAction(start, { type: "timeout" }, rng);
    expect(result.ok && result.table.players[0]).toMatchObject({ balance: 101, currentBet: 0 });
  });

  it("salta il turno di chi non è attivo", () => {
    const start = table({ players: [player("a", 100, "logout"), player("b"), player("c")] });
    const result = applyClassicAction(start, { type: "timeout" }, rng);
    if (!result.ok) throw new Error(result.error);
    expect(result.events).toEqual([{ type: "turn_skipped", playerId: "a", reason: "not_playing" }]);
    expect(result.table.currentTurn).toBe(1);
    expect(result.table.deck).toHaveLength(2);
  });
});

describe("bot", () => {
  it("il conteggio è 0 a mazzo pieno e negativo se restano più carte alte", () => {
    expect(cardCount(createDeck())).toBe(0);
    expect(cardCount([card(7), card(8), card(2)])).toBe(-1);
  });

  it("le puntate dei bot sono sempre valide", () => {
    const random = createRng(5);
    for (const personality of ["Aggressivo", "Calmo", "Tirchio", "Pazzo", "Calcolatore"] as const) {
      for (let count = -10; count <= 10; count++) {
        const bet = botBet(personality, 50, 30, count, random);
        expect(bet).toBeGreaterThanOrEqual(1);
        expect(bet).toBeLessThanOrEqual(30);
        expect(Number.isInteger(bet)).toBe(true);
      }
    }
  });

  it("il Calcolatore punta di più quando il conteggio è favorevole", () => {
    expect(botBet("Calcolatore", 1000, 100, -6, rng)).toBeGreaterThan(botBet("Calcolatore", 1000, 100, 3, rng));
  });
});
