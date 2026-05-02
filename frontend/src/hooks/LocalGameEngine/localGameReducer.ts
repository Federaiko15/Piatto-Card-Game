import type {
  LocalGameState,
  OfflinePlayer,
  SingleCard,
  TypeOfPlayer,
  Action,
} from "./types.ts";

import { shuffleDeck, createDeck } from "./deck.ts";
import { getNextTurnIndex } from "./turn.ts";

const BOT_NAMES = [
  "Giovannino",
  "Angela",
  "Giuseppe",
  "Maria",
  "Vincenzo",
  "Giovanna",
] as const;

const PERSONALITIES: TypeOfPlayer[] = [
  "Aggressivo",
  "Calmo",
  "Tirchio",
  "Pazzo",
  "Calcolatore",
];

const buildPlayers = (
  userName: string,
  numPlayers: number,
): OfflinePlayer[] => {
  const initialPlayers: OfflinePlayer[] = [
    {
      playerId: 0,
      id: "hero-0",
      hero: true,
      username: userName,
      balance: 1000,
      status: "playing",
      currentBet: 0,
    },
  ];

  for (let i = 1; i < numPlayers; i++) {
    initialPlayers.push({
      playerId: i,
      id: `bot-${i}`,
      hero: false,
      username: BOT_NAMES[i - 1] ?? `Bot ${i}`,
      balance: 1000,
      status: "playing",
      currentBet: 0,
      personality:
        PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
    });
  }

  return initialPlayers;
};

const getUpdatedProportion = (current: number, card: SingleCard): number => {
  if (card.value <= 5) return current - 1;
  return current + 1;
};

export const createInitialState = (
  userName: string,
  starterBet: number,
  numPlayers: number,
): LocalGameState => {
  return {
    players: buildPlayers(userName, numPlayers),
    piatto: starterBet * numPlayers,
    card: { seed: "", value: 0 },
    currentTurn: 0,
    currentDeck: shuffleDeck(createDeck()),
    proportionPosNeg: 0,
  };
};

export const reducer = (
  state: LocalGameState,
  action: Action,
): LocalGameState => {
  switch (action.type) {
    case "RESET_DECK":
      return {
        ...state,
        currentDeck: action.payload.deck,
        proportionPosNeg: 0,
      };

    case "PLAY_TURN": {
      const currentPlayer = state.players[state.currentTurn];

      if (!currentPlayer || currentPlayer.status !== "playing") {
        return state;
      }

      const bet = action.payload.bet;

      if (bet < 1 || bet > currentPlayer.balance || bet > state.piatto) {
        return state;
      }

      let workingDeck = state.currentDeck;
      let nextProportionBase = state.proportionPosNeg;

      if (workingDeck.length === 0) {
        workingDeck = shuffleDeck(createDeck());
        nextProportionBase = 0;
      }

      const drawnCard = workingDeck[workingDeck.length - 1];
      if (!drawnCard) return state;

      const newDeck = workingDeck.slice(0, -1); // questo rimuove la carta "dall'alto", dall'ultima posizione
      const win = drawnCard.value > 5;

      const updatedPlayers: OfflinePlayer[] = state.players.map(
        (player, index) => {
          if (index !== state.currentTurn) {
            return { ...player, currentBet: 0 };
          }

          const newBalance = win ? player.balance + bet : player.balance - bet;

          return {
            ...player,
            balance: newBalance,
            status: newBalance <= 0 ? "eliminato" : "playing",
            currentBet: 0,
          };
        },
      );

      const nextTurn = getNextTurnIndex(updatedPlayers, state.currentTurn);

      return {
        ...state,
        players: updatedPlayers,
        piatto: win ? state.piatto - bet : state.piatto + bet,
        card: drawnCard,
        currentDeck: newDeck,
        proportionPosNeg: getUpdatedProportion(nextProportionBase, drawnCard),
        currentTurn: nextTurn,
      };
    }

    default:
      return state;
  }
};
