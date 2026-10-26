import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRun, editionTables, getHero, randomSeed } from "@piatto/game-core";
import { EDITION, ITCH } from "../edition";
import { LANGS, setLang, useLang, useText } from "../i18n";
import { buttonSound } from "../audio/sfx";
import authBg from "../assets/auth.png";
import { loadHeroName, loadRun, saveHeroName, saveRun } from "../services/runStorage";
import "../styles/ModeSelect.css";
import "../styles/Roguelike.css";


export default function RoguelikeMenu() {
  const navigate = useNavigate();
  const t = useText();
  const lang = useLang();
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
    const name = heroName.trim() || t.menu.defaultName;
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
        <h1 className="mode-title run-menu-title">{t.menu.title}</h1>
        <p className="mode-subtitle">{t.menu.subtitle(tables.length)}</p>
        <div className="run-lang" role="group" aria-label={t.menu.language}>
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              className={`run-lang-btn${code === lang ? " is-active" : ""}`}
              aria-pressed={code === lang}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="run-menu-box ui-panel">
        <ol className="run-night" aria-label={t.menu.nightLabel}>
          {tables.map((table, i) => {
            const state = !savedRun
              ? ""
              : i < savedRun.tableIndex || (i === savedRun.tableIndex && savedRun.phase === "shop")
                ? "is-done"
                : i === savedRun.tableIndex
                  ? "is-current"
                  : "";
            return (
              <li key={table.id} className={state}>
                <span className="run-night-dot">{table.boss ? "👑" : table.stranger ? "?" : i + 1}</span>
                <span className="run-night-name">{t.tables[table.id]}</span>
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
            {t.menu.continue}
            <span className="ui-btn-detail">
              {savedRun.phase === "shop"
                ? t.menu.inShop
                : savedRun.phase === "blessing"
                  ? t.menu.inBlessing
                  : t.menu.atTable(savedRun.tableIndex + 1, tables.length)}
              {" · "}
              {t.coins(savedRun.phase === "table" ? getHero(savedRun).balance : savedRun.bankroll)}
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
            {t.menu.nameLabel}
          </label>
          <input
            id="run-hero-name"
            className="run-name-input"
            value={heroName}
            placeholder={t.menu.defaultName}
            maxLength={16}
            onChange={(e) => setHeroName(e.target.value)}
          />
          <button
            type="submit"
            className={`ui-btn ${savedRun ? "ui-btn--wood" : "ui-btn--gold"}`}
          >
            {confirmingNew ? t.menu.confirmNew : t.menu.newNight}
          </button>
        </form>

        <details className="run-rules" open={!savedRun}>
          <summary>{t.menu.howToPlay}</summary>
          <ul>
            {t.menu.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </details>
      </div>

      {/* su itch.io c'è solo questa modalità */}
      {!ITCH && (
        <button type="button" className="mode-legal-btn" onClick={() => navigate("/")}>
          {t.menu.otherModes}
        </button>
      )}
    </div>
  );
}
