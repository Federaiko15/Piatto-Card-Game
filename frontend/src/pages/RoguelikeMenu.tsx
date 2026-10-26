import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRun, editionTables, getHero, randomSeed } from "@piatto/game-core";
import { EDITION, ITCH } from "../edition";
import { buttonSound } from "../audio/sfx";
import authBg from "../assets/auth.png";
import { loadHeroName, loadRun, saveHeroName, saveRun } from "../services/runStorage";
import "../styles/ModeSelect.css";
import "../styles/Roguelike.css";

const RULES = [
  "Affronti i tavoli uno dopo l'altro: le monete che ti restano le porti al tavolo successivo.",
  "Con una carta da 1 a 5 la puntata va nel piatto, da 6 a 10 la prendi dal piatto.",
  "A ogni tavolo si gioca un solo mazzo: le carte uscite non tornano più.",
  "Se il piatto si svuota tutti rimettono la posta; quando il mazzo finisce, quello che resta si divide.",
  "Ogni tavolo ha una quota: alla fine devi avere almeno quelle monete, altrimenti la notte è finita.",
  "Le figure hanno un effetto, per tutti: il fante ruba una moneta, il cavallo fa saltare un turno, il re raddoppia la vincita.",
  "Tra un tavolo e l'altro passi dalla bottega: santini, consumabili e cibi ti aiutano, ma costano monete che poi non hai al tavolo.",
];

export default function RoguelikeMenu() {
  const navigate = useNavigate();
  const [savedRun] = useState(loadRun);
  // i tavoli della notte salvata, o di quella nuova nell'edizione di questa build
  const tables = editionTables(savedRun?.edition ?? EDITION);
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
    saveRun(createRun(randomSeed(), name, EDITION, { blessing: true }));
    navigate("/roguelike/run");
  };

  return (
    <div
      className="mode-container"
      onClickCapture={buttonSound}
      style={{ backgroundImage: `url(${authBg})`, imageRendering: "pixelated" }}
    >
      <header className="mode-header">
        <h1 className="mode-title run-menu-title">Notte all'Osteria</h1>
        <p className="mode-subtitle">
          {tables.length} tavoli, una sola notte per fare fortuna
        </p>
      </header>

      <div className="run-menu-box ui-panel">
        <ol className="run-night" aria-label="I tavoli della notte">
          {tables.map((table, i) => {
            const state = !savedRun
              ? ""
              : i < savedRun.tableIndex || (i === savedRun.tableIndex && savedRun.phase === "shop")
                ? "is-done"
                : i === savedRun.tableIndex
                  ? "is-current"
                  : "";
            return (
              <li key={table.name} className={state}>
                <span className="run-night-dot">{table.boss ? "👑" : table.stranger ? "?" : i + 1}</span>
                <span className="run-night-name">{table.name}</span>
              </li>
            );
          })}
        </ol>

        {savedRun && (
          <button
            type="button"
            className="ui-btn ui-btn--gold"
            onClick={() => navigate("/roguelike/run")}
          >
            Continua la notte
            <span className="ui-btn-detail">
              {savedRun.phase === "shop"
                ? "In bottega"
                : savedRun.phase === "blessing"
                  ? "Il santino della nonna"
                  : `Tavolo ${savedRun.tableIndex + 1}/${tables.length}`}{" "}
              ·{" "}
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
          <label className="ui-label" htmlFor="run-hero-name">
            Il tuo nome
          </label>
          <input
            id="run-hero-name"
            className="run-name-input"
            value={heroName}
            maxLength={16}
            onChange={(e) => setHeroName(e.target.value)}
          />
          <button
            type="submit"
            className={`ui-btn ${savedRun ? "ui-btn--wood" : "ui-btn--gold"}`}
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

      {/* su itch.io c'è solo questa modalità */}
      {!ITCH && (
        <button type="button" className="mode-legal-btn" onClick={() => navigate("/")}>
          ← Scegli un'altra modalità
        </button>
      )}
    </div>
  );
}
