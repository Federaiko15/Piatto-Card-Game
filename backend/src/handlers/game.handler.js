import { deleteLobby } from "../controllers/lobby.controller.js";
import { getGame, deleteGame } from "../game/GameStateManager.js";
import User from "../models/user.model.js";

import {
  handlePlayerExit,
  handleGameReset,
  handleGameOver,
} from "../services/gameHandlerService.js";

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

  socket.on("player_draw", async (lobbyId) => {
    try {
      const game = getGame(lobbyId);
      if (!game) return;

      game.stopTurnTimer(); // Fermiamo il timer perchè l'utente ha giocato

      const user = game.activePlayers.find((u) => u.id === socket.user.userId);

      // Controlliamo anche che la mossa sia quella corrente per sicurezza
      if (!user.currentBet || user.currentBet <= 0) {
        return socket.emit("game_error", { message: "Devi prima puntare!" });
      }

      const card = game.drawCard();
      if (!card) {
        return io
          .to(lobbyId)
          .emit("game_error", { message: "Errore nella pescata della carta!" });
      }

      const bet = user.currentBet;

      // LA REGOLA PRINCIPALE DEL GIOCO: 1-5 Perde, 6-10 Vince
      if (card.value <= 5) {
        // PERDE: I soldi vanno nel piatto
        // ora li togliamo per davvero dal suo bilancio ufficiale
        user.balance -= bet;
        game.piatto += bet;
        console.log(
          `❌ ${user.username} perde ${bet} monete. Piatto sale a ${game.piatto}`,
        );
        // aggiungiamo adesso il controllo sul balance dell'utente
        if (user.balance <= 0) {
          // faccio un controllo anche sul < per sicurezza, anche se un utente non può fare una bet con
          // più soldi rispetto al proprio balance
          user.balance = 0; // e proprio per non correre rischi con numeri negativi setto il balance a 0
          user.status = "eliminato";

          user.dbSynced = true; // marchiamo il nostro utente come "già salvato", nel senso che già lo avremo sincronizzato con il db
          await User.findByIdAndUpdate(user.id, { $set: { balance: 0 } });

          io.to(lobbyId).emit("message_resolved", {
            userId: null,
            message: `${user.username} ha finito i soldi e resterà fuori dal tavolo ad osservare!`,
          });
        }
        // controllo per vedere se è rimasto solo un giocatore ancora non eliminato
        const activeCount = game.activePlayers.filter(
          (p) => p.status === "playing",
        ).length;

        user.currentBet = 0;
        const isGameFinished = activeCount <= 1;

        if (!isGameFinished) {
          game.nextTurn();
        }

        io.to(lobbyId).emit("turn_resolved", {
          message: `${user.username} ha pescato ${card.value} di ${card.seed} e ha perso!`,
          card,
          winnerId: user.id,
          newBalance: user.balance,
          newPiatto: game.piatto,
          nextTurn: isGameFinished ? null : game.currentTurnIndex,
          isGameFinished: isGameFinished,
        });

        if (isGameFinished) {
          setTimeout(async () => {
            await handleGameOver(
              lobbyId,
              io,
              "Partita finita: è rimasto solo un giocatore attivo!",
            );
          }, 3000); // Ritardo di 3 secondi per lasciare tempo alla UI di animare la carta!
          return;
        }
      } else {
        user.balance += bet;
        game.piatto -= bet;

        user.currentBet = 0;

        const isGameFinished = game.piatto === 0;

        if (!isGameFinished) {
          game.nextTurn();
        } else {
          game.status = "waiting_rematch";
        }

        io.to(lobbyId).emit("turn_resolved", {
          message: `${user.username} ha pescato ${card.value} di ${card.seed} e ha vinto!`,
          card,
          winnerId: user.id,
          newBalance: user.balance,
          newPiatto: game.piatto,
          nextTurn: isGameFinished ? null : game.currentTurnIndex,
          isGameFinished,
        });

        if (isGameFinished) {
          setTimeout(() => {
            io.to(lobbyId).emit("ask_rematch", {
              message: "Volete rigiocare la partita nella stessa lobby?",
            });

            setTimeout(() => {
              handleGameReset(lobbyId, io);
            }, 15000);
          }, 1800);

          return;
        }
      }
    } catch (error) {
      console.log("Errore in player_draw:", error.message);
    }
  });

  socket.on("rematch_request", (personalId, lobbyId) => {
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
      game.stopTurnTimer(); // FERMIAMO IL TIMER PERCHÉ L'UTENTE HA PIAZZATO LA PUNTATA

      const user = game.activePlayers.find((u) => u.id === socket.user.userId);

      // CONTROLLO 0: Validazione dell'input
      if (typeof bet !== "number" || isNaN(bet) || bet <= 0) {
        return socket.emit("game_error", { message: "Puntata non valida!" });
      }

      // CONTROLLO 1: È il tuo turno?
      if (game.activePlayers[game.currentTurnIndex].id !== socket.user.userId) {
        return socket.emit("game_error", { message: "Non è il tuo turno!" });
      }

      if (game.deck.length === 0) {
        io.to(lobbyId).emit("message_resolved", {
          userId: null,
          message: "Il mazziere ha rimescolato le carte",
        });
      }
      // CONTROLLO 2: Hai abbastanza soldi?
      if (bet > user.balance) {
        return socket.emit("game_error", {
          message: "Non hai abbastanza monete!",
        });
      }

      // CONTROLLO 3 La bet non supera il piatto?
      if (bet > game.piatto) {
        return socket.emit("game_error", {
          message: `Non puoi puntare ${bet}, nel piatto ci sono solo ${game.piatto} monete!`,
        });
      }

      // Se passa tutti i controlli:
      user.currentBet = bet;
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
      if (!message) {
        return socket.emit("game_error", {
          message: "Errore nel messagio mandato",
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
