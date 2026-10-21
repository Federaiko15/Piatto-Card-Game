import {
  applyClassicAction,
  createClassicTable,
  createRng,
  nextTurnIndex,
  randomSeed,
} from "@piatto/game-core";
import app from "../app.js";
import { handleTurnTimeout } from "../services/activeGameService.js";

const TURN_DURATION = 60000; // 1 minuto per turno

class ActiveGame {
  // questa classe tiene le informazioni "da server" di una partita in corso (stanza, timer, rivincita),
  // mentre lo stato del tavolo (giocatori, piatto, mazzo, turno) e le regole stanno in game-core
  constructor(lobbyId, starterBet, activePlayers, piattoIniziale, idCreatore) {
    // Prendiamo subito l'istanza di Socket.IO per comunicare con i client
    this.io = app.get("io");
    if (!this.io) {
      throw new Error("Socket.IO non è stato inizializzato correttamente!");
    }

    this.lobbyId = lobbyId;
    this.starterBet = starterBet;
    this.idCreatore = idCreatore;

    // il seed ci permette di riprodurre una partita identica se dovessimo indagare un bug
    this.seed = randomSeed();
    this.rng = createRng(this.seed);
    this.table = createClassicTable(
      activePlayers,
      Number(piattoIniziale) || 0, // soldi totali nel piatto
      this.rng,
    );

    this.status = "waiting";
    this.rematchPlayer = [];
    this.turnTimer = null;
  }

  // Questi getter/setter permettono al resto del server di continuare a usare game.activePlayers, game.piatto, ecc.
  get activePlayers() {
    return this.table.players;
  }
  set activePlayers(players) {
    this.table = { ...this.table, players };
  }

  get piatto() {
    return this.table.piatto;
  }
  set piatto(value) {
    this.table = { ...this.table, piatto: value };
  }

  get currentTurnIndex() {
    return this.table.currentTurn;
  }

  get deck() {
    return this.table.deck;
  }

  // Applica una mossa con le regole di game-core: se è valida aggiorna il tavolo e restituisce gli eventi
  apply(action) {
    const result = applyClassicAction(this.table, action, this.rng);
    if (result.ok) {
      this.table = result.table;
    }
    return result;
  }

  // Nuova partita nella stessa lobby (rivincita): nuovo mazzo, piatto e turno ripartono da zero
  resetTable(players, piatto) {
    this.table = createClassicTable(players, piatto, this.rng);
  }

  // Questo metodo viene chiamato appena comincia una partita, quindi appena si riempie del tutto all'ultimo login
  starterMatch() {
    console.log(
      `[Game ${this.lobbyId}] Partita iniziata (seed ${this.seed}), avvio il primo turno.`,
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

  // Passa il turno senza una mossa (es. il giocatore di turno si è disconnesso) e fa ripartire il timer
  nextTurn() {
    this.table = {
      ...this.table,
      currentTurn: nextTurnIndex(this.table.players, this.table.currentTurn),
    };
    this.startTurnTimer();
  }
}

export default ActiveGame;
