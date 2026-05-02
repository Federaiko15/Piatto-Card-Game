import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LobbyCard from "../components/LobbyCard.tsx";
import type {
  Lobby,
  NewLobbyData,
  FetchLobbiesResponse,
  CreateLobbyResponse,
} from "../types";
import { fetchWithAuth } from "../services/fetchWithAuth.ts";
import showSwal from "../services/CustomAlert.ts";
import "../styles/Lobbies.css";

export default function Lobbies() {
  const [lobbiesList, setLobbiesList] = useState<Lobby[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const [newLobby, setNewLobby] = useState<NewLobbyData>({
    lobbyname: "",
    starterBet: 0,
    numPlayers: 0,
  });

  // ho aggiunto questo controllo così da poter controllare l'alert di avviso nel caso in cui l'utente arrivi dal login
  const fetchLobbies = async (isInitialLoad: boolean = false) => {
    setIsLoading(true);
    setLobbiesList([]); // Svuoto la lista per mostrare lo stato di caricamento
    const accessToken = localStorage.getItem("tokenPiatto");

    if (!accessToken) {
      showSwal({
        type: "error",
        title: "Sessione scaduta o non valida, effettua l'accesso.",
        alert: true,
      });
      navigate("/");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Cerchiamo le lobby con il token:", accessToken);
      // chiamata API GET al mio server per ricevere la lista delle lobbies "libere", con ancora posti disponibili

      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const response = await fetchWithAuth(
        "http://localhost:4000/api/v1/lobbies/getLobbies",
        options,
      ); // nel campo header stiamo dicendo alla nostra app Express che stiamo facendo una chiamata API GET, che il content type con cui vogliamo lavorare sia di tipo json e, nel campo autorizzazione mandiamo in nostro token.

      const data = (await response.json()) as FetchLobbiesResponse;

      if (!response.ok) {
        console.error("Errore nel server:", data);
        if (response.status === 401) return; // fetchWithAuth ci sta già reindirizzando

        if (!isInitialLoad) {
          showSwal({
            type: "getLobbies",
            title: "Nessuna lobby disponibile è stata trovata, creane una tu!",
            alert: false,
          });
        }
        return; // La lista è già vuota, il finally gestirà il loading
      }

      console.log("Lobby trovate:", data);

      setLobbiesList(data.allFreeLobbies || []);
    } catch (error) {
      console.error("Errore di rete:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // controllo se un utente è appena arrivato nella pagina Lobbies dalla pagina di autenticazione
    const justLoggedIn = location.state?.justLoggedIn;

    if (justLoggedIn) {
      showSwal({
        type: "login_register",
        title: "Login effettuato con successo!",
        alert: false,
      });
      fetchLobbies(true); // Passiamo true per silenziare l'alert se non ci sono lobby
    }
    // Pulisce lo stato per evitare che ricaricando la pagina ricompaia
    window.history.replaceState({}, document.title);
  }, []);

  const fetchCreateLobby = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const accessToken = localStorage.getItem("tokenPiatto");

    try {
      console.log("Creazione la lobby...");
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newLobby),
      };

      const response = await fetchWithAuth(
        "http://localhost:4000/api/v1/lobbies/create",
        options,
      );

      const data = (await response.json()) as CreateLobbyResponse;
      if (response.ok) {
        const createdLobbyId = data.lobby._id;

        navigate(`/game/${createdLobbyId}`);
        fetchLobbies();
      } else {
        if (response.status === 401) return; // fetchWithAuth ci sta già reindirizzando

        showSwal({
          type: "error",
          title: data.message,
          alert: true,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
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
      const confirmed = await showSwal({
        type: "logout",
        title: "Sei sicuro di uscire dalla retrobottega?",
        alert: true,
      });
      if (confirmed) {
        await fetch("http://localhost:4000/api/v1/users/logout", {
          method: "POST",
          credentials: "include", // Fondamentale per fargli vedere il cookie da cancellare!
        });
        localStorage.removeItem("tokenPiatto"); // Cancelliamo la chiave dal localStorage
        navigate("/"); // Torniamo al login
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="lobbies-container">
      <div className="lobbies-header">
        <div className="lobbies-titles">
          <h1>Benvenuto nel retrobottega 🍷</h1>
          <p>Qui puoi vedere i tavoli a cui sederti.</p>
        </div>
        <button
          onClick={handleLogout}
          className="btn-common btn-logout"
          disabled={isLoading}
        >
          Esci dal locale
        </button>
      </div>

      <div className="lobbies-content">
        <div className="lobbies-sidebar">
          <form onSubmit={fetchCreateLobby} className="create-lobby-form">
            <h3>Apri un nuovo tavolo</h3>

            <input
              type="text"
              placeholder="Nome del Tavolo (es. Tavolo dei Boss)"
              value={newLobby.lobbyname}
              onChange={(e) =>
                setNewLobby({ ...newLobby, lobbyname: e.target.value })
              }
              required
            />

            <input
              type="number"
              placeholder="Puntata Iniziale (Starter Bet)"
              onChange={(e) =>
                setNewLobby({ ...newLobby, starterBet: Number(e.target.value) })
              }
              required
              min="1"
            />

            <input
              type="number"
              placeholder="Numero Giocatori (1-7)"
              onChange={(e) =>
                setNewLobby({ ...newLobby, numPlayers: Number(e.target.value) })
              }
              required
              min="1"
            />

            <button type="submit" className="btn-submit-form">
              Conferma e Apri
            </button>
          </form>
        </div>

        <div className="lobbies-main">
          <div className="lobbies-actions">
            <button
              onClick={() => fetchLobbies()}
              className="btn-common btn-search"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Ricerca...</span>
                </>
              ) : (
                "Cerca Tavoli Liberi"
              )}
            </button>
          </div>

          <ul className="lobbies-list">
            {isLoading ? (
              <p>Ricerca dei tavoli in corso...</p>
            ) : lobbiesList.length > 0 ? (
              lobbiesList.map((lobby) => (
                <LobbyCard key={lobby._id} lobby={lobby} />
              ))
            ) : (
              <p>
                Nessun tavolo trovato. Clicca il bottone per cercare o creane
                uno!
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
