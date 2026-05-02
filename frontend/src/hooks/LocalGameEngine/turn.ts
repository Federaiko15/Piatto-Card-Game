import type { OfflinePlayer } from "./types";

export const getNextTurnIndex = (
  players: OfflinePlayer[],
  currentTurn: number,
): number => {
  if (players.every((player) => player.status !== "playing")) {
    return currentTurn;
  }

  let nextIndex = currentTurn;

  for (let attempts = 0; attempts < players.length; attempts++) {
    nextIndex = (nextIndex + 1) % players.length;
    if (players[nextIndex].status === "playing") {
      return nextIndex;
    }
  }

  return currentTurn;
};
