import { useEffect, useReducer, useCallback } from "react";
import { reducer, createInitialState } from "./localGameReducer";
import { botDecision } from "./botDecision";

export function useLocalGameEngine(
  userName: string,
  starterBet: number,
  numPlayers: number,
) {
  const [state, dispatch] = useReducer(
    reducer,
    { userName, starterBet, numPlayers },
    ({ userName, starterBet, numPlayers }) =>
      createInitialState(userName, starterBet, numPlayers),
  );

  const playTurn = useCallback((bet: number) => {
    dispatch({ type: "PLAY_TURN", payload: { bet } });
  }, []);

  useEffect(() => {
    const currentPlayer = state.players[state.currentTurn];
    if (
      !currentPlayer ||
      currentPlayer.hero ||
      currentPlayer.status !== "playing"
    )
      return;

    const timer = window.setTimeout(() => {
      const botBet = botDecision(
        currentPlayer.personality!,
        currentPlayer.balance,
        state.piatto,
        state.proportionPosNeg,
      );

      dispatch({ type: "PLAY_TURN", payload: { bet: botBet } });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [state.currentTurn]);

  return {
    ...state,
    playTurn,
  };
}
