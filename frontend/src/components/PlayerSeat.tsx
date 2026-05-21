import type { Player } from "../types";
import "../styles/PlayerSeat.css";

interface PlayerSeatProps {
  player: Player;
  isHero?: boolean;
  isActive?: boolean;
}

export default function PlayerSeat({
  player,
  isHero,
  isActive,
}: PlayerSeatProps) {
  // Raggruppiamo i controlli sullo status per comodità
  const isEliminato = player.status === "eliminato";
  const isLogout = player.status === "logout";
  const isWaiting = player.status === "waiting";

  // Anche se il backend salta i turni di chi è eliminato/logout,
  // mettiamo un doppio controllo visivo
  const isReallyActive = isActive && !isEliminato && !isLogout;

  return (
    <div
      className={`placeholder-box ${isHero ? "hero" : "opponent"} 
        ${isReallyActive ? "active-turn" : ""} 
        ${isEliminato ? "seat-eliminato" : ""} 
        ${isLogout ? "seat-logout" : ""}`}
    >
      {/* Indicatore del turno */}
      {isReallyActive && !isHero && (
        <div className="turn-indicator">Tocca a lui!</div>
      )}

      {/* Dettagli Giocatore */}
      <h4 className="player-name">{player.username}</h4>

      <p className="player-balance">💰 {player.balance}</p>

      {/* Etichette Dinamiche in base allo status */}
      {isWaiting && <span className="status-badge waiting">In attesa...</span>}

      {isEliminato && (
        <span className="status-badge eliminato">☠️ Eliminato</span>
      )}

      {isLogout && <span className="status-badge logout">🔌 Disconnesso</span>}
    </div>
  );
}
