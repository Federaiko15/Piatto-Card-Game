import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RUN_TABLES, createRun, getHero, randomSeed } from "@piatto/game-core";
import authBg from "../assets/auth.png";
import { loadHeroName, loadRun, saveHeroName, saveRun } from "../services/runStorage";
import "../styles/Auth.css";
import "../styles/ModeSelect.css";
import "../styles/Roguelike.css";

const RULES = [
  "Affronti tre tavoli uno dopo l'altro: le monete che ti restano le porti al tavolo successivo.",
  "Con una carta da 1 a 5 la puntata va nel piatto, da 6 a 10 la prendi dal piatto.",
  "A ogni tavolo si gioca un solo mazzo: le carte uscite non tornano più.",
  "Se il piatto si svuota tutti rimettono la posta; quando il mazzo finisce, quello che resta si divide.",
  "Ogni tavolo ha una quota: alla fine devi avere almeno quelle monete, altrimenti la notte è finita.",
];

export default function RoguelikeMenu() {
  const navigate = useNavigate();
  const [savedRun] = useState(loadRun);
  const [heroName, setHeroName] = useState(loadHeroName);
  // con una notte salvata, "Nuova notte" chiede una seconda conferma prima di sovrascriverla
  const [confirmingNew, setConfirmingNew] = useState(false);

  const startNewRun = () => {
    if (savedRun && !confirmingNew) {
      setConfirmingNew(true);
      return;
    }
    const name = heroName.trim() || "Giocatore";
    saveHeroName(name);
    saveRun(createRun(randomSeed(), name));
    navigate("/roguelike/run");
  };

  return (
    <div
      className="mode-container"
      style={{ backgroundImage: `url(${authBg})`, imageRendering: "pixelated" }}
    >
      <header className="mode-header">
        <h1 className="mode-title run-menu-title">Notte all'Osteria</h1>
        <p className="mode-subtitle">
          {RUN_TABLES.length} tavoli, una sola notte per fare fortuna
        </p>
      </header>

      <div className="run-menu-box">
        {savedRun && (
          <button
            type="button"
            className="run-btn-primary"
            onClick={() => navigate("/roguelike/run")}
          >
            Continua la notte
            <span className="run-btn-detail">
              Tavolo {savedRun.tableIndex + 1}/{RUN_TABLES.length} ·{" "}
              {savedRun.phase === "table"
                ? getHero(savedRun).balance
                : savedRun.bankroll}{" "}
              monete
            </span>
          </button>
        )}

        <form
          className="run-new-form"
          onSubmit={(e) => {
            e.preventDefault();
            startNewRun();
          }}
        >
          <label className="offline-label" htmlFor="run-hero-name">
            Il tuo nome
          </label>
          <input
            id="run-hero-name"
            className="offline-input"
            value={heroName}
            maxLength={16}
            onChange={(e) => setHeroName(e.target.value)}
          />
          <button
            type="submit"
            className={savedRun ? "run-btn-secondary" : "run-btn-primary"}
          >
            {confirmingNew
              ? "Sicuro? La notte salvata andrà persa"
              : "Nuova notte"}
          </button>
        </form>

        <details className="run-rules" open={!savedRun}>
          <summary>Come si gioca</summary>
          <ul>
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </details>
      </div>

      <button type="button" className="mode-legal-btn" onClick={() => navigate("/")}>
        ← Scegli un'altra modalità
      </button>
    </div>
  );
}
