import { useState, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { GameActions } from "../services/GameActions";

import type {
  Player,
  JwtPayload,
  JoinLobbyResponse,
  SocketJoinResponse,
  SocketDrawResponse,
  SingleCard,
  SocketResolvedTurnResponse,
  SocketMessageChatResponse,
  SocketLogOutResponse,
  SocketErrorResponse,
} from "../types";
import showSwal from "../services/CustomAlert";

export function useGameEngine(lobbyId: string | undefined) {
  const navigate = useNavigate();

  // 1. TUTTI GLI STATI "CORE"
  const [players, setPlayers] = useState<Player[]>([]);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const [card, setCard] = useState<SingleCard>({ seed: "", value: 0 });
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [pot, setPot] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<SocketMessageChatResponse[]>(
    [],
  );
  const [idCreator, setIdCreator] = useState<string>("");
  const [isGameFinished, setIsGameFinished] = useState<boolean>(false);
  const [isWaitingRematch, setIsWaitingRematch] = useState<boolean>(false);

  // 2. FUNZIONI UTILITY
  const getIdFromToken = (): string | null => {
    const token = localStorage.getItem("tokenPiatto");
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const decodeJson = atob(payload); // decodifico in Base64 la parte del payload
      const finalPayload = JSON.parse(decodeJson) as JwtPayload;
      return finalPayload.userId;
    } catch (error) {
      console.error("Errore token", error);
      return null;
    }
  };

  const personalId = getIdFromToken();

  // useMemo è un hook fondamentale che mi permette di salvare in cache il calcolo appena fatto a meno di cambiamenti
  // dei valori all'interno dell'arrya di dipendenze
  const rotatedPlayers = useMemo(() => {
    if (!personalId || players.length === 0) return players;
    const indexUser = players.findIndex((user) => user.id === personalId);
    if (indexUser === -1) return players;

    return [...players.slice(indexUser), ...players.slice(0, indexUser)];
  }, [players, personalId]);

  // 3. LA CONNESSIONE SOCKET
  useEffect(() => {
    const token = localStorage.getItem("tokenPiatto");
    if (!token) {
      showSwal({
        type: "game_alert",
        title: "Devi effettuare il login!",
        alert: false,
      });
      navigate("/");
      return;
    }

    const socket: Socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    });
    setGameSocket(socket);

    socket.on("connect", () => {
      socket.emit("join_lobby_rooms", lobbyId);
    });

    socket.on("new_game", (data: SocketJoinResponse) => {
      const activePlayers = data.giocatoriAlTavolo!;
      if (activePlayers) {
        setPlayers(activePlayers);
        setIsGameStarted(true);
        setPot(data.piatto || 0);
        setIdCreator(data.idCreatore!);

        setIsGameFinished(false);
        setIsWaitingRematch(false);
        setCard({ seed: "", value: 0 });
        setCurrentTurn(0);
      }
    });

    socket.on("join_info", (data: JoinLobbyResponse) => {
      setIdCreator(data.idCreatore);
      if (data.giocatoriAlTavolo) {
        setPlayers(data.giocatoriAlTavolo);
      }

      console.log("Sei entrato in lobby. Creatore:", data.idCreatore);
    });

    socket.on("player_joined", (data: SocketJoinResponse) => {
      console.log("Un nuovo giocatore è entrato in sala d'attesa!");

      // Aggiorniamo lo stato dei giocatori con la lista aggiornata dal server
      if (data.giocatoriAlTavolo) {
        setPlayers(data.giocatoriAlTavolo);
      }
    });

    socket.on("new_card", (data: SocketDrawResponse) => {
      setCard(data.card);
      setCurrentTurn(data.nextTurn);
    });

    // Intercetto l'evento bet_placed e mostro il messaggio in chat
    socket.on(
      "bet_placed",
      (data: { userId: string; amount: number; message: string }) => {
        setChatMessages((prev) => [
          ...prev,
          {
            userId: null, // Rendendolo un messaggio di sistema
            message: data.message,
          },
        ]);

        // Aggiorniamo la puntata corrente (currentBet) del giocatore per aggiornare subito la UI
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === data.userId ? { ...p, currentBet: data.amount } : p,
          ),
        );
      },
    );

    socket.on("turn_resolved", (data: SocketResolvedTurnResponse) => {
      setCard(data.card);
      setPot(data.newPiatto);
      if (data.nextTurn !== null) {
        setCurrentTurn(data.nextTurn);
      }

      // Aggiornamento dei giocatori per il frontend
      setPlayers((prev) => {
        const updated = prev.map((p) =>
          p.id === data.winnerId
            ? { ...p, balance: data.newBalance, currentBet: 0 }
            : p,
        );
        return updated;
      });

      if (data.isGameFinished) {
        setIsGameFinished(true);
      } else {
        setIsGameFinished(false);
      }
    });

    socket.on("message_resolved", (data: SocketMessageChatResponse) => {
      setChatMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("player_logout", (data: SocketLogOutResponse) => {
      const updatedPlayers = data.activePlayers!;
      setPlayers(updatedPlayers);
    });

    socket.on("end_game", (data: SocketLogOutResponse) => {
      showSwal({
        type: "game_alert",
        title: data.message,
        alert: false,
      });

      if (socket) {
        socket.disconnect(); // Chiude il canale di comunicazione
      } // e faccio cambiare pagina all'utente
      navigate("/lobbies");
    });

    socket.on("game_error", (data: SocketErrorResponse) => {
      showSwal({
        type: "game_alert",
        title: data.message,
        alert: false,
      });
    });

    socket.on("room_closed_by_creator", (data: SocketLogOutResponse) => {
      showSwal({
        type: "game_alert",
        title: data.message,
        alert: false,
      });
      navigate("/lobbies");
      // avvisiamo l'utente della chiusura del server e lo riportiamo alla schermata dove sono presenti le lobby
    });

    socket.on("ask_rematch", async (data: { message: string }) => {
      const confirm = await showSwal({
        type: "rematch",
        title: data.message,
        alert: true,
      });

      console.log("[CLIENT] rematch confirm:", confirm);

      if (confirm) {
        setIsWaitingRematch(true);
        socket.emit("rematch_request", personalId, lobbyId);
      } else {
        GameActions.logout(socket, lobbyId!);
        navigate("/lobbies");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [lobbyId, navigate]);

  // 4. CALCOLIAMO SE È IL TUO TURNO
  const isMyTurn =
    players?.length > 0 && players[currentTurn]?.id === personalId;
  // TROVIAMO L'ID ESATTO DI CHI DEVE GIOCARE ADESSO
  const activePlayerId = players?.length > 0 ? players[currentTurn]?.id : null;
  // 5. RESTITUIAMO AL FRONTEND SOLO QUELLO CHE SERVE PER DISEGNARE
  return {
    rotatedPlayers,
    isGameStarted,
    gameSocket,
    card,
    pot,
    isMyTurn,
    personalId,
    activePlayerId,
    chatMessages,
    idCreator,
    isGameFinished,
    isWaitingRematch,
  };
}
