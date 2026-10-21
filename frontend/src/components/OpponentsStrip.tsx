import type { Player } from "../types";
import "../styles/OpponentsStrip.css";

interface OpponentsStripProps {
  players: Player[];
  heroId: string;
  currentTurn: number;
}

// Su smartphone i posti degli avversari intorno al tavolo sono nascosti:
// questa striscia in alto mostra comunque chi gioca, quante monete ha e di chi è il turno
export default function OpponentsStrip({
  players,
  heroId,
  currentTurn,
}: OpponentsStripProps) {
  return (
    <ul className="opponents-strip" aria-label="Avversari">
      {players.map((player, index) => {
        if (player.id === heroId) return null;
        const out = player.status === "eliminato";
        const active = index === currentTurn && !out;
        return (
          <li
            key={player.id}
            className={`opponent-chip${active ? " opponent-chip--active" : ""}${out ? " opponent-chip--out" : ""}`}
          >
            <span className="opponent-chip-name">{player.username}</span>
            <span className="opponent-chip-balance">
              {out ? "fuori" : `💰 ${player.balance}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
