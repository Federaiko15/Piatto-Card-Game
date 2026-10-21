import { useEffect, useReducer, useCallback, useState } from "react";
import { botBet, cardCount, createRng, randomSeed } from "@piatto/game-core";
import { createReducer, createInitialState } from "./localGameReducer";

export function useLocalGameEngine(
  userName: string,
  starterBet: number,
  numPlayers: number,
) {
  // un generatore con seed per partita: la stessa partita si può riprodurre conoscendo il seed
  const [rng] = useState(() => createRng(randomSeed()));
  const [reducer] = useState(() => createReducer(rng));

  const [state, dispatch] = useReducer(
    reducer,
    { userName, starterBet, numPlayers },
    ({ userName, starterBet, numPlayers }) =>
      createInitialState(userName, starterBet, numPlayers, rng),
  );

  const { table } = state;

  const playTurn = useCallback((bet: number) => {
    dispatch({ type: "PLAY_TURN", payload: { bet } });
  }, []);

  useEffect(() => {
    const currentPlayer = table.players[table.currentTurn];
    if (
      table.finished ||
      !currentPlayer ||
      currentPlayer.hero ||
      currentPlayer.status !== "playing"
    )
      return;

    const timer = window.setTimeout(() => {
      const bet = botBet(
        currentPlayer.personality!,
        currentPlayer.balance,
        table.piatto,
        cardCount(table.deck),
        rng,
      );

      dispatch({ type: "PLAY_TURN", payload: { bet } });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [table, rng]);

  return {
    players: table.players,
    piatto: table.piatto,
    currentTurn: table.currentTurn,
    finished: table.finished,
    card: state.card,
    lastTurnOutcome: state.lastTurnOutcome,
    playTurn,
  };
}
