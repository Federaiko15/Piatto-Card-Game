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
      style={{ marginTop: "40px" }}
    >
      {/* Indicatore del turno */}
      {isReallyActive && (
        <div
          style={{
            position: "absolute",
            top: "-35px", // Questo lo spinge fisicamente 35 pixel sopra il box
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999, // Assicura che niente lo copra
            backgroundColor: "#FF9800",
            color: "white",
            padding: "4px 10px",
            borderRadius: "8px",
            boxShadow: "0px 5px 15px rgba(0,0,0,0.5)",
            fontSize: "0.85rem",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          Tocca a lui!
        </div>
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
