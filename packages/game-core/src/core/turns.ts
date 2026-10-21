export interface TurnParticipant {
  status: string;
}

// Indice del prossimo giocatore ancora in gioco; se nessuno gioca resta sul turno attuale
export const nextTurnIndex = (
  players: readonly TurnParticipant[],
  currentTurn: number,
): number => {
  let nextIndex = currentTurn;
  for (let attempts = 0; attempts < players.length; attempts++) {
    nextIndex = (nextIndex + 1) % players.length;
    if (players[nextIndex].status === "playing") {
      return nextIndex;
    }
  }
  return currentTurn;
};
