import { describe, expect, it } from "vitest";
import {
  createDeck,
  createRng,
  createShuffledDeck,
  drawCard,
  nextTurnIndex,
  piattoBet,
  shuffle,
  validateBet,
} from "../src/index.js";

describe("rng", () => {
  it("con lo stesso seed produce la stessa sequenza", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("produce numeri in [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe("mazzo", () => {
  it("ha 40 carte, 10 per seme, metà vincenti", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(40);
    expect(new Set(deck.map((c) => `${c.seed}-${c.value}`)).size).toBe(40);
    expect(deck.filter((c) => c.value > 5)).toHaveLength(20);
  });

  it("lo shuffle non modifica l'originale e mantiene le stesse carte", () => {
    const deck = createDeck();
    const copy = [...deck];
    const shuffled = shuffle(deck, createRng(1));
    expect(deck).toEqual(copy);
    expect([...shuffled].sort((x, y) => x.seed.localeCompare(y.seed) || x.value - y.value))
      .toEqual([...deck].sort((x, y) => x.seed.localeCompare(y.seed) || x.value - y.value));
  });

  it("lo stesso seed dà lo stesso ordine", () => {
    expect(createShuffledDeck(createRng(99))).toEqual(createShuffledDeck(createRng(99)));
  });

  it("pesca dall'ultima posizione", () => {
    const deck = createDeck();
    const { card, deck: rest, reshuffled } = drawCard(deck, createRng(1));
    expect(card).toEqual(deck[39]);
    expect(rest).toHaveLength(39);
    expect(reshuffled).toBe(false);
  });

  it("rimescola un nuovo mazzo quando è vuoto", () => {
    const { deck, reshuffled } = drawCard([], createRng(1));
    expect(reshuffled).toBe(true);
    expect(deck).toHaveLength(39);
  });
});

describe("turni", () => {
  const players = (statuses: string[]) => statuses.map((status) => ({ status }));

  it("passa al prossimo giocatore in gioco", () => {
    expect(nextTurnIndex(players(["playing", "playing", "playing"]), 0)).toBe(1);
    expect(nextTurnIndex(players(["playing", "playing", "playing"]), 2)).toBe(0);
  });

  it("salta eliminati e disconnessi", () => {
    expect(nextTurnIndex(players(["playing", "eliminato", "logout", "playing"]), 0)).toBe(3);
  });

  it("resta fermo se nessuno è in gioco", () => {
    expect(nextTurnIndex(players(["eliminato", "logout"]), 1)).toBe(1);
  });
});

describe("puntate", () => {
  it("rifiuta puntate non valide", () => {
    expect(validateBet(0, 10, 10)).toBe("invalid_bet");
    expect(validateBet(-3, 10, 10)).toBe("invalid_bet");
    expect(validateBet(Number.NaN, 10, 10)).toBe("invalid_bet");
    expect(validateBet("5", 10, 10)).toBe("invalid_bet");
  });

  it("controlla saldo e piatto", () => {
    expect(validateBet(11, 10, 50)).toBe("insufficient_balance");
    expect(validateBet(11, 50, 10)).toBe("bet_exceeds_pot");
    expect(validateBet(10, 10, 10)).toBeNull();
  });

  it("il pulsante Piatto punta il minimo tra saldo e piatto", () => {
    expect(piattoBet(100, 30)).toBe(30);
    expect(piattoBet(20, 30)).toBe(20);
  });
});
