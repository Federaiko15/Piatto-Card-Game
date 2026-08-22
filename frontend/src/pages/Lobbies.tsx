import { useState } from "react";
import LobbyCard from "../components/LobbyCard.tsx";
import "../styles/Lobbies.css";
import PlayerProfile from "../components/PlayerProfile.tsx";
import { useLobbies } from "../hooks/useLobbies.ts";
import lobbiesBg from "../assets/lobbies.png";

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

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string>("free");
  const [searchStarterBet, setSearchStarterBet] = useState<number>(-1);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLobbies(false, searchStatus, searchStarterBet);
  };

  return (
    <div
      className="lobbies-container"
      style={{
        backgroundImage: `url(${lobbiesBg})`,
        imageRendering: "pixelated",
      }}
    >
      <div className="lobbies-header">
        <div className="lobbies-titles">
          <h1>Benvenuto in PIATTO</h1>
          <p>Qui puoi vedere i tavoli a cui sederti.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-general-search"
            onClick={() => setIsSearching(true)}
          >
            🔍 Cerca Tavoli
          </button>
          <button
            onClick={() => setViewProfile(true)}
            className="btn-common btn-profile"
          >
            👤 Profilo
          </button>
        </div>
      </div>

      {/* MODALE DI RICERCA / FILTRI TAVOLO (Posizionato a livello root) */}
      {isSearching && (
        <>
          <div
            className="search-overlay"
            onClick={() => setIsSearching(false)}
          />
          <form
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setIsSearching(false);
            }}
            className="form-search-modal"
          >
            <div className="form-search-header">
              <h4>Filtra Tavoli</h4>
              <button
                type="button"
                className="search-close-btn"
                onClick={() => setIsSearching(false)}
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            <label className="search-field-label">Stato del Tavolo</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="search-select"
            >
              <option value="free">Tavoli Liberi</option>
              <option value="full">Tavoli Pieni</option>
              <option value="all">Tutti i Tavoli</option>
            </select>

            <label className="search-field-label">Puntata Massima</label>
            <input
              type="number"
              placeholder="Starter Bet Max (es. 50)"
              value={searchStarterBet === -1 ? "" : searchStarterBet}
              onChange={(e) =>
                setSearchStarterBet(
                  e.target.value === "" ? -1 : Number(e.target.value),
                )
              }
              min="1"
              className="search-input"
            />

            <button type="submit" className="btn-common btn-search btn-search-apply">
              Applica Filtri
            </button>
          </form>
        </>
      )}

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
          <ul className="lobbies-list">
            {isLoading ? (
              <p>Ricerca dei tavoli in corso...</p>
            ) : lobbiesList.length > 0 ? (
              lobbiesList.map((lobby) => (
                <LobbyCard key={lobby._id} lobby={lobby} />
              ))
            ) : null}
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
