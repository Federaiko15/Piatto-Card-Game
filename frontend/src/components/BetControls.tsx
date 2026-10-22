import { useState } from "react";
import "../styles/BetControls.css";

interface BetControlsProps {
  max: number; // la puntata più alta consentita: il minimo tra saldo e piatto
  potIsMax: boolean; // true se il limite è il piatto, così il pulsante rapido si chiama "Piatto"
  onConfirm: (bet: number) => void;
  initialBet?: number;
  disabled?: boolean;
  limitLabel?: string; // perché il massimo è quello (di serie: il piatto o il saldo)
}

// Controlli della puntata usati ai tavoli giocati in locale: la puntata non può mai superare il massimo,
// così "Conferma e Pesca" non fallisce in silenzio
export default function BetControls({
  max,
  potIsMax,
  onConfirm,
  initialBet = 1,
  disabled = false,
  limitLabel,
}: BetControlsProps) {
  const [rawBet, setRawBet] = useState<number | "">(initialBet);

  // il piatto e il saldo cambiano a ogni turno: la puntata mostrata si adatta da sola al nuovo massimo
  const bet = Math.min(max, Math.max(1, rawBet === "" ? 1 : rawBet));

  const handleInput = (value: string) => {
    if (value === "") {
      setRawBet("");
      return;
    }
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) setRawBet(Math.min(max, Math.max(1, parsed)));
  };

  const quickBets = [
    { label: "Min", value: 1 },
    { label: "Metà", value: Math.max(1, Math.floor(max / 2)) },
    { label: limitLabel ? "Max" : potIsMax ? "Piatto" : "Tutto", value: max },
  ];

  return (
    <div className="bet-panel">
      <div className="bet-quick" role="group" aria-label="Puntate rapide">
        {quickBets.map((quick) => (
          <button
            key={quick.label}
            type="button"
            className={`bet-chip${bet === quick.value ? " bet-chip--active" : ""}`}
            onClick={() => setRawBet(quick.value)}
            disabled={disabled}
          >
            {quick.label}
          </button>
        ))}
      </div>

      <div className="bet-row">
        <div className="bet-stepper">
          <button
            type="button"
            aria-label="Diminuisci la puntata"
            onClick={() => setRawBet(Math.max(1, bet - 1))}
            disabled={disabled || bet <= 1}
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={rawBet === "" ? "" : bet}
            onChange={(e) => handleInput(e.target.value)}
            onBlur={() => setRawBet(bet)}
            className="bet-stepper-input"
            aria-label="Puntata"
            disabled={disabled}
          />
          <button
            type="button"
            aria-label="Aumenta la puntata"
            onClick={() => setRawBet(Math.min(max, bet + 1))}
            disabled={disabled || bet >= max}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="bet-confirm"
          onClick={() => onConfirm(bet)}
          disabled={disabled}
        >
          Punta {bet} e pesca
        </button>
      </div>

      <p className="bet-hint">
        Massimo {max} ({limitLabel ?? (potIsMax ? "il piatto" : "il tuo saldo")})
      </p>
    </div>
  );
}
