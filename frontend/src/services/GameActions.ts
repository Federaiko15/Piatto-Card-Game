import { Socket } from "socket.io-client";
import showSwal from "./CustomAlert";

export const GameActions = {
  placeBet: (socket: Socket | null, lobbyId: string, amount: number) => {
    if (!socket || !lobbyId) {
      console.error("Error: Missed socket or lobbyId");
      return;
    }

    if (amount <= 0) {
      showSwal({
        type: "game_alert",
        title: "Devi puntare almeno 1 moneta!",
        alert: false,
      });
      return;
    }

    console.log(
      `Sent from the lobby ${lobbyId} the amount ${amount} of the bet`,
    );
    socket.emit("player_bet", amount, lobbyId);
  },

  placePiatto: async (
    socket: Socket | null,
    lobbyId: string,
    amount: number,
  ): Promise<boolean> => {
    if (!socket || !lobbyId) {
      console.error("Error: Missed socket or lobbyId");
      return false;
    }

    // Chiediamo conferma all'utente prima di fare l'All-In
    const confirmed = await showSwal({
      type: "piatto",
      title: `Sei sicuro di voler chiamare PIATTO puntando ${amount} monete?`,
      alert: true,
    });

    if (confirmed) {
      console.log(
        `L'utente chiama PIATTO nella lobby ${lobbyId} per un totale di ${amount}`,
      );
      socket.emit("player_bet", amount, lobbyId);
      return true;
    }

    return false;
  },

  drawCard: (socket: Socket | null, lobbyId: string) => {
    if (!socket || !lobbyId) {
      console.error("Error: Missed socket or lobbyId");
      return;
    }

    console.log("Draw card request from lobby: ", lobbyId);
    socket.emit("player_draw", lobbyId);
  },

  sendMessage: (socket: Socket | null, lobbyId: string, message: string) => {
    if (!socket || !lobbyId) {
      console.error("Error: Missed socket or lobbyId");
      return;
    }
    console.log("Send message request from lobby: ", lobbyId);
    socket.emit("send_message", lobbyId, message);
  },

  logout: (socket: Socket | null, lobbyId: string) => {
    if (!socket || !lobbyId) {
      console.error("Error: Missed socket or lobbyId");
      return;
    }

    console.log("Send logout request from lobby: ", lobbyId);
    socket.emit("logout_request", lobbyId);
  },

  deleteRoom: (socket: Socket | null, lobbyId: string) => {
    if (!socket || !lobbyId) {
      console.error("Error: Missed socket or lobbyId");
      return;
    }

    console.log(
      "Send delete room request from the creator of the lobby: ",
      lobbyId,
    );
    socket.emit("close_room", lobbyId);
  },
};
