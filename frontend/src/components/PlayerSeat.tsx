import type { Player } from "../types";
import UserAvatar from "./UserAvatar";
import "../styles/PlayerSeat.css";

export interface TurnOutcomeData {
  text: string;
  type: "win" | "lose";
}

interface PlayerSeatProps {
  player: Player;
  isHero?: boolean;
  isActive?: boolean;
  lastOutcome?: TurnOutcomeData | null;
}

export default function PlayerSeat({
  player,
  isHero,
  isActive,
  lastOutcome,
}: PlayerSeatProps) {
  // Raggruppiamo i controlli sullo status
  const isEliminato = player.status === "eliminato";
  const isLogout = player.status === "logout";
  const isWaiting = player.status === "waiting";
  const isBot = (player as any).hero === false && (player as any).personality !== undefined;

  // Controllo visivo per il turno
  const isReallyActive = isActive && !isEliminato && !isLogout;

  return (
    <div
      className={`placeholder-box ${isHero ? "hero" : "opponent"} 
        ${isReallyActive ? "active-turn" : ""} 
        ${isEliminato ? "seat-eliminato" : ""} 
        ${isLogout ? "seat-logout" : ""}`}
    >
      {/* Messaggio esito fine turno ("nome_utente ha preso/lasciato valore_puntato") */}
      {lastOutcome && (
        <div
          key={lastOutcome.text + lastOutcome.type}
          className={`turn-outcome-bubble outcome-${lastOutcome.type}`}
        >
          {lastOutcome.text}
        </div>
      )}

      {/* Indicatore del turno (Fumetto) */}
      {!lastOutcome && isReallyActive && !isHero && (
        <div className="turn-indicator">Tocca a lui!</div>
      )}

      {/* Avatar del Giocatore */}
      <div className="seat-avatar-wrapper">
        <UserAvatar
          username={player.username}
          size="sm"
          isHero={isHero}
          isBot={isBot}
        />
      </div>

      {/* Dettagli Giocatore */}
      <div className="seat-info">
        <h4 className="player-name" title={player.username}>
          {player.username}
        </h4>
        <p className="player-balance">💰 {player.balance}</p>
      </div>

      {/* Etichette Dinamiche in base allo status */}
      {isWaiting && <span className="status-badge waiting">In attesa...</span>}

      {isEliminato && (
        <span className="status-badge eliminato">☠️ Eliminato</span>
      )}

      {isLogout && <span className="status-badge logout">🔌 Disconnesso</span>}
    </div>
  );
}
