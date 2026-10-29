import { SEEDS, type Card, type Seed } from "../core/cards.js";
import { createShuffledDeck } from "../core/deck.js";
import { createRngFromState, type Rng } from "../core/rng.js";

// Ti vitti ("ti ho visto"), il gioco dell'incappucciato in cantina. Due giocatori, 20 carte coperte a testa.
// Nel proprio turno si gira la prima carta del mazzo: se vale esattamente 1 in più della cima della pila
// dell'avversario (un 5 su un 4, il re non va sull'asso) gliela si mette sopra e si gira ancora; dopo, anche la
// cima della propria pila va sopra la sua se vale 1 in più, a catena. Altrimenti la carta va sulla propria pila e
// il turno passa. Gli assi si mettono da parte al centro e su ognuno, come in un solitario, chiunque può
// mettere la carta successiva dello stesso seme (il 2 sull'asso, poi il 3...): sono le scale, e le carte che
// ci finiscono escono dal gioco. Si possono mettere nelle scale sia la carta girata sia la cima della propria
// pila, e poi si gira ancora. Quando il mazzo finisce, la propria pila si capovolge e torna mazzo, senza mescolarla:
// vince chi resta senza carte.
// Le mosse sull'avversario e sulle scale sono obbligate (se una carta può andare in tutti e due i posti si
// sceglie): chi ne salta una può sentirsi dire "ti vitti" e gira 3 carte sulla
// propria pila, perdendo il turno. Chi dice "ti vitti" a vuoto prende la penalità al posto suo.

export type TiVittiSeat = 0 | 1; // 0 l'eroe, 1 l'incappucciato

export const TI_VITTI_CARDS = 20; // le carte di ognuno all'inizio
export const TI_VITTI_PENALTY = 3; // le carte da girare per un "ti vitti"
export const TI_VITTI_MAX_TURNS = 400; // oltre, vince chi ha meno carte (a parità, l'incappucciato)

export interface TiVittiHand {
  deck: Card[]; // coperte: la prossima da girare è l'ultima
  pile: Card[]; // scoperte davanti al giocatore: la cima è l'ultima
}

export interface TiVittiState {
  hands: [TiVittiHand, TiVittiHand];
  stacks: Record<Seed, number>; // le scale al centro: la carta più alta di ogni seme (0 se l'asso non è uscito)
  turn: TiVittiSeat;
  flipped: Card | null; // la carta appena girata da chi è di turno, ancora da posare
  mistake: TiVittiSeat | null; // chi ha appena saltato una mossa obbligata: l'altro può dire "ti vitti"
  turns: number;
  winner: TiVittiSeat | null;
}

export type TiVittiAction =
  | { type: "flip" } // gira la prima carta del proprio mazzo
  | { type: "give"; from: "flipped" | "pile" } // mette una carta sopra la pila dell'avversario
  | { type: "stack"; from: "flipped" | "pile" } // mette una carta nella scala del suo seme
  | { type: "keep" } // posa la carta girata sulla propria pila: il turno passa
  | { type: "ti_vitti" }; // l'avversario ha saltato una mossa obbligata

export type TiVittiEvent =
  | { type: "flipped"; seat: TiVittiSeat; card: Card }
  | { type: "given"; seat: TiVittiSeat; card: Card; from: "flipped" | "pile" }
  | { type: "stacked"; seat: TiVittiSeat; card: Card; from: "flipped" | "pile" }
  | { type: "kept"; seat: TiVittiSeat; card: Card }
  | { type: "turned_over"; seat: TiVittiSeat } // il mazzo era finito: la pila è stata capovolta
  | { type: "missed"; seat: TiVittiSeat } // ha saltato una mossa obbligata (l'interfaccia non lo dice all'eroe)
  | { type: "ti_vitti"; seat: TiVittiSeat; penalized: TiVittiSeat; cards: Card[] } // cards: quelle girate per penalità
  | { type: "turn"; seat: TiVittiSeat }
  | { type: "won"; seat: TiVittiSeat; reason: "no_cards" | "turn_limit" };

export type TiVittiError =
  | "game_over"
  | "not_your_turn"
  | "card_in_hand" // c'è già una carta girata da posare
  | "no_card_in_hand"
  | "empty_pile"
  | "does_not_fit";

export type TiVittiResult =
  | { ok: true; state: TiVittiState; events: TiVittiEvent[] }
  | { ok: false; error: TiVittiError };


export const otherSeat = (seat: TiVittiSeat): TiVittiSeat => (seat === 0 ? 1 : 0);

const top = (pile: readonly Card[]): Card | undefined => pile[pile.length - 1];

// Una carta va sopra un'altra se vale esattamente 1 in più: sul re (10) non va niente
export const fitsOn = (card: Card | undefined, onto: Card | undefined): boolean =>
  card !== undefined && onto !== undefined && card.value === onto.value + 1;

// Va nella scala del suo seme: l'asso apre la scala, poi ogni carta va sulla precedente
export const fitsStack = (card: Card | undefined, stacks: Record<Seed, number>): boolean =>
  card !== undefined && card.value === stacks[card.seed] + 1;

export const cardsLeft = (hand: TiVittiHand): number => hand.deck.length + hand.pile.length;

// Il mazzo si divide a metà e si tira a sorte chi comincia
export const createTiVitti = (seed: number): TiVittiState => {
  const rng = createRngFromState(seed);
  const deck = createShuffledDeck(rng.next);
  const turn: TiVittiSeat = rng.next() < 0.5 ? 0 : 1;
  return {
    hands: [
      { deck: deck.slice(0, TI_VITTI_CARDS), pile: [] },
      { deck: deck.slice(TI_VITTI_CARDS), pile: [] },
    ],
    stacks: Object.fromEntries(SEEDS.map((seed) => [seed, 0])) as Record<Seed, number>,
    turn,
    flipped: null,
    mistake: null,
    turns: 0,
    winner: null,
  };
};

// La mossa obbligata di chi è di turno, se c'è: con una carta in mano conta quella, altrimenti la cima della
// propria pila. Dare la carta all'avversario viene prima della scala (gli lascia una carta in più), ma
// quando si può fare tutte e due le cose si sceglie liberamente
export const mandatoryMove = (state: TiVittiState): TiVittiAction | null => {
  const from = state.flipped ? "flipped" : "pile";
  const card = state.flipped ?? top(state.hands[state.turn].pile);
  if (fitsOn(card, top(state.hands[otherSeat(state.turn)].pile))) return { type: "give", from };
  if (fitsStack(card, state.stacks)) return { type: "stack", from };
  return null;
};

// Lo stato si copia una volta per mossa e poi si modifica la copia
const copy = (state: TiVittiState): TiVittiState => ({
  ...state,
  stacks: { ...state.stacks },
  hands: [
    { deck: [...state.hands[0].deck], pile: [...state.hands[0].pile] },
    { deck: [...state.hands[1].deck], pile: [...state.hands[1].pile] },
  ],
});

// Gira la prima carta del mazzo. Se il mazzo è finito si capovolge la pila così com'è: la carta posata per prima,
// in fondo alla pila, diventa la prossima da girare
const takeCard = (state: TiVittiState, seat: TiVittiSeat, events: TiVittiEvent[]): Card | null => {
  const hand = state.hands[seat];
  if (hand.deck.length === 0 && hand.pile.length > 0) {
    hand.deck = [...hand.pile].reverse();
    hand.pile = [];
    events.push({ type: "turned_over", seat });
  }
  return hand.deck.pop() ?? null;
};

const checkWinner = (state: TiVittiState, events: TiVittiEvent[]) => {
  for (const seat of [0, 1] as const) {
    if (cardsLeft(state.hands[seat]) === 0 && !(state.turn === seat && state.flipped)) {
      state.winner = seat;
      events.push({ type: "won", seat, reason: "no_cards" });
      return;
    }
  }
};

const passTurn = (state: TiVittiState, to: TiVittiSeat, events: TiVittiEvent[]) => {
  state.turn = to;
  state.turns += 1;
  events.push({ type: "turn", seat: to });
  if (state.turns >= TI_VITTI_MAX_TURNS) {
    const [hero, stranger] = state.hands.map(cardsLeft);
    state.winner = hero < stranger ? 0 : 1;
    events.push({ type: "won", seat: state.winner, reason: "turn_limit" });
  }
};

export const applyTiVittiAction = (
  previous: TiVittiState,
  seat: TiVittiSeat,
  action: TiVittiAction,
): TiVittiResult => {
  if (previous.winner !== null) return { ok: false, error: "game_over" };
  const state = copy(previous);
  const events: TiVittiEvent[] = [];
  const opponent = otherSeat(seat);

  if (action.type === "ti_vitti") {
    // a vuoto, la penalità tocca a chi l'ha detto
    const penalized = state.mistake === opponent ? opponent : seat;
    const hand = state.hands[penalized];
    // la carta che aveva in mano va sulla sua pila, poi ne gira altre 3
    if (state.turn === penalized && state.flipped) hand.pile.push(state.flipped);
    state.flipped = null;
    const cards: Card[] = [];
    for (let i = 0; i < TI_VITTI_PENALTY; i++) {
      const card = takeCard(state, penalized, events);
      if (!card) break;
      hand.pile.push(card);
      cards.push(card);
    }
    state.mistake = null;
    events.push({ type: "ti_vitti", seat, penalized, cards });
    passTurn(state, otherSeat(penalized), events);
    return { ok: true, state, events };
  }

  if (state.turn !== seat) return { ok: false, error: "not_your_turn" };
  // chi gioca senza dire "ti vitti" si è lasciato scappare l'errore dell'avversario
  if (state.mistake === opponent) state.mistake = null;
  const hand = state.hands[seat];
  const opponentPile = state.hands[opponent].pile;
  const required = mandatoryMove(state);

  switch (action.type) {
    case "flip": {
      if (state.flipped) return { ok: false, error: "card_in_hand" };
      if (required) {
        state.mistake = seat;
        events.push({ type: "missed", seat });
      }
      const card = takeCard(state, seat, events);
      if (!card) return { ok: false, error: "empty_pile" }; // non succede: senza carte la partita è già vinta
      state.flipped = card;
      events.push({ type: "flipped", seat, card });
      break;
    }
    case "give": {
      const card = action.from === "flipped" ? state.flipped : top(hand.pile);
      if (!card) return { ok: false, error: action.from === "flipped" ? "no_card_in_hand" : "empty_pile" };
      if (!fitsOn(card, top(opponentPile))) return { ok: false, error: "does_not_fit" };
      if (action.from === "flipped") state.flipped = null;
      else hand.pile.pop();
      opponentPile.push(card);
      events.push({ type: "given", seat, card, from: action.from });
      checkWinner(state, events);
      break;
    }
    case "stack": {
      const card = action.from === "flipped" ? state.flipped : top(hand.pile);
      if (!card) return { ok: false, error: action.from === "flipped" ? "no_card_in_hand" : "empty_pile" };
      if (!fitsStack(card, state.stacks)) return { ok: false, error: "does_not_fit" };
      if (action.from === "flipped") state.flipped = null;
      else hand.pile.pop();
      state.stacks[card.seed] = card.value;
      events.push({ type: "stacked", seat, card, from: action.from });
      checkWinner(state, events);
      break;
    }
    case "keep": {
      if (!state.flipped) return { ok: false, error: "no_card_in_hand" };
      if (required) {
        state.mistake = seat;
        events.push({ type: "missed", seat });
      }
      hand.pile.push(state.flipped);
      events.push({ type: "kept", seat, card: state.flipped });
      state.flipped = null;
      passTurn(state, opponent, events);
      break;
    }
  }

  return { ok: true, state, events };
};

// L'incappucciato: vede sempre gli errori dell'eroe, ma ogni tanto si lascia scappare una mossa obbligata.
// carelessness è la probabilità di saltarne una: una volta su dieci, così chi sta attento vince poco più di
// metà delle partite (vedi il simulatore in test/tivitti.sim.test.ts)
export const TI_VITTI_CARELESSNESS = 1 / 10;

export const tiVittiBotAction = (
  state: TiVittiState,
  seat: TiVittiSeat,
  rng: Rng,
  carelessness = TI_VITTI_CARELESSNESS,
): TiVittiAction | null => {
  if (state.winner !== null) return null;
  if (state.mistake === otherSeat(seat)) return { type: "ti_vitti" };
  if (state.turn !== seat) return null;
  const required = mandatoryMove(state);
  if (required && rng() >= carelessness) return required;
  return state.flipped ? { type: "keep" } : { type: "flip" };
};
