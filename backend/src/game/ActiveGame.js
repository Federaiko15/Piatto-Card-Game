import createDeck from "./deck.js";
import app from "../app.js";

class ActiveGame {
  //questa classe gestisce semplicemente tutte le informazioni relative ad una partita in corso, come i turni della partita o il mazzo di carte
  constructor(lobbyId, starterBet, activePlayers, piattoIniziale, idCreatore) {
    this.lobbyId = lobbyId;
    this.starterBet = starterBet;
    this.activePlayers = activePlayers;
    this.piatto = Number(piattoIniziale) || 0; // soldi totali nel piatto
    this.idCreatore = idCreatore;

    this.deck = createDeck();
    this.currentTurnIndex = 0;
    this.status = "waiting";
    this.rematchPlayer = [];
  }

  drawCard() {
    if (this.deck.length === 0) {
      this.deck = createDeck();
      const io = app.get("io");
      io.to(this.lobbyId).emit("new_mazzo"); // avviso il client che farà mostrare un messaggio
    }
    return this.deck.pop();
  }

  nextTurn() {
    // Passa al prossimo, se arriva alla fine dell'array ricomincia da 0
    let attempts = 0;
    do {
      this.currentTurnIndex =
        (this.currentTurnIndex + 1) % this.activePlayers.length;
      attempts++;
      // Se abbiamo fatto un giro completo e sono tutti eliminati (improbabile), usciamo
    } while (
      this.activePlayers[this.currentTurnIndex].status !== "playing" &&
      attempts < this.activePlayers.length
    );
  }

  nextCard() {
    if (this.deck.length === 0) {
      throw new Error("Il mazzo è finito!");
    }
    return this.deck[length - 1];
  }
}

export default ActiveGame;
