import User from "../models/user.model.js";
import { handleGameOver, handleGameReset } from "./gameHandlerService.js";

export async function handleTurnTimeout(game) {
  const bet = 1; // La puntata forzata per inattività è sempre 1
  const user = game.activePlayers[game.currentTurnIndex];

  game.io.to(game.lobbyId).emit("skip_turn", {
    message: "Turno salvato per inattività.",
    userId: user.id,
    username: user.username,
  });
  console.log(
    `[Timer] Il giocatore ${user.username} non ha risposto in tempo.`,
  );

  if (user.status !== "playing" || user.balance < bet) {
    game.io.to(game.lobbyId).emit("message_resolved", {
      userId: null,
      message: `${user.username} non ha abbastanza soldi per la puntata minima e passa il turno.`,
    });
    game.nextTurn();
    return;
  }

  const card = game.drawCard();

  if (card.value <= 5) {
    user.balance -= bet;
    game.piatto += bet;

    if (user.balance <= 0) {
      user.balance = 0;
      user.status = "eliminato";
      user.dbSynced = true;
      await User.findByIdAndUpdate(user.id, { $set: { balance: 0 } });
      game.io.to(game.lobbyId).emit("message_resolved", {
        userId: null,
        message: `${user.username} ha finito i soldi ed è stato eliminato!`,
      });
    }

    const activeCount = game.activePlayers.filter(
      (p) => p.status === "playing",
    ).length;
    const isGameFinished = activeCount <= 1;

    // Passiamo al prossimo turno PRIMA di inviare il messaggio al client,
    // così l'indice sarà calcolato e aggiornato correttamente (evitando l'out of bounds)
    if (!isGameFinished) {
      game.nextTurn();
    }

    game.io.to(game.lobbyId).emit("turn_resolved", {
      message: `${user.username} non ha giocato, ha pescato ${card.value} di ${card.seed} e ha perso!`,
      card,
      winnerId: user.id,
      newBalance: user.balance,
      newPiatto: game.piatto,
      nextTurn: isGameFinished ? null : game.currentTurnIndex, // Usiamo l'indice reale, non +1
      isGameFinished,
    });

    if (isGameFinished) {
      setTimeout(async () => {
        await handleGameOver(
          game.lobbyId,
          game.io,
          "Partita finita: è rimasto solo un giocatore!",
        );
      }, 3000);
    }
  } else {
    user.balance += bet;
    game.piatto -= bet;
    const isGameFinished = game.piatto <= 0;

    // Come sopra, calcoliamo il prossimo turno prima dell'emit
    if (!isGameFinished) {
      game.nextTurn();
    } else {
      game.status = "waiting_rematch";
    }

    game.io.to(game.lobbyId).emit("turn_resolved", {
      message: `${user.username} non ha giocato, ha pescato ${card.value} di ${card.seed} e ha vinto!`,
      card,
      winnerId: user.id,
      newBalance: user.balance,
      newPiatto: game.piatto,
      nextTurn: isGameFinished ? null : game.currentTurnIndex, // Usiamo l'indice reale
      isGameFinished,
    });

    if (isGameFinished) {
      setTimeout(() => {
        game.io.to(game.lobbyId).emit("ask_rematch", {
          message: "Volete rigiocare la partita nella stessa lobby?",
        });
        setTimeout(async () => {
          await handleGameReset(game.lobbyId, game.io);
        }, 15000);
      }, 1800);
    }
  }
}
