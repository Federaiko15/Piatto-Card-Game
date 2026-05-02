import ActiveGame from "./ActiveGame.js";

const register = new Map();

const createNewGame = (
  lobbyId,
  starterBet,
  activePlayers,
  piattoIniziale,
  idCreatore,
) => {
  const exist = register.has(lobbyId);
  if (exist) {
    throw new Error("Esiste già un game per questa lobby");
  }
  const newGame = new ActiveGame(
    starterBet,
    activePlayers,
    piattoIniziale,
    idCreatore,
  );
  register.set(lobbyId, newGame);
};

const getGame = (lobbyId) => {
  const game = register.get(lobbyId);

  if (!game) {
    throw new Error("Non esiste un game con questo id");
  }

  return game;
};

const deleteGame = (lobbyId) => {
  const exist = register.has(lobbyId);
  if (!exist) {
    throw new Error("Non esiste un game con questo id");
  } else {
    register.delete(lobbyId);
  }
};

export { createNewGame, getGame, deleteGame };
