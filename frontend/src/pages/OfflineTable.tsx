import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLocalGameEngine } from "../hooks/LocalGameEngine/useLocalGameEngine";
import PlayerSeat from "../components/PlayerSeat";
import Card from "../components/Cards";
import piattoImg from "../assets/piatto.png";
import croupierImg from "../assets/croupier.png";
import coinsImg from "../assets/coins.png";
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

  if (!state) return <Navigate to="/" replace />;

  const { players, piatto, card, currentTurn, playTurn } = useLocalGameEngine(
    state.username,
    state.starterBet,
    state.numPlayers,
  );

  const [heroBet, setHeroBet] = useState<number>(state.starterBet || 10);

  const handleHeroBetChange = (value: string) => {
    if (value === "") {
      setHeroBet(1);
      return;
    }
    const parsed = parseInt(value, 10);
    setHeroBet(Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
  };

  const handleHeroPlay = () => {
    playTurn(heroBet);
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

        <div className="mode-badge">MODALITÀ ALLENAMENTO</div>
      </div>

      {/* TAVOLO (GRIGLIA) */}
      <div className="poker-table offline-table">
        {/* PIATTO (Fisso al centro) */}
        <div className="grid-cell mid-center">
          <div className="table-center">
            <img src={piattoImg} alt="Piatto" className="pixel-image" />
            <p className="paragraph-coin">
              {piatto}
              <img src={coinsImg} alt="Monete" className="pixel-coins" />
            </p>
          </div>
        </div>

        {/* CROUPIER E CARTA (Fissi in alto) */}
        <div className="grid-cell high-center">
          <div className="table-high-center">
            <img src={croupierImg} alt="Croupier" className="pixel-image" />
            {card.value > 0 && (
              <div className="card-display">
                <Card seed={card.seed} value={card.value} isHidden={false} />
              </div>
            )}
          </div>
        </div>

        {/* I GIOCATORI */}
        {players.map((player, index) => {
          const seatIndex = availableSeatIndices[index];
          const positionGrid = allGridPositions[seatIndex];
          const isMyTurn = currentTurn === index;
          const isHero = player.hero;

          return (
            <div key={player.playerId} className={`grid-cell ${positionGrid}`}>
              <div className="seat-wrapper">
                {/* CONTROLLI EROE */}
                {isHero && isMyTurn && (
                  <div className="hero-offline-controls">
                    <div className="bet-controls">
                      <button
                        type="button"
                        onClick={() =>
                          setHeroBet((prev) => Math.max(1, prev - 5))
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
                        className="bet-input"
                      />

                      <button
                        type="button"
                        onClick={() => setHeroBet((prev) => prev + 5)}
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

                <PlayerSeat
                  player={player}
                  isHero={isHero}
                  isActive={isMyTurn}
                />

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
