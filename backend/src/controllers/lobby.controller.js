import Lobby from "../models/lobby.model.js";
import User from "../models/user.model.js";
import { createNewGame, getGame } from "../game/GameStateManager.js";

// in tutte queste chiamate troviamo sempre la stessa logica: estraiamo innanzitutto gli oggetti contenuti nel corpo della richiesta, controllando
// se sono presenti, e in base poi alla funzione li utilizziamo per comunicare con il DB

const createLobby = async (req, res) => {
  try {
    const { lobbyname, numPlayers, starterBet } = req.body;

    if (!lobbyname || !numPlayers || !starterBet) {
      return res.status(400).json({
        message: "All fields are important",
      });
    }

    const existing = await Lobby.findOne({
      lobbyname: lobbyname.trim().toLowerCase(),
    });
    if (existing) {
      return res.status(400).json({
        message: `Already exists a lobby with the name: ${existing.lobbyname}`,
      });
    }

    // grazie al middleware siamo in grado di poter prendere direttamente dalla richiesta l'id del creatore della lobby, per questo viene
    // attaccato a req dopo che è stato svolto il controllo tramite la funzione verifytoken
    const creatorUser = await User.findById(req.user.userId);
    if (!creatorUser) {
      return res.status(500).json({
        message: "Server Error in createLobby",
      });
    }
    // controlliamo se il cretore ha abbastanza credito per creare la lobby con la starter bet indicata
    if (creatorUser.balance <= starterBet) {
      return res.status(400).json({
        message: "You can't create a lobby with that starter bet",
      });
    }

    // la lobby deve contenere minimo due giocatori e massimo 7
    if (numPlayers < 2 || numPlayers > 7) {
      return res.status(400).json({
        message: "The number of players must be between 2 and 7",
      });
    }

    // Scaliamo subito i soldi dal DB per prevenire il glitch del rimborso
    creatorUser.balance -= starterBet;
    await creatorUser.save();
    const activePlayers = [
      {
        id: creatorUser._id.toString(),
        username: creatorUser.username,
        balance: creatorUser.balance,
        status: "waiting",
        currentBet: 0,
      },
    ]; // creo l'array con all'interno le informazioni principali del creatore della lobby

    // creo anche il nuovo oggetto per salvare le informazioni sulla lobby nel DB. l'oggetto segue il modello della lobby definito
    const lobby = new Lobby({
      lobbyname: lobbyname.trim().toLowerCase(),
      numPlayers,
      starterBet,
      activePlayers: [creatorUser._id.toString()],
      owner: req.user.userId,
      status: "waiting",
    });

    const idLobby = lobby._id.toString(); // con mongoose siamo sicuri che l'id del nuovo oggetto venga creato subito, ancor prima di
    // salvarlo sul db.
    // e passo anche le informazioni della nuova partita al mio registro in ram, l'hashmap, che mi permette di accedere più velocemente
    // ad alcune informazioni durante le mosse gi gioco
    createNewGame(
      idLobby,
      starterBet,
      activePlayers,
      starterBet,
      req.user.userId,
    );

    try {
      await lobby.save();
    } catch (saveError) {
      // Se il salvataggio della lobby fallisce, restituiamo i soldi all'utente
      creatorUser.balance += starterBet;
      await creatorUser.save();
      throw saveError;
    }

    console.log("L'utente che ha creto la lobby: ", creatorUser.username);

    res.status(201).json({
      message: "Lobby successfully created",
      lobby: lobby,
    });
  } catch (error) {
    console.log("Error in createLobby");
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const joinLobby = async (req, res) => {
  // nella join non troviamo nessun parametro nel corpo, perchè l'unica cosa che ci serve è l'id della lobby passato come parametro direttamente
  // nell'url che definisce l'end point dela chiamata API, estraibile quindi direttamente tramite req.params, e l'id del giocatore, estraibile
  // invece direttamente dalla req dopo che ha superato il controllo del middleware verifytoken
  try {
    const existingLobby = await Lobby.findById(req.params.id);
    if (!existingLobby) {
      return res.status(404).json({
        message: "Doesn't exist a lobby with that game",
      });
    }
    //controllo se fosse già presente nella lobby
    if (existingLobby.activePlayers.includes(req.user.userId)) {
      return res.status(400).json({
        message: "The user is already in this lobby",
      });
    }
    // controllo che tiene conto del numero di giocatori collegati alla lobby
    if (existingLobby.activePlayers.length >= existingLobby.numPlayers) {
      return res.status(400).json({
        message: "This Lobby is already full",
      });
    }
    // se i controlli sulla lobby vanno a buon fine, controllo adesso se il giocatore è "idoneo" per entrare
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(500).json({
        message: "Server Error in joinLobby",
      });
    }
    // e controllo infatti il suo credito, che deve essere minore della quota di entrata
    if (existingLobby.starterBet > user.balance) {
      return res.status(400).json({
        message: "You can't join this lobby",
      });
    }
    const game = getGame(existingLobby.id);

    if (!game) {
      return res.status(500).json({
        message: "Errore critico: Partita non trovata in memoria.",
      });
    }

    // inserisco il nuovo utente sia sul db che nel game in ram, nella map. Nel DB teniamo solo l'id degli utenti
    existingLobby.activePlayers.push(req.user.userId);

    // Scaliamo subito i soldi dal DB per prevenire il glitch del rimborso
    user.balance -= existingLobby.starterBet;
    await user.save();
    // nel game in ram invece teniamo anche altre informazioni utili poi lato frontend
    game.activePlayers.push({
      id: user._id.toString(),
      username: user.username,
      balance: user.balance,
      status: "waiting",
      currentBet: 0,
    });

    game.piatto += existingLobby.starterBet; // incremento il piatto man mano che gli utenti entrano nella lobby

    console.log(
      `L'utente ${req.user.userId} si è unito alla lobby ${existingLobby.lobbyname}`,
    );

    // prendo il canale io salvato direttamente nella mia app express per comunicare ai giocatori già presenti nella lobby che
    // nuovo giocatore si è unito alla partia
    const io = req.app.get("io");

    io.to(req.params.id).emit("player_joined", {
      message: "La lobby è stata aggiornata, un nuovo giocatore è entrato.",
      nuovoGiocatore: game.activePlayers[game.activePlayers.length - 1],
      giocatoriAlTavolo: game.activePlayers,
    });
    // dopo l'aggiunta del giocatore controllo se la lobby si è riempita, cambiando lo stato in "playing" sia alla lobby che ai giocatori
    if (existingLobby.activePlayers.length == existingLobby.numPlayers) {
      existingLobby.status = "playing";

      game.status = "playing";
      game.activePlayers.forEach((player) => {
        player.status = "playing";
      }); // impostiamo la status di ogni giocatore ad "playing" e chiamiamo la funzione startMatch che farà partire il timer per il turno
      game.starterMatch();
      // e inoltriamo a tutti l'evento "new_game" con i dati relativi alla partita, come il piatto e l'array dei giocatori
      // che mi servirà per gestire il giro dei turni
      io.to(req.params.id).emit("new_game", {
        message: "Lobby al completo. Inizio della partita....",
        nuovaPartita: req.params.id,
        giocatoriAlTavolo: game.activePlayers,
        piatto: game.piatto,
        idCreatore: existingLobby.owner.toString(),
        currentTurn: 0,
      });
    }

    try {
      await existingLobby.save();
    } catch (error) {
      // Se c'è un errore restituiamo i soldi all'utente che ha appena tentato il login
      user.balance += existingLobby.starterBet;
      await user.save();
      existingLobby.activePlayers.pop();
      console.error("Errore nella funzione joinLobby: ", error.message);
    }

    res.status(200).json({
      message: `Sei dentro! Benvenuto nella lobby: ${existingLobby.lobbyname}`,
      existingLobby,
    });
  } catch (error) {
    console.log("Error in joinLobby: ", error.message);
    return res.status(500).json({
      message: "Error Server",
      error: error.message,
    });
  }
};

const getLobbies = async (req, res) => {
  try {
    const { searchStatus, searchStarterBet } = req.body;
    const allLobbies = await Lobby.find();

    if (allLobbies.length === 0) {
      return res.status(404).json({
        message: "No Lobbies available...",
      });
    }

    // Nessun filtro applicato → restituisce solo le lobby libere
    if (searchStatus === "" && searchStarterBet == -1) {
      const allFreeLobbies = allLobbies.filter(
        (lobby) =>
          lobby.activePlayers.length < lobby.numPlayers &&
          lobby.status === "waiting",
      );
      if (allFreeLobbies.length === 0) {
        return res.status(404).json({
          message: "No free lobbies available...",
        });
      }
      return res.status(200).json({
        message: "Here all the accessible lobbies",
        allFreeLobbies,
      });
    }

    // "all" → tutte le lobby nel DB (già attive per definizione)
    if (searchStatus === "all" && searchStarterBet == -1) {
      return res.status(200).json({
        message: "Here all the active lobbies",
        lobbies: allLobbies,
      });
    }

    // "all" + filtro sulla puntata
    if (searchStatus === "all" && searchStarterBet !== -1) {
      const lobbiesByBet = allLobbies.filter(
        (lobby) => lobby.starterBet <= searchStarterBet,
      );
      if (lobbiesByBet.length === 0) {
        return res.status(404).json({
          message: "No lobbies available with the selected starter bet...",
        });
      }
      return res.status(200).json({
        message: "Here all the active lobbies filtered by starter bet",
        lobbies: lobbiesByBet,
      });
    }

    // Filtri combinati: status ("free" | "full") + starterBet opzionale
    const statusFilter = searchStatus === "" ? "free" : searchStatus;
    const starterBetFilter =
      searchStarterBet === -1 ? Infinity : searchStarterBet;

    const filteredLobbies = allLobbies.filter((lobby) => {
      const isBetValid = lobby.starterBet <= starterBetFilter;
      let isStatusValid = true;

      if (statusFilter === "free") {
        isStatusValid =
          lobby.activePlayers.length < lobby.numPlayers &&
          lobby.status === "waiting";
      } else if (statusFilter === "full") {
        isStatusValid =
          lobby.activePlayers.length >= lobby.numPlayers ||
          lobby.status !== "waiting";
      }

      return isBetValid && isStatusValid;
    });

    if (filteredLobbies.length === 0) {
      return res.status(404).json({
        message: "No lobbies available...",
      });
    }

    res.status(200).json({
      message: "Filtered lobbies",
      filteredLobbies,
    });
  } catch (error) {
    console.log("Error in getLobbies");
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// questa non è una chiamata API ma una semplice funzione che viene chiamata quando, tramite le socket, arriva l'evento di chiusura
// della partita
const deleteLobby = async (lobbyId) => {
  try {
    await Lobby.findByIdAndDelete(lobbyId);
    console.log(`Lobby ${lobbyId} eliminata con successo dal DB.`);
  } catch (error) {
    console.error(
      "Errore nella funzione deleteLobby in lobby.controller: ",
      error.message,
    );
  }
};
export { createLobby, joinLobby, getLobbies, deleteLobby };
