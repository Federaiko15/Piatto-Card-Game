import { useState, useEffect } from "react";
import { GameActions } from "../services/GameActions";
import type { Socket } from "socket.io-client";
import type { Player } from "../types";
import "../styles/HeroControls.css";

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

  // Sincronizziamo canDraw con il server: utile in caso di errori di rete o refresh della pagina
  useEffect(() => {
    if (player.currentBet > 0) {
      // posso fare questo controllo perchè dopo aver pescato, lo stato currentBet viene riportato a 0
      setCanDraw(true);
    } else {
      setCanDraw(false);
    }
  }, [player.currentBet]);

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

  return (
    <div className="hero-controls">
      <div className="hero-controls-group">
        <button
          className="btn-hero"
          onClick={() => {
            setCanDraw(false);
            GameActions.drawCard(gameSocket, lobbyId);
          }}
          disabled={controlsDisabled || !canDraw}
        >
          Pesca
        </button>
      </div>

      <div className="hero-controls-group">
        <input
          className="hero-bet-input"
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          min="1"
          max={Math.max(1, Math.min(player.balance, pot))}
          disabled={controlsDisabled}
        />
        <button
          className="btn-hero"
          onClick={() => {
            GameActions.placeBet(gameSocket, lobbyId, betAmount);
            setCanDraw(true);
          }}
          disabled={controlsDisabled || canDraw}
        >
          Punta
        </button>

        <button
          className="btn-hero"
          onClick={handlePlacePiatto}
          disabled={controlsDisabled || canDraw}
        >
          PIATTO
        </button>
      </div>
    </div>
  );
}
