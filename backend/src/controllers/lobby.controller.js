import Lobby from "../models/lobby.model.js";
import User from "../models/user.model.js";
import { createNewGame, getGame } from "../game/GameStateManager.js";

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

    const creatorUser = await User.findById(req.user.userId);
    if (!creatorUser) {
      return res.status(500).json({
        message: "Server Error in createLobby",
      });
    }

    if (creatorUser.balance <= starterBet) {
      return res.status(400).json({
        message: "You can't create a lobby with that starter bet",
      });
    }

    if (numPlayers < 2 || numPlayers > 7) {
      return res.status(400).json({
        message: "The number of players must be between 2 and 7",
      });
    }

    // Scaliamo subito i soldi dal DB per prevenire il glitch del rimborso!
    creatorUser.balance -= starterBet;
    await creatorUser.save();

    const activePlayers = [
      {
        id: creatorUser._id.toString(),
        username: creatorUser.username,
        balance: creatorUser.balance - starterBet,
        status: "waiting",
        currentBet: 0,
      },
    ]; // ho aggiunto l'array con all'interno le informazioni principali del creatore della lobby

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
      // ROLLBACK: Se il salvataggio della lobby fallisce, restituiamo i soldi!
      creatorUser.balance += starterBet;
      await creatorUser.save();
      throw saveError;
    }

    console.log("Id dell'utente che ha creato la lobby", req.user.userId);

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
  try {
    const existingLobby = await Lobby.findById(req.params.id);
    if (!existingLobby) {
      return res.status(404).json({
        message: "Doesn't exist a lobby with that game",
      });
    }

    if (existingLobby.activePlayers.includes(req.user.userId)) {
      return res.status(400).json({
        message: "The user is already in this lobby",
      });
    }

    if (existingLobby.activePlayers.length >= existingLobby.numPlayers) {
      return res.status(400).json({
        message: "This Lobby is already full",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(500).json({
        message: "Server Error in joinLobby",
      });
    }
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

    // inserisco il nuovo utente sia sul db che nel game in ram, nella map
    existingLobby.activePlayers.push(req.user.userId);

    // FIX: Scaliamo subito i soldi dal DB per prevenire il glitch del rimborso!
    user.balance -= existingLobby.starterBet;
    await user.save();

    game.activePlayers.push({
      id: user._id.toString(),
      username: user.username,
      balance: user.balance - existingLobby.starterBet,
      status: "waiting",
      currentBet: 0,
    });

    game.piatto += existingLobby.starterBet; // incremento il piatto man mano che gli utenti entrano nella lobby

    console.log(
      `L'utente ${req.user.userId} si è unito alla lobby ${existingLobby.lobbyname}`,
    );

    const io = req.app.get("io");

    io.to(req.params.id).emit("player_joined", {
      message: "La lobby è stata aggiornata, un nuovo giocatore è entrato.",
      nuovoGiocatore: game.activePlayers[game.activePlayers.length - 1],
      giocatoriAlTavolo: game.activePlayers,
    });

    if (existingLobby.activePlayers.length == existingLobby.numPlayers) {
      existingLobby.status = "playing";

      game.status = "playing";
      game.activePlayers.forEach((player) => {
        player.status = "playing";
      }); // impostiamo la status di ogni giocatore ad "playing"

      io.to(req.params.id).emit("new_game", {
        message: "Lobby al completo. Inizio della partita....",
        nuovaPartita: req.params.id,
        giocatoriAlTavolo: game.activePlayers,
        piatto: game.piatto,
        idCreatore: existingLobby.owner.toString(),
      });
    }

    try {
      await existingLobby.save();
    } catch (saveError) {
      // ROLLBACK: Se c'è un errore restituiamo i soldi all'utente
      user.balance += existingLobby.starterBet;
      await user.save();
      existingLobby.activePlayers.pop();
      throw saveError;
    }

    res.status(200).json({
      message: `You are in, welcome to the ${existingLobby.lobbyname} lobby!!`,
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
    const allLobbies = await Lobby.find(); //from the DB i take all the lobbies
    if (allLobbies.length === 0) {
      // check if the array with the jsons elements is empty
      return res.status(404).json({
        message: "No Lobbies available...",
      });
    }
    const allFreeLobbies = allLobbies.filter(
      // then i filter all the lobbies that have lesser players then their capacieties
      (lobby) =>
        lobby.activePlayers.length < lobby.numPlayers &&
        lobby.status === "waiting",
    );

    if (allFreeLobbies.length === 0) {
      // check if the free lobbies exists
      return res.status(404).json({
        message: "No free lobbies available...",
      });
    }

    res.status(200).json({
      message: "Here all the accessible lobbies",
      allFreeLobbies,
    });
  } catch (error) {
    console.log("Error in getLobbies");
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
// questa non è una chiamata API, ma la inserisco in questo file perchè è una funzione che lavora comunuqe direttamente con il DB
// non è una chiamata API perchè viene gestita tramite eventi socket.
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
