import LobbyCard from "../components/LobbyCard.tsx";
import "../styles/Lobbies.css";
import PlayerProfile from "../components/PlayerProfile.tsx";
import { useLobbies } from "../hooks/useLobbies.ts";

export default function Lobbies() {
  const {
    lobbiesList,
    isLoading,
    viewProfile,
    setViewProfile,
    userProfile,
    newLobby,
    setNewLobby,
    fetchLobbies,
    fetchCreateLobby,
    handleLogout,
  } = useLobbies();

  return (
    <div className="lobbies-container">
      <div className="lobbies-header">
        <div className="lobbies-titles">
          <h1>Benvenuto in PIATTO</h1>
          <p>Qui puoi vedere i tavoli a cui sederti.</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setViewProfile(true)}
            className="btn-common btn-profile"
          >
            👤 Profilo
          </button>
        </div>
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

      <PlayerProfile
        isOpen={viewProfile}
        onClose={() => setViewProfile(false)}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
    </div>
  );
}
