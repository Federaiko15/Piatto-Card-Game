import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocalGameEngine } from "../hooks/LocalGameEngine/useLocalGameEngine";
import PlayerSeat from "../components/PlayerSeat";
import Card from "../components/Cards";
import BetControls from "../components/BetControls";
import OpponentsStrip from "../components/OpponentsStrip";
import showSwal from "../services/CustomAlert";
import piattoImg from "../assets/piatto.png";
import croupierImg from "../assets/croupier.png";
import coinsImg from "../assets/coins.png";
import tableBg from "../assets/table.png";
import "../styles/OfflineTable.css";

type OfflineRoomState = {
  username: string;
  starterBet: number;
  numPlayers: number;
};

// La mappa delle classi CSS per posizionare i giocatori sulla griglia
const allGridPositions = [
  "bottom-center", // 0: Eroe (in basso al centro)
  "low-right", // 1: Basso-Destra
  "low-left", // 2: Basso-Sinistra
  "mid-right", // 3: Centro-Destra
  "mid-left", // 4: Centro-Sinistra
  "high-right", // 5: Alto-Destra
  "high-left", // 6: Alto-Sinistra
];

const availableSeatIndices = [0, 1, 2, 3, 4, 5, 6];

export default function OfflineRoom() {
  const location = useLocation() as { state: OfflineRoomState | null };
  const navigate = useNavigate();
  const state = location.state;

  const {
    players,
    piatto,
    card,
    currentTurn,
    finished,
    playTurn,
    lastTurnOutcome,
  } = useLocalGameEngine(
      state?.username || "Giocatore",
      state?.starterBet || 10,
      state?.numPlayers || 4,
    );

  // l'esito dell'ultimo turno resta visibile per qualche secondo, poi si nasconde
  const [hiddenOutcomeId, setHiddenOutcomeId] = useState<number | null>(null);

  useEffect(() => {
    if (!lastTurnOutcome) return;
    const { id } = lastTurnOutcome;
    const timer = window.setTimeout(() => setHiddenOutcomeId(id), 2500);
    return () => window.clearTimeout(timer);
  }, [lastTurnOutcome]);

  const visibleOutcome =
    lastTurnOutcome && lastTurnOutcome.id !== hiddenOutcomeId ? lastTurnOutcome : null;

  if (!state) return <Navigate to="/offline" replace />;

  const hero = players.find((p) => p.hero);
  const heroId = hero?.id ?? "";

  // uscire a metà partita la fa perdere: chiediamo conferma
  const handleLeave = async () => {
    if (!finished) {
      const confirmed = await showSwal({
        type: "leave_table",
        title: "Vuoi lasciare il tavolo?",
        alert: true,
      });
      if (!confirmed) return;
    }
    navigate("/");
  };

  const winner = finished
    ? players.reduce((best, p) => (p.balance > best.balance ? p : best))
    : null;

  return (
    // CONTENITORE PRINCIPALE
    <div className="game-room-container offline-theme">
      {/* HEADER */}
      <div className="offline-header">
        <button
          type="button"
          onClick={handleLeave}
          className="btn-leave"
        >
          Esci
        </button>

        <div className="mode-badge">
          <span className="mode-badge-full">MODALITÀ ALLENAMENTO</span>
          <span className="mode-badge-short">ALLENAMENTO</span>
        </div>
      </div>

      {/* TAVOLO (GRIGLIA) */}
      <OpponentsStrip players={players} heroId={heroId} currentTurn={currentTurn} />

      <div className="poker-table offline-table with-strip">
        <img
          src={tableBg}
          alt="Tavolo da gioco"
          className="table-background-image"
        />

        {/* BANNER MOBILE ESITO TURNO GIOCATORE */}
        {visibleOutcome && (
          <div key={visibleOutcome.id} className={`mobile-turn-banner banner-${visibleOutcome.type}`}>
            <span className="banner-icon">
              {visibleOutcome.type === "win" ? "🎉" : "💸"}
            </span>
            <span className="banner-text">
              <strong>{visibleOutcome.username}</strong> ha{" "}
              {visibleOutcome.action} <strong>{visibleOutcome.amount}</strong> monete
            </span>
          </div>
        )}

        {/* FINE PARTITA */}
        {finished && (
          <div className="offline-game-over" role="dialog" aria-label="Fine partita">
            <p className="offline-game-over-reason">
              {finished === "pot_emptied"
                ? "Il piatto è vuoto: partita finita!"
                : "È rimasto un solo giocatore: partita finita!"}
            </p>
            {winner && (
              <p className="offline-game-over-winner">
                {winner.hero
                  ? "🏆 Hai chiuso con più monete di tutti!"
                  : `🏆 Il più ricco al tavolo è ${winner.username}`}
              </p>
            )}
            {hero && (
              <p className="offline-game-over-hero">
                Le tue monete: <strong>{hero.balance}</strong>
              </p>
            )}
            <div className="offline-game-over-actions">
              <button
                type="button"
                className="btn-draw"
                onClick={() => navigate("/offline", { state })}
              >
                Gioca ancora
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate("/")}>
                Menu
              </button>
            </div>
          </div>
        )}

        {/* CROUPIER E CARTA (In alto) */}
        <div className="grid-cell high-center">
          <div className="table-high-center">
            <img src={croupierImg} alt="Croupier" className="pixel-image croupier-img" />
            {card.value > 0 && (
              <div className="card-display">
                <Card
                  key={lastTurnOutcome?.id}
                  seed={card.seed}
                  value={card.value}
                  reveal
                />
              </div>
            )}
          </div>
        </div>

        {/* PIATTO E SOLDI */}
        <div className="grid-cell mid-center">
          <div className="table-center">
            <div className="piatto-container">
              <img src={piattoImg} alt="Piatto" className="pixel-image piatto-img" />
            </div>
            <div className="pot-container">
              <p className="paragraph-coin">
                <span className="pot-amount">{piatto}</span>
                <img src={coinsImg} alt="Monete" className="pixel-coins" />
              </p>
            </div>
          </div>
        </div>

        {/* I GIOCATORI */}
        {players.map((player, index) => {
          const seatIndex = availableSeatIndices[index];
          const positionGrid = allGridPositions[seatIndex];
          const isMyTurn = currentTurn === index;
          const isHero = player.hero;

          const playerOutcome =
            visibleOutcome &&
            (visibleOutcome.playerId === player.playerId ||
              visibleOutcome.playerId === player.id)
              ? {
                  text: `${player.username} ha ${visibleOutcome.action} ${visibleOutcome.amount}`,
                  type: visibleOutcome.type,
                }
              : null;

          return (
            <div key={player.playerId} className={`grid-cell ${positionGrid}`}>
              <div className="seat-wrapper">
                {isHero && isMyTurn && !finished && (
                  <div className="my-turn-alert">🌟 È IL TUO TURNO! 🌟</div>
                )}

                <PlayerSeat
                  player={player}
                  isHero={isHero}
                  isActive={isMyTurn}
                  lastOutcome={playerOutcome}
                />

                {/* CONTROLLI EROE */}
                {isHero && isMyTurn && !finished && (
                  <BetControls
                    max={Math.max(1, Math.min(player.balance, piatto))}
                    potIsMax={piatto <= player.balance}
                    initialBet={state.starterBet}
                    onConfirm={playTurn}
                  />
                )}

                {/* BADGE PERSONALITÀ */}
                {!isHero && player.personality && (
                  <div
                    className={`personality-tag ${player.personality.toLowerCase()}`}
                  >
                    {player.personality}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
