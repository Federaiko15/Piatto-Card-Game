import User from "../models/user.model.js";
import Lobby from "../models/lobby.model.js";

const handleServerCrash = async () => {
  try {
    //  Trovo tutte le lobby che non sono state concluse correttamente.
    //  controllo ogni tipo di lobby presente, per gestire la chiusura di ogni caso in maniera corretta
    const lobbiesToRefund = await Lobby.find({
      status: { $in: ["waiting", "playing"] },
    });

    if (lobbiesToRefund.length === 0) {
      console.log("Nessuna lobby da rimborsare trovata dopo il riavvio.");
    } else {
      console.log(
        `Trovate ${lobbiesToRefund.length} lobby da processare per il rimborso.`,
      );

      for (const lobby of lobbiesToRefund) {
        const playerIds = lobby.activePlayers;
        const starterBet = lobby.starterBet;

        if (!playerIds || playerIds.length === 0 || !starterBet) {
          console.log(
            `Lobby ${lobby._id} saltata: nessun giocatore o puntata iniziale definita.`,
          );
          await Lobby.findByIdAndDelete(lobby._id);
          continue;
        }

        // Rimborso atomico per tutti i giocatori nella lobby.
        const updateResult = await User.updateMany(
          { _id: { $in: playerIds } },
          { $inc: { balance: starterBet } },
        );

        console.log(
          `Rimborso per lobby ${lobby._id}: ${updateResult.modifiedCount} utenti aggiornati.`,
        );

        // Una volta rimborsati i giocatori, eliminiamo la lobby dal DB
        await Lobby.findByIdAndDelete(lobby._id);
        console.log(`Lobby ${lobby._id} rimborsata e eliminata con successo.`);
      }
    }

    // adesso invece controllo tutti gli utenti salvati nel DB per capire se se al momento del crash fossero presenti utenti online,
    // che quindi rimarebbero in questo stato senza più poter entrare nel gioco
    await User.updateMany(
      { online: true },
      { $set: { online: false, refundServerCrashDate: new Date() } },
    );
    console.log("Utenti controllati");
  } catch (error) {
    console.error(
      "Errore critico durante la gestione del crash del server:",
      error,
    );
  }
};

export default handleServerCrash;
