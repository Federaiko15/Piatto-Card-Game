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
  const [betAmount, setBetAmount] = useState<number | string>(1);
  const [canDraw, setCanDraw] = useState<boolean>(false);

  const maxBet = Math.max(1, Math.min(player.balance, pot));

  // Sincronizziamo canDraw con il server: utile in caso di errori di rete o refresh della pagina
  useEffect(() => {
    if (player.currentBet > 0) {
      // posso fare questo controllo perchè dopo aver pescato, lo stato currentBet viene riportato a 0
      setCanDraw(true);
    } else {
      setCanDraw(false);
    }
  }, [player.currentBet]);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setBetAmount("");
      return;
    }
    const parsed = parseInt(val, 10);
    if (!Number.isNaN(parsed)) {
      if (parsed > maxBet) {
        setBetAmount(maxBet);
      } else if (parsed < 1) {
        setBetAmount(1);
      } else {
        setBetAmount(parsed);
      }
    }
  };

  const handleBetBlur = () => {
    if (betAmount === "" || Number(betAmount) < 1) {
      setBetAmount(1);
    }
  };

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

  const handlePlaceBet = () => {
    const amount = Math.max(1, Math.min(Number(betAmount) || 1, player.balance, pot));
    GameActions.placeBet(gameSocket, lobbyId, amount);
    setCanDraw(true);
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
          onChange={handleBetChange}
          onBlur={handleBetBlur}
          min="1"
          max={maxBet}
          disabled={controlsDisabled}
        />
        <button
          className="btn-hero"
          onClick={handlePlaceBet}
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
