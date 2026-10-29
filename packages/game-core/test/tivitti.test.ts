import { describe, expect, it } from "vitest";
import {
  TI_VITTI_PENALTY,
  applyTiVittiAction,
  cardsLeft,
  createRng,
  createTiVitti,
  fitsOn,
  mandatoryMove,
  tiVittiBotAction,
  type Card,
  type TiVittiAction,
  type TiVittiSeat,
  type TiVittiState,
} from "../src/index.js";

const card = (value: number): Card => ({ seed: "coppe", value });
const cards = (...values: number[]) => values.map(card);

// I mazzi si girano dalla fine dell'array e la cima delle pile è l'ultima carta
const game = (overrides: Partial<TiVittiState> = {}): TiVittiState => ({
  hands: [
    { deck: cards(1, 1, 1, 1, 1), pile: [] },
    { deck: cards(1, 1, 1, 1, 1), pile: [] },
  ],
  stacks: { denari: 0, bastoni: 0, spade: 0, coppe: 0 },
  turn: 0,
  flipped: null,
  mistake: null,
  turns: 0,
  winner: null,
  ...overrides,
});

const act = (state: TiVittiState, seat: TiVittiSeat, action: TiVittiAction) => {
  const result = applyTiVittiAction(state, seat, action);
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("ti vitti: la partita", () => {
  it("divide il mazzo in due mezzi da 20 carte", () => {
    const state = createTiVitti(42);
    expect(state.hands[0].deck).toHaveLength(20);
    expect(state.hands[1].deck).toHaveLength(20);
    expect([0, 1]).toContain(state.turn);
  });

  it("una carta va sopra solo se vale esattamente 1 in più, e il re non va sull'asso", () => {
    expect(fitsOn(card(5), card(4))).toBe(true);
    expect(fitsOn(card(6), card(4))).toBe(false);
    expect(fitsOn(card(4), card(4))).toBe(false);
    expect(fitsOn(card(1), card(10))).toBe(false);
    expect(fitsOn(card(5), undefined)).toBe(false);
  });
});

describe("ti vitti: il turno", () => {
  it("la carta che va sopra l'avversario si mette sulla sua pila e si gira ancora", () => {
    let state = game({ hands: [{ deck: cards(2, 5), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    expect(mandatoryMove(state)).toEqual({ type: "give", from: "flipped" });
    state = act(state, 0, { type: "give", from: "flipped" }).state;
    expect(state.hands[1].pile.map((c) => c.value)).toEqual([4, 5]);
    expect(state.turn).toBe(0);
    expect(state.flipped).toBeNull();
  });

  it("dopo, anche la cima della propria pila va sopra a catena", () => {
    let state = game({ hands: [{ deck: cards(2, 5), pile: cards(6) }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    state = act(state, 0, { type: "give", from: "flipped" }).state;
    expect(mandatoryMove(state)).toEqual({ type: "give", from: "pile" });
    state = act(state, 0, { type: "give", from: "pile" }).state;
    expect(state.hands[1].pile.map((c) => c.value)).toEqual([4, 5, 6]);
    expect(state.hands[0].pile).toEqual([]);
  });

  it("una carta che non va sopra si posa sulla propria pila e il turno passa", () => {
    let state = game({ hands: [{ deck: cards(2, 9), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    const result = act(state, 0, { type: "keep" });
    expect(result.state.hands[0].pile.map((c) => c.value)).toEqual([9]);
    expect(result.state.turn).toBe(1);
    expect(result.state.mistake).toBeNull();
  });

  it("non si può dare una carta che non va sopra", () => {
    let state = game({ hands: [{ deck: cards(2, 9), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    expect(applyTiVittiAction(state, 0, { type: "give", from: "flipped" })).toEqual({ ok: false, error: "does_not_fit" });
  });

  it("finito il mazzo, la propria pila si capovolge senza mescolarla e torna mazzo", () => {
    // la pila ha il 3 in fondo (posato per primo) e l'8 in cima
    const state = game({ hands: [{ deck: [], pile: cards(3, 6, 8) }, { deck: cards(1), pile: cards(10) }] });
    const result = act(state, 0, { type: "flip" });
    expect(result.events.map((e) => e.type)).toEqual(["turned_over", "flipped"]);
    expect(result.state.flipped).toEqual(card(3));
    expect(result.state.hands[0].deck.map((c) => c.value)).toEqual([8, 6]);
    expect(cardsLeft(result.state.hands[0])).toBe(2);
  });

  it("vince chi resta senza carte", () => {
    let state = game({ hands: [{ deck: cards(5), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    const result = act(state, 0, { type: "give", from: "flipped" });
    expect(result.state.winner).toBe(0);
    expect(result.events.at(-1)).toEqual({ type: "won", seat: 0, reason: "no_cards" });
  });
});

describe("ti vitti: le scale", () => {
  const denari = (value: number): Card => ({ seed: "denari", value });

  it("l'asso apre la scala del suo seme e si gira ancora", () => {
    let state = game({ hands: [{ deck: cards(9, 1), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    expect(mandatoryMove(state)).toEqual({ type: "stack", from: "flipped" });
    state = act(state, 0, { type: "stack", from: "flipped" }).state;
    expect(state.stacks.coppe).toBe(1);
    expect(state.flipped).toBeNull();
    expect(state.turn).toBe(0);
  });

  it("sulla scala va solo la carta successiva dello stesso seme", () => {
    const stacks = { denari: 0, bastoni: 0, spade: 0, coppe: 1 };
    const state = game({ stacks, hands: [{ deck: cards(9), pile: [] }, { deck: cards(1), pile: cards(9) }], flipped: denari(2) });
    expect(applyTiVittiAction(state, 0, { type: "stack", from: "flipped" })).toEqual({ ok: false, error: "does_not_fit" });
    const ok = act({ ...state, flipped: card(2) }, 0, { type: "stack", from: "flipped" });
    expect(ok.state.stacks.coppe).toBe(2);
  });

  it("anche la cima della propria pila va nella scala", () => {
    const stacks = { denari: 0, bastoni: 0, spade: 0, coppe: 2 };
    const state = game({ stacks, hands: [{ deck: cards(9), pile: cards(7, 3) }, { deck: cards(1), pile: cards(9) }] });
    expect(mandatoryMove(state)).toEqual({ type: "stack", from: "pile" });
    const result = act(state, 0, { type: "stack", from: "pile" });
    expect(result.state.hands[0].pile.map((c) => c.value)).toEqual([7]);
    expect(result.state.stacks.coppe).toBe(3);
  });

  it("non mettere nella scala una carta che ci va è un errore", () => {
    let state = game({ hands: [{ deck: cards(9, 1), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    expect(act(state, 0, { type: "keep" }).state.mistake).toBe(0);
  });

  it("se la carta va sia sull'avversario sia nella scala si sceglie: tutte e due le mosse vanno bene", () => {
    const stacks = { denari: 0, bastoni: 0, spade: 0, coppe: 4 };
    const state = game({ stacks, flipped: card(5), hands: [{ deck: cards(9), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    expect(act(state, 0, { type: "give", from: "flipped" }).state.mistake).toBeNull();
    expect(act(state, 0, { type: "stack", from: "flipped" }).state.mistake).toBeNull();
  });

  it("le carte nelle scale escono dal gioco: chi mette l'ultima vince", () => {
    const state = game({ flipped: card(1), hands: [{ deck: [], pile: [] }, { deck: cards(1), pile: cards(9) }] });
    expect(act(state, 0, { type: "stack", from: "flipped" }).state.winner).toBe(0);
  });
});

describe("ti vitti: gli errori", () => {
  it("posare sulla propria pila una carta che andava sull'avversario è un errore", () => {
    let state = game({ hands: [{ deck: cards(2, 5), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    const result = act(state, 0, { type: "keep" });
    expect(result.state.mistake).toBe(0);
    expect(result.events).toContainEqual({ type: "missed", seat: 0 });
  });

  it("girare prima di spostare la cima della propria pila è un errore", () => {
    // l'avversario ha appena posato un 4 e la mia pila ha un 5 in cima
    const state = game({ hands: [{ deck: cards(2, 9), pile: cards(5) }, { deck: cards(1), pile: cards(4) }] });
    expect(mandatoryMove(state)).toEqual({ type: "give", from: "pile" });
    expect(act(state, 0, { type: "flip" }).state.mistake).toBe(0);
  });

  it("con \"ti vitti\" chi ha sbagliato gira 3 carte sulla sua pila e perde il turno", () => {
    let state = game({ hands: [{ deck: cards(1, 2, 3, 9, 5), pile: [] }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state; // gira il 5 e non lo dà
    state = act(state, 0, { type: "keep" }).state;
    const result = act(state, 1, { type: "ti_vitti" });
    expect(result.state.hands[0].pile.map((c) => c.value)).toEqual([5, 9, 3, 2]);
    expect(result.state.hands[0].deck).toHaveLength(5 - 1 - TI_VITTI_PENALTY);
    expect(result.state.turn).toBe(1);
    expect(result.state.mistake).toBeNull();
  });

  it("detto mentre chi ha sbagliato ha ancora la carta in mano, anche quella va sulla sua pila", () => {
    let state = game({ hands: [{ deck: cards(1, 2, 3, 9, 7), pile: cards(5) }, { deck: cards(1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state; // doveva prima dare il 5
    const result = act(state, 1, { type: "ti_vitti" });
    expect(result.state.hands[0].pile.map((c) => c.value)).toEqual([5, 7, 9, 3, 2]);
    expect(result.state.flipped).toBeNull();
    expect(result.state.turn).toBe(1);
  });

  it("chi gioca senza dire \"ti vitti\" perde l'occasione", () => {
    let state = game({ hands: [{ deck: cards(2, 5), pile: [] }, { deck: cards(1, 1), pile: cards(4) }] });
    state = act(state, 0, { type: "flip" }).state;
    state = act(state, 0, { type: "keep" }).state;
    state = act(state, 1, { type: "flip" }).state;
    expect(state.mistake).toBeNull();
  });

  it("\"ti vitti\" a vuoto: la penalità tocca a chi l'ha detto", () => {
    const state = game({ turn: 1 });
    const result = act(state, 0, { type: "ti_vitti" });
    expect(result.events).toContainEqual(expect.objectContaining({ type: "ti_vitti", seat: 0, penalized: 0 }));
    expect(result.state.hands[0].pile).toHaveLength(TI_VITTI_PENALTY);
    expect(result.state.turn).toBe(1);
  });

  it("non si gioca fuori turno", () => {
    expect(applyTiVittiAction(game(), 1, { type: "flip" })).toEqual({ ok: false, error: "not_your_turn" });
  });
});

describe("ti vitti: l'incappucciato", () => {
  it("dice sempre \"ti vitti\" quando l'eroe sbaglia", () => {
    expect(tiVittiBotAction(game({ mistake: 0 }), 1, createRng(1))).toEqual({ type: "ti_vitti" });
  });

  it("senza distrazioni fa sempre la mossa obbligata", () => {
    const state = game({ turn: 1, hands: [{ deck: cards(1), pile: cards(4) }, { deck: cards(1), pile: cards(5) }] });
    expect(tiVittiBotAction(state, 1, createRng(1), 0)).toEqual({ type: "give", from: "pile" });
  });

  it("distratto, salta la mossa obbligata", () => {
    const state = game({ turn: 1, hands: [{ deck: cards(1), pile: cards(4) }, { deck: cards(1), pile: cards(5) }] });
    expect(tiVittiBotAction(state, 1, createRng(1), 1)).toEqual({ type: "flip" });
  });

  it("due incappucciati arrivano sempre alla fine della partita", () => {
    for (let seed = 1; seed <= 50; seed++) {
      let state = createTiVitti(seed);
      const rng = createRng(seed);
      for (let step = 0; step < 20000 && state.winner === null; step++) {
        for (const seat of [state.turn, (1 - state.turn) as TiVittiSeat]) {
          const action = tiVittiBotAction(state, seat, rng);
          if (action) {
            state = act(state, seat, action).state;
            break;
          }
        }
      }
      expect(state.winner).not.toBeNull();
    }
  });
});
