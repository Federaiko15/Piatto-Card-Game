import { getGame, deleteGame } from "../game/GameStateManager.js";
import { deleteLobby } from "../controllers/lobby.controller.js";
import User from "../models/user.model.js";
import Lobby from "../models/lobby.model.js";
import createDeck from "../game/deck.js";

export const handleGameOver = async (lobbyId, io, messaggio) => {
  try {
    await Lobby.findByIdAndUpdate(lobbyId, {
      $set: { status: "finished" },
    });

    const game = getGame(lobbyId);
    game.stopTurnTimer(); // Fermiamo il timer in modo globale

    const playersToSync = game.activePlayers.filter(
      (player) => !player.dbSynced,
    );

    const updatePromises = playersToSync.map((player) => {
      return User.findByIdAndUpdate(player.id, {
        $set: { balance: player.balance },
      });
    });

    await Promise.all(updatePromises);
    console.log("Saldi salvati con successo nel Database!");

    io.to(lobbyId).emit("end_game", {
      message: messaggio,
      finalPlayers: game.activePlayers,
    });

    const socketsInRoom = await io.in(lobbyId).fetchSockets();
    for (const s of socketsInRoom) {
      s.leave(lobbyId);
    }

    deleteGame(lobbyId);
    await deleteLobby(lobbyId);
  } catch (error) {
    console.error("Errore durante la chiusura del gioco: ", error.message);
  }
};

export const handlePlayerExit = async (lobbyId, socket, io) => {
  if (!lobbyId) return;

  try {
    const game = getGame(lobbyId);
    if (!game) return;

    const indexPlayer = game.activePlayers.findIndex(
      (user) => user.id === socket.user.userId,
    );

    if (indexPlayer === -1) {
      console.log("Error in logout handler");
      return socket.emit("game_error", { message: `Server error` });
    }

    const existingPlayer = game.activePlayers[indexPlayer];
    const username = existingPlayer.username;

    if (game.status === "waiting") {
      game.activePlayers.splice(indexPlayer, 1);
      await User.findByIdAndUpdate(socket.user.userId, {
        $inc: { balance: game.starterBet },
        $set: { online: false },
      });
      game.piatto -= game.starterBet;
      await Lobby.findByIdAndUpdate(lobbyId, {
        $pull: { activePlayers: socket.user.userId },
      });
      console.log(`Rimborso effettuato per ${username}`);
    } else if (game.status === "playing" || game.status === "waiting_rematch") {
      existingPlayer.status = "logout";
      if (game.rematchPlayer) {
        game.rematchPlayer = game.rematchPlayer.filter(
          (p) => p.id !== existingPlayer.id,
        );
      }
      existingPlayer.dbSynced = true;
      await User.findByIdAndUpdate(existingPlayer.id, {
        $set: { balance: existingPlayer.balance },
      });
      io.to(lobbyId).emit("message_resolved", {
        userId: null,
        message: `L'utente ${username} è uscito dalla partita...`,
      });
    }

    socket.leave(lobbyId);

    const activeCount = game.activePlayers.filter(
      (p) => p.status === "playing",
    ).length;

    if (
      (game.status === "playing" || game.status === "waiting_rematch") &&
      activeCount <= 1
    ) {
      await handleGameOver(
        lobbyId,
        io,
        "La partita si è conclusa per mancanza di giocatori",
      );
    } else {
      io.to(lobbyId).emit("player_logout", {
        message: `L'utente ${username} si è disconnesso.`,
        activePlayers: game.activePlayers,
      });
    }
  } catch (error) {
    if (error.message.includes("Non esiste un game con questo id")) return;
    console.error("Errore in handlePlayerExit: ", error.message);
  }
};

export const handleGameReset = async (lobbyId, io) => {
  try {
    const game = getGame(lobbyId);
    if (!game || game.status !== "waiting_rematch") return;

    if (game.rematchPlayer.length <= 1) {
      await handleGameOver(
        lobbyId,
        io,
        "Non ci sono abbastanza giocatori per iniziare una nuova partita.",
      );
      return;
    }

    game.activePlayers = [...game.rematchPlayer];
    game.rematchPlayer = [];
    game.piatto = 0;
    game.activePlayers.forEach((player) => {
      player.balance -= game.starterBet;
      game.piatto += game.starterBet;
      player.currentBet = 0;
      player.status = "playing";
    });

    game.status = "playing";
    game.currentTurnIndex = 0;
    game.deck = createDeck();

    io.to(lobbyId).emit("new_game", {
      message: "La nuova partita è iniziata! Buona fortuna!",
      giocatoriAlTavolo: game.activePlayers,
      nuovaPartita: lobbyId,
      piatto: game.piatto,
      idCreatore: game.idCreatore,
    });

    game.startTurnTimer(); // Facciamo ripartire il timer per il primo turno della nuova partita
  } catch (error) {
    console.error("Errore in handleGameRestart:", error.message);
  }
};
