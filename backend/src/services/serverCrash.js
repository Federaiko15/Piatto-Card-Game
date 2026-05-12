import User from "../models/user.model";
import Lobby from "../models/lobby.model";

const handleServerCrash = async () => {
  const date_now = new Date();
  const lobby_not_deleted = await Lobby.find();
  if (lobby_not_deleted.length === 0) {
    return;
  }
  for (let i = 0; i < lobby_not_deleted.length; i++) {
    const lobby = lobby_not_deleted[i];
    if (lobby.status === "finished") {
      await Lobby.findByIdAndDelete(lobby._id);
    } else if (
      lobby.refundStatus === "none" ||
      lobby.refundStatus === "pending"
    ) {
      lobby.refundStatus = "pending";
      if (lobby.serverCrashDate === null) {
        lobby.serverCrashDate = date_now;
        await lobby.save();

        const updatePromises = lobby.activePlayers.map(async (player) => {
          const user = await User.findById(player);
          if (
            user &&
            (user.refundServerCrashDate === null ||
              user.refundServerCrashDate < date_now)
          ) {
            user.balance += lobby.starterBet;
            user.refundServerCrashDate = date_now;
            await user.save();
          }
        });
        await Promise.all(updatePromises);

        lobby.refundStatus = "refunded";
        await lobby.save();
      } else {
        const updatePromises = lobby.activePlayers.map(async (player) => {
          const user = await User.findById(player);
          if (
            user &&
            (user.refundServerCrashDate === null ||
              user.refundServerCrashDate < lobby.serverCrashDate)
          ) {
            user.balance += lobby.starterBet;
            user.refundServerCrashDate = date_now;
            await user.save();
          }
        });
        await Promise.all(updatePromises);

        lobby.serverCrashDate = date_now;
        lobby.refundStatus = "refunded";
        await lobby.save();
      }
    } else if (lobby.refundStatus === "refunded") {
      await Lobby.findByIdAndDelete(lobby._id);
    }
  }
};

export default handleServerCrash;

// questa funzione parte appena avvio il server: se ho trovato lobby nel DB vuol dire che c'è stato un creash, perchè queste vengono
// eliminate immediatamente dopo che una partita finisce. Grazie agli stati delle lobby e a quelli degli utenti controllo:
// se la lobby si trova in stato di non refund o in stato di pending se già aveva una data salvata o no, perchè se non aveva una data salvata
// vuol dire che è stato il primo crash e controllo quindi se gli altri utenti hanno una data
// (ma in questo caso anche per loro non dovrebbe esserci), invece se già aveva una data, controllo se gli utenti hanno la stessa, perchè
// vorrebbe dire che sono stati già rimborsati, o minore e in questo caso rimborsarli. Infine salvo la nuova data
