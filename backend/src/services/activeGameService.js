import User from "../models/user.model.js";
import { handleGameOver, handleGameReset } from "./gameHandlerService.js";

// Traduce gli eventi restituiti da game-core nei messaggi socket che il frontend conosce già,
// sia per le mosse dei giocatori sia per quelle automatiche del timer
export async function broadcastTurnResult(game, events) {
  const io = game.io;
  const lobbyId = game.lobbyId;

  const drawn = events.find((e) => e.type === "card_drawn");
  const skipped = events.find((e) => e.type === "turn_skipped");
  const gameOver = events.find((e) => e.type === "game_over");
  const isGameFinished = Boolean(gameOver);

  // a partita finita il timer si ferma, altrimenti riparte per il prossimo giocatore
  if (isGameFinished) {
    game.stopTurnTimer();
    if (gameOver.reason === "pot_emptied") game.status = "waiting_rematch";
  } else {
    game.startTurnTimer();
  }

  if (skipped) {
    const user = game.activePlayers.find((p) => p.id === skipped.playerId);
    const reason =
      skipped.reason === "not_playing"
        ? `${user.username} non è attivo e passa il turno.`
        : `${user.username} non ha abbastanza soldi per la puntata minima e passa il turno.`;
    io.to(lobbyId).emit("message_resolved", {
      userId: null,
      message: reason,
    });
    io.to(lobbyId).emit("turn_resolved", {
      message: reason,
      card: { seed: "", value: 0 },
      winnerId: user.id,
      newBalance: user.balance,
      newPiatto: game.piatto,
      nextTurn: game.currentTurnIndex,
      isGameFinished: false,
    });
    return;
  }

  if (!drawn) return;
  const user = game.activePlayers.find((p) => p.id === drawn.playerId);

  if (events.some((e) => e.type === "deck_reshuffled")) {
    io.to(lobbyId).emit("new_mazzo"); // avviso il client che farà mostrare un messaggio
  }

  if (events.some((e) => e.type === "player_eliminated")) {
    user.dbSynced = true; // marchiamo il nostro utente come "già salvato", nel senso che già lo avremo sincronizzato con il db
    await User.findByIdAndUpdate(user.id, { $set: { balance: 0 } });

    io.to(lobbyId).emit("message_resolved", {
      userId: null,
      message: `${user.username} ha finito i soldi e resterà fuori dal tavolo ad osservare!`,
    });
  }

  const { card } = drawn;
  const azione = drawn.automatic
    ? `${user.username} non ha giocato, ha pescato`
    : `${user.username} ha pescato`;
  const esito = drawn.outcome === "win" ? "vinto" : "perso";
  console.log(
    `${drawn.outcome === "win" ? "✅" : "❌"} ${user.username} ha ${esito} ${drawn.bet} monete. Piatto a ${game.piatto}`,
  );

  io.to(lobbyId).emit("turn_resolved", {
    message: `${azione} ${card.value} di ${card.seed} e ha ${esito}!`,
    card,
    winnerId: user.id,
    newBalance: user.balance,
    newPiatto: game.piatto,
    nextTurn: isGameFinished ? null : game.currentTurnIndex,
    isGameFinished,
  });

  if (!gameOver) return;

  if (gameOver.reason === "last_player_standing") {
    setTimeout(async () => {
      await handleGameOver(
        lobbyId,
        io,
        "Partita finita: è rimasto solo un giocatore attivo!",
      );
    }, 3000); // Ritardo di 3 secondi per lasciare tempo alla UI di animare la carta!
    return;
  }

  setTimeout(() => {
    io.to(lobbyId).emit("ask_rematch", {
      message: "Volete rigiocare la partita nella stessa lobby?",
    });

    setTimeout(async () => {
      await handleGameReset(lobbyId, io);
    }, 15000);
  }, 1800);
}

export async function handleTurnTimeout(game) {
  const user = game.activePlayers[game.currentTurnIndex];
  if (!user) return;

  game.io.to(game.lobbyId).emit("skip_turn", {
    message: "Turno saltato per inattività.",
    userId: user.id,
    username: user.username,
  });
  console.log(
    `[Timer] Il giocatore ${user.username} non ha risposto in tempo.`,
  );

  // La puntata forzata per inattività (1 moneta) e il salto di chi non è attivo sono regole di game-core
  const result = game.apply({ type: "timeout" });
  if (!result.ok) {
    console.log(`[Timer] Mossa automatica rifiutata: ${result.error}`);
    return;
  }

  await broadcastTurnResult(game, result.events);
}
