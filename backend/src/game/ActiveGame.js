import createDeck from "./deck.js";
import app from "../app.js";
import { handleTurnTimeout } from "../services/activeGameService.js";

const TURN_DURATION = 60000; // 1 minuto per turno

class ActiveGame {
  //questa classe gestisce semplicemente tutte le informazioni relative ad una partita in corso, come i turni della partita o il mazzo di carte
  constructor(lobbyId, starterBet, activePlayers, piattoIniziale, idCreatore) {
    // Prendiamo subito l'istanza di Socket.IO per comunicare con i client
    this.io = app.get("io");
    if (!this.io) {
      throw new Error("Socket.IO non è stato inizializzato correttamente!");
    }

    this.lobbyId = lobbyId;
    this.starterBet = starterBet;
    this.activePlayers = activePlayers;
    this.piatto = Number(piattoIniziale) || 0; // soldi totali nel piatto
    this.idCreatore = idCreatore;

    this.deck = createDeck();
    this.currentTurnIndex = 0;
    this.status = "waiting";
    this.rematchPlayer = [];
    this.turnTimer = null;
  }

  // Questo metodo viene chiamato appena comincia una partita, quindi appena si riempie del tutto all'ultimo login
  starterMatch() {
    console.log(
      `[Game ${this.lobbyId}] Partita iniziata, avvio il primo turno.`,
    );
    this.startTurnTimer();
  }

  // Fa partire il timer per il giocatore di turno
  startTurnTimer() {
    this.stopTurnTimer(); // questa funzione viene chiamata ogni volta che arriva una mossa normale dal frontend

    this.turnTimer = setTimeout(() => handleTurnTimeout(this), TURN_DURATION);
  }

  // Ferma il timer (da chiamare quando un giocatore fa una mossa o quando la partita finisce)
  stopTurnTimer() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  drawCard() {
    if (this.deck.length === 0) {
      this.deck = createDeck();
      this.io.to(this.lobbyId).emit("new_mazzo"); // avviso il client che farà mostrare un messaggio
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

    // Una volta trovato il prossimo giocatore, facciamo partire il suo timer
    this.startTurnTimer();
  }

  nextCard() {
    if (this.deck.length === 0) {
      throw new Error("Il mazzo è finito!");
    }
    return this.deck[this.deck.length - 1];
  }
}

export default ActiveGame;
