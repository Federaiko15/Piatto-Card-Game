import User from "../models/user.model.js";
import Lobby from "../models/lobby.model.js";

const handleServerCrash = async () => {
  try {
    // 1. Trova tutte le lobby che non sono state concluse correttamente.
    //    Escludiamo quelle già rimborsate o quelle che sono finite regolarmente.
    const lobbiesToRefund = await Lobby.find({
      status: { $in: ["waiting", "playing"] },
    });

    if (lobbiesToRefund.length === 0) {
      console.log("Nessuna lobby da rimborsare trovata dopo il riavvio.");
      return;
    }

    console.log(
      `Trovate ${lobbiesToRefund.length} lobby da processare per il rimborso.`,
    );

    // 2. Processa ogni lobby.
    for (const lobby of lobbiesToRefund) {
      const playerIds = lobby.activePlayers;
      const starterBet = lobby.starterBet;

      if (!playerIds || playerIds.length === 0 || !starterBet) {
        console.log(
          `Lobby ${lobby._id} saltata: nessun giocatore o puntata iniziale definita.`,
        );
        // Marco la lobby come problematica e la elimino per non bloccare i riavvii futuri
        await Lobby.findByIdAndDelete(lobby._id);
        continue;
      }

      // 3. Rimborso atomico per tutti i giocatori nella lobby.
      const updateResult = await User.updateMany(
        { _id: { $in: playerIds } },
        { $inc: { balance: starterBet } },
      );

      console.log(
        `Rimborso per lobby ${lobby._id}: ${updateResult.modifiedCount} utenti aggiornati.`,
      );

      // 4. Una volta rimborsati i giocatori, eliminiamo la lobby dal DB
      await Lobby.findByIdAndDelete(lobby._id);
      console.log(`Lobby ${lobby._id} rimborsata e eliminata con successo.`);
    }
  } catch (error) {
    console.error(
      "Errore critico durante la gestione del crash del server:",
      error,
    );
  }
};

export default handleServerCrash;
