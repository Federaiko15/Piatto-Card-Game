import { deleteLobby } from "../controllers/lobby.controller.js";
import { getGame, deleteGame } from "../game/GameStateManager.js";
import User from "../models/user.model.js";

import { handlePlayerExit } from "../services/gameHandlerService.js";
import { broadcastTurnResult } from "../services/activeGameService.js";

const MAX_CHAT_MESSAGE_LENGTH = 300;

const registerGameHandlers = (io, socket) => {
  socket.on("create_lobby", (lobbyId) => {
    console.log(
      `Il giocatore ${socket.user.userId} è pronto nella lobby ${lobbyId}`,
    );

    io.to(lobbyId).emit("update_status", {
      message: "Un giocatore è pronto!",
      userId: socket.user.userId,
    });
  });

  socket.on("join_lobby_rooms", (lobbyId) => {
    socket.join(lobbyId);
    socket.data.lobbyId = lobbyId;

    try {
      const matchInProgress = getGame(lobbyId);
      if (!matchInProgress) return;

      const activePlayers = Array.isArray(matchInProgress.activePlayers)
        ? matchInProgress.activePlayers
        : [];

      if (
        matchInProgress.status === "playing" ||
        matchInProgress.status === "waiting_rematch"
      ) {
        const user = activePlayers.find((p) => p.id === socket.user.userId);

        if (user && user.status === "logout") {
          user.status = "playing";
          console.log(
            `Ripristinato lo status dell'utente ${user.username} dopo che si era disconnesso`,
          );

          socket.to(lobbyId).emit("player_reconnected", {
            message: `L'utente ${user.username} si è riconnesso!`,
            activePlayers: activePlayers,
          });

          // Avvisiamo in chat gli altri giocatori
          socket.to(lobbyId).emit("message_resolved", {
            userId: null,
            message: `L'utente ${user.username} è tornato in partita!`,
          });
        }

        socket.emit("new_game", {
          message:
            "You entered on a match in progress, Here are all the informations!",
          giocatoriAlTavolo: activePlayers,
          nuovaPartita: lobbyId,
          piatto: matchInProgress.piatto,
          idCreatore: matchInProgress.idCreatore,
          currentTurn: matchInProgress.currentTurnIndex,
        });
      } else {
        socket.emit("join_info", {
          message: "Aspetta nella sala di attesa che la stanza si riempia",
          idCreatore: matchInProgress.idCreatore,
          giocatoriAlTavolo: activePlayers,
        });
      }
    } catch (error) {
      console.log(
        "Nessuna partita in corso per i ritardatari, oppure:",
        error.message,
      );
    }
  });

  // Messaggi per gli errori restituiti da game-core
  const errorMessage = (error, bet, game) => {
    switch (error) {
      case "not_your_turn":
        return "Non è il tuo turno!";
      case "no_bet":
        return "Devi prima puntare!";
      case "invalid_bet":
        return "Puntata non valida!";
      case "insufficient_balance":
        return "Non hai abbastanza monete!";
      case "bet_exceeds_pot":
        return `Non puoi puntare ${bet}, nel piatto ci sono solo ${game.piatto} monete!`;
      case "game_over":
        return "La partita è già finita.";
      default:
        return "Mossa non valida.";
    }
  };

  socket.on("player_draw", async (lobbyId) => {
    try {
      const game = getGame(lobbyId);
      if (!game) return;

      // game-core controlla turno e puntata; se la mossa non è valida il timer continua a scorrere
      const result = game.apply({
        type: "draw",
        playerId: socket.user.userId,
      });
      if (!result.ok) {
        return socket.emit("game_error", {
          message: errorMessage(result.error, null, game),
        });
      }

      await broadcastTurnResult(game, result.events);
    } catch (error) {
      console.log("Errore in player_draw:", error.message);
    }
  });

  socket.on("rematch_request", (_personalId, lobbyId) => {
    // L'id mandato dal client viene ignorato: usiamo quello verificato dal JWT della socket
    const personalId = socket.user.userId;
    try {
      const game = getGame(lobbyId); // prendo il gioco dalla mia memoria RAM.
      if (!game) {
        return;
      }
      const user = game.activePlayers.find((u) => u.id === personalId);
      if (!user) {
        return;
      }
      if (user.balance >= game.starterBet) {
        // Evita che lo stesso utente venga inserito più volte se clicca due volte
        if (!game.rematchPlayer.some((p) => p.id === personalId)) {
          game.rematchPlayer.push(user);
        }
      } else {
        socket.emit("game_error", {
          message: "Non hai abbastanza monete per rientrare in questa lobby...",
        });
        handlePlayerExit(lobbyId, socket, io);
      }
    } catch (error) {
      console.error("Errore in rematch_request:", error.message);
    }
  });

  socket.on("player_bet", (bet, lobbyId) => {
    const message = `The player ${socket.user.userId} placed a bet of ${bet}`;
    console.log(message);

    try {
      const game = getGame(lobbyId);
      if (!game) return;

      // game-core controlla turno, validità della puntata, saldo e piatto
      const result = game.apply({
        type: "bet",
        playerId: socket.user.userId,
        amount: bet,
      });
      if (!result.ok) {
        return socket.emit("game_error", {
          message: errorMessage(result.error, bet, game),
        });
      }

      if (game.deck.length === 0) {
        io.to(lobbyId).emit("message_resolved", {
          userId: null,
          message: "Il mazziere ha rimescolato le carte",
        });
      }

      // ripartiamo col timer, così chi punta e non pesca non blocca la partita
      game.startTurnTimer();
      const user = game.activePlayers.find((u) => u.id === socket.user.userId);
      io.to(lobbyId).emit("bet_placed", {
        userId: user.id,
        amount: bet,
        message: `${user.username} punta ${bet} monete sul piatto di ${game.piatto}!`,
      });
    } catch (error) {
      console.error("Errore in player_bet:", error.message);
    }
  });

  socket.on("send_message", (lobbyId, message) => {
    const messageLog = `The player ${socket.user.userId} send a new message: ${message}`;
    console.log(messageLog);
    try {
      if (typeof message !== "string" || !message.trim()) {
        return socket.emit("game_error", {
          message: "Errore nel messagio mandato",
        });
      }

      if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
        return socket.emit("game_error", {
          message: `Il messaggio può avere al massimo ${MAX_CHAT_MESSAGE_LENGTH} caratteri.`,
        });
      }

      // Si può scrivere solo nella lobby in cui si è davvero entrati
      if (socket.data.lobbyId !== lobbyId || !socket.rooms.has(lobbyId)) {
        return socket.emit("game_error", {
          message: "Non fai parte di questa lobby.",
        });
      }

      io.to(lobbyId).emit("message_resolved", {
        userId: socket.user.userId,
        message: message,
      });
    } catch (error) {
      console.error("Errore nella risposta del server", error.message);
    }
  });

  socket.on("logout_request", async (lobbyId) => {
    console.log(`The player ${socket.user.userId} send a logout request`);

    socket.data.lobbyId = null;

    await handlePlayerExit(lobbyId, socket, io);
  });

  socket.on("close_room", async (lobbyId) => {
    try {
      const game = getGame(lobbyId);
      if (!game) {
        return socket.emit("game_error", { message: "La lobby non esiste." });
      }

      // controlliamo subito se ad aver chiamato la funzione è stato il creatore della lobby stessa.
      if (game.idCreatore !== socket.user.userId) {
        return socket.emit("game_error", {
          message: "Solo il creatore può eliminare la lobby.",
        });
      }

      // restituisco i soldi a tutti gli utenti dal momento che la partita non era ancora cominciata:
      if (game.status === "waiting") {
        const allPLayerIds = game.activePlayers.map((player) => player.id);
        // utilizzo la funzione di mongoose updateMany per aggiornare il saldo degli utenti sul DB
        await User.updateMany(
          { _id: { $in: allPLayerIds } },
          { $inc: { balance: game.starterBet } }, // prendo gli utenti tramite l'id e incremento il loro balance.
        );

        console.log(
          `Rimborso di ${game.starterBet} monete effettuato per la lobby ${lobbyId}`,
        );
      }
      // avviso quindi tutti gli utenti connessi nella stessa rooms
      io.to(lobbyId).emit("room_closed_by_creator", {
        message:
          "Il creatore ha annullato la partita. La lobby è stata chiusa.",
      });

      deleteGame(lobbyId); // elimino il game dalla map così che evito subito race condition per ipotetici collegamenti
      // prendo tutte le sockets collegate alla room definita sull'id univoco della lobby
      const socketsInRoom = await io.in(lobbyId).fetchSockets();
      for (const s of socketsInRoom) {
        s.leave(lobbyId); // e per ogni socket chiamo la funzione leave, che proprio elimina il collegamento dalla room
      }

      await deleteLobby(lobbyId); // e chiamo la funzione che elimina la lobby direttamente dal DB
    } catch (error) {
      console.error("Errore durante la chiusura della room: ", error.message);
    }
  });

  socket.on("disconnect", async () => {
    // evento che mi gestisce la chiusura improvvisa della connessione con un client
    console.log(`Socket disconnessa per l'utente ${socket.user.userId}`);
    const lobbyId = socket.data.lobbyId;
    if (lobbyId) {
      await handlePlayerExit(lobbyId, socket, io); // chiamo anche qui l'handler per gestire il logout pulito anche nel casp di disconnessione
    }
  });
};

export default registerGameHandlers;
