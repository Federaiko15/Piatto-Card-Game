import { useState } from "react";
import { GameActions } from "../services/GameActions";
import type { Socket } from "socket.io-client";
import type { Player } from "../types";

interface HeroControlsProps {
  gameSocket: Socket | null;
  lobbyId: string;
  player: Player;
  pot: number;
  controlsDisabled: boolean;
}

export default function HeroControls({
  gameSocket,
  lobbyId,
  player,
  pot,
  controlsDisabled,
}: HeroControlsProps) {
  const [betAmount, setBetAmount] = useState<number>(1);
  const [canDraw, setCanDraw] = useState<boolean>(false);

  const handlePlacePiatto = async () => {
    const amount = Math.min(player.balance, pot);
    const confirmed = await GameActions.placePiatto(
      gameSocket,
      lobbyId,
      amount,
    );
    if (confirmed) {
      setCanDraw(true);
    }
  };

  const btnBaseClass =
    "px-4 py-2.5 rounded-[10px] border-none bg-[#ffd700] text-black font-bold cursor-pointer transition-all duration-200 enabled:hover:bg-[#ffea00] enabled:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[50%]";

  return (
    <>
      <div className="absolute top-1/2 -translate-y-1/2 left-2.5 flex items-center">
        <button
          className={btnBaseClass}
          onClick={() => {
            GameActions.drawCard(gameSocket, lobbyId);
            setCanDraw(false);
          }}
          disabled={controlsDisabled || !canDraw}
        >
          Pesca
        </button>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-2.5 flex items-center gap-2">
        <input
          className="w-20 px-2 py-2.5 rounded-[10px] border border-gray-600 bg-[#1f1f1f] text-white text-center outline-none focus:border-orange-500 font-bold disabled:opacity-50"
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          min="1"
          max={Math.max(1, Math.min(player.balance, pot))}
          disabled={controlsDisabled}
        />
        <button
          className={btnBaseClass}
          onClick={() => {
            GameActions.placeBet(gameSocket, lobbyId, betAmount);
            setCanDraw(true);
          }}
          disabled={controlsDisabled || canDraw}
        >
          Punta
        </button>

        <button
          className={btnBaseClass}
          onClick={handlePlacePiatto}
          disabled={controlsDisabled || canDraw}
        >
          PIATTO
        </button>
      </div>
    </>
  );
}
