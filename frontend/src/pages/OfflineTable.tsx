import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocalGameEngine } from "../hooks/LocalGameEngine/useLocalGameEngine";
import PlayerSeat from "../components/PlayerSeat";
import Card from "../components/Cards";
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

  const { players, piatto, card, currentTurn, playTurn, lastTurnOutcome } =
    useLocalGameEngine(
      state?.username || "Giocatore",
      state?.starterBet || 10,
      state?.numPlayers || 4,
    );

  const [visibleOutcome, setVisibleOutcome] = useState(lastTurnOutcome);

  useEffect(() => {
    setVisibleOutcome(lastTurnOutcome);
    if (!lastTurnOutcome) return;
    const timer = window.setTimeout(() => {
      setVisibleOutcome(null);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [lastTurnOutcome?.id, lastTurnOutcome]);

  const [heroBet, setHeroBet] = useState<number | string>(state?.starterBet || 10);

  if (!state) return <Navigate to="/" replace />;

  const handleHeroBetChange = (value: string) => {
    if (value === "") {
      setHeroBet("");
      return;
    }
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      setHeroBet(Math.max(1, parsed));
    }
  };

  const handleHeroBetBlur = () => {
    if (heroBet === "" || Number(heroBet) < 1) {
      setHeroBet(1);
    }
  };

  const handleHeroPlay = () => {
    const bet = Math.max(1, Number(heroBet) || 1);
    playTurn(bet);
  };

  return (
    // CONTENITORE PRINCIPALE
    <div className="game-room-container offline-theme">
      {/* HEADER */}
      <div className="offline-header">
        <button
          type="button"
          onClick={() => navigate("/")}
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
      <div className="poker-table offline-table">
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

        {/* CROUPIER E CARTA (In alto) */}
        <div className="grid-cell high-center">
          <div className="table-high-center">
            <img src={croupierImg} alt="Croupier" className="pixel-image croupier-img" />
            {card.value > 0 && (
              <div className="card-display">
                <Card seed={card.seed} value={card.value} isHidden={false} />
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
                {isHero && isMyTurn && (
                  <div className="my-turn-alert">🌟 È IL TUO TURNO! 🌟</div>
                )}

                <PlayerSeat
                  player={player}
                  isHero={isHero}
                  isActive={isMyTurn}
                  lastOutcome={playerOutcome}
                />

                {/* CONTROLLI EROE */}
                {isHero && isMyTurn && (
                  <div className="hero-offline-controls">
                    <div className="bet-controls">
                      <button
                        type="button"
                        onClick={() =>
                          setHeroBet((prev) => {
                            const current = typeof prev === "number" ? prev : parseInt(prev, 10) || 1;
                            return Math.max(1, current - 5);
                          })
                        }
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={heroBet}
                        onChange={(e) => handleHeroBetChange(e.target.value)}
                        onBlur={handleHeroBetBlur}
                        className="bet-input"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setHeroBet((prev) => {
                            const current = typeof prev === "number" ? prev : parseInt(prev, 10) || 1;
                            return current + 5;
                          })
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn-draw"
                      onClick={handleHeroPlay}
                    >
                      Conferma e Pesca
                    </button>
                  </div>
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
