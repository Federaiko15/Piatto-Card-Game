import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLocalGameEngine } from "../hooks/LocalGameEngine/useLocalGameEngine";
import PlayerSeat from "../components/PlayerSeat";
import Card from "../components/Cards";
import piattoImg from "../assets/piatto.png";
import croupierImg from "../assets/croupier.png";
import coinsImg from "../assets/coins.png";

type OfflineRoomState = {
  username: string;
  starterBet: number;
  numPlayers: number;
};

// La mappa di Tailwind per posizionare i giocatori sulla griglia
const allGridPositions = [
  "col-start-3 row-start-3", // 0: Eroe (in basso al centro)
  "col-start-4 row-start-3", // 1: Basso-Destra
  "col-start-2 row-start-3", // 2: Basso-Sinistra
  "col-start-5 row-start-2", // 3: Centro-Destra
  "col-start-1 row-start-2", // 4: Centro-Sinistra (nota: gli indici scalano grazie a availableSeatIndices)
  "col-start-4 row-start-1", // 5: Alto-Destra
  "col-start-2 row-start-1", // 6: Alto-Sinistra
];

// Saltiamo il posto 4 (piatto, col-3 row-2) e 7 (croupier, col-3 row-1)
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
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full p-5 overflow-hidden text-white font-sans bg-[radial-gradient(circle,#2c3e50_0%,#000000_100%)]">
      {/* HEADER */}
      <div className="absolute top-5 left-5 flex items-center gap-5 z-50">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-md transition-all hover:-translate-y-px opacity-100 hover:opacity-95"
        >
          Esci
        </button>

        <div className="bg-orange-500 text-black font-bold text-sm py-1.5 px-4 rounded-full shadow-[0_0_10px_rgba(243,156,18,0.5)]">
          MODALITÀ ALLENAMENTO
        </div>
      </div>

      {/* TAVOLO (GRIGLIA) */}
      <div
        className="relative grid grid-cols-5 grid-rows-[1fr_2.5fr_1fr] gap-3 w-full max-w-275 h-screen min-h-162.5 aspect-video items-center justify-items-center bg-[url('../assets/table.png')] bg-contain bg-center bg-no-repeat"
        style={{ imageRendering: "pixelated" }} // Inline per compatibilità browser
      >
        {/* PIATTO (Fisso al centro) */}
        <div className="col-start-3 row-start-2 relative w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 -translate-y-16">
            <img
              src={piattoImg}
              alt="Piatto"
              className="max-w-30 h-auto pointer-events-none select-none"
              style={{ imageRendering: "pixelated" }}
            />
            <p className="flex items-center justify-center gap-1.5 m-0 text-[1.1rem] font-bold text-yellow-400">
              {piatto}
              <img
                src={coinsImg}
                alt="Monete"
                className="w-5.5 h-5.5"
                style={{ imageRendering: "pixelated" }}
              />
            </p>
          </div>
        </div>

        {/* CROUPIER E CARTA (Fissi in alto) */}
        <div className="col-start-3 row-start-1 relative w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 -translate-y-6">
            <img
              src={croupierImg}
              alt="Croupier"
              className="max-w-30 h-auto pointer-events-none select-none"
              style={{ imageRendering: "pixelated" }}
            />
            {card.value > 0 && (
              <div className="flex items-center justify-center min-h-20">
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

          // Gestione dinamica del colore del badge personalità
          const getBadgeColor = (personality?: string) => {
            switch (personality?.toLowerCase()) {
              case "aggressivo":
                return "bg-red-600";
              case "tirchio":
                return "bg-gray-500";
              case "calcolatore":
                return "bg-blue-600";
              case "pazzo":
                return "bg-purple-600";
              case "calmo":
                return "bg-green-600";
              default:
                return "bg-gray-700";
            }
          };

          return (
            <div
              key={player.playerId}
              className={`relative w-full h-full flex items-center justify-center ${positionGrid}`}
            >
              {/* CONTROLLI EROE */}
              {isHero && isMyTurn && (
                <div className="absolute -top-14.5 sm:-top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
                  <div className="flex items-center gap-1.5 bg-black/55 p-1.5 rounded-xl backdrop-blur-[2px]">
                    <button
                      type="button"
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white font-bold text-base rounded-md transition-transform hover:-translate-y-px"
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
                      className="w-20 h-8 bg-[#1f1f1f] border border-gray-600 focus:border-orange-500 focus:shadow-[0_0_0_2px_rgba(243,156,18,0.2)] rounded-md text-white text-center outline-none"
                    />

                    <button
                      type="button"
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white font-bold text-base rounded-md transition-transform hover:-translate-y-px"
                      onClick={() => setHeroBet((prev) => prev + 5)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-2 px-3.5 rounded-lg whitespace-nowrap transition-all hover:-translate-y-px hover:shadow-[0_0_12px_rgba(243,156,18,0.35)]"
                    onClick={handleHeroPlay}
                  >
                    Conferma e Pesca
                  </button>
                </div>
              )}

              {/* SEDIA E GIOCATORE */}
              <div className="relative flex items-center justify-center">
                <PlayerSeat
                  player={player}
                  isHero={isHero}
                  isActive={isMyTurn}
                />

                {/* BADGE PERSONALITÀ */}
                {!isHero && player.personality && (
                  <div
                    className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[0.7rem] py-0.75 px-2 rounded-full uppercase font-bold text-white z-10 whitespace-nowrap shadow-[0_4px_10px_rgba(0,0,0,0.35)] pointer-events-none ${getBadgeColor(player.personality)}`}
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
