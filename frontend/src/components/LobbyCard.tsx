import { useNavigate } from "react-router-dom";
import type { Lobby, JoinLobbyApiResponse } from "../types";
import { fetchWithAuth } from "../services/fetchWithAuth";
import showSwal from "../services/CustomAlert";

interface LobbyCardProps {
  lobby: Lobby;
}

export default function LobbyCard({ lobby }: LobbyCardProps) {
  const navigate = useNavigate();

  const playerCount = lobby.activePlayers.length;

  const fetchJoinLobby = async (lobbyId: string) => {
    const accessToken = localStorage.getItem("tokenPiatto");
    if (!accessToken) {
      showSwal({
        type: "error",
        title: "Sessione scaduta o non valida, effettua l'accesso.",
        alert: true,
      });
      navigate("/");
      return;
    }
    try {
      console.log("Proviamo ad entrare nella lobby con id: ", lobbyId);

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      };
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/v1/lobbies/join/${lobbyId}`,
        options,
      );

      const data = (await response.json()) as JoinLobbyApiResponse;

      if (!response.ok) {
        console.error("Errore nel server:", data);
        showSwal({
          type: "error",
          title: "Sessione scaduta o non valida",
          alert: true,
        });
        return;
      }

      console.log("Ti sei unito correttamente alla lobby:", data.existingLobby);

      navigate(`/game/${lobbyId}`);
    } catch (error) {
      console.error("Errore di rete:", error);
    }
  };

  return (
    <li className="lobby-card">
      <h3>🍷 {lobby.lobbyname.toUpperCase()}</h3>
      <p>
        <strong>Posti Occupati:</strong> {playerCount} / {lobby.numPlayers}
      </p>
      <p>
        <strong>Puntata Iniziale:</strong> {lobby.starterBet}
      </p>
      <button
        onClick={() => fetchJoinLobby(lobby._id)}
        className="btn-join-lobby"
      >
        Unisciti alla Lobby
      </button>
    </li>
  );
}
