import { RUN_TABLES, getTableConfig, type RunEvent, type RunState } from "@piatto/game-core";
import coinsImg from "../../assets/coins.png";

interface RunEndPanelProps {
  run: RunState;
  events: RunEvent[];
  onEnterShop: () => void;
  onNewRun: () => void;
  onMenu: () => void;
}

// Pannello di fine tavolo: tavolo superato (si va in bottega), notte vinta o persa
export default function RunEndPanel({ run, events, onEnterShop, onNewRun, onMenu }: RunEndPanelProps) {
  const config = getTableConfig(run);
  const split = events.find((e) => e.type === "pot_split");
  const collected = events.find((e) => e.type === "pot_collected");
  const interest = events.find((e) => e.type === "santino_triggered" && e.santino === "salvadanaio");

  const lines = [
    run.tableEndReason === "opponents_out"
      ? "Hai lasciato tutti gli avversari senza monete!"
      : run.tableEndReason === "deck_empty"
        ? "Il mazzo è finito."
        : null,
    collected?.type === "pot_collected"
      ? `Il piatto è tuo: +${collected.amount} monete.`
      : split?.type === "pot_split" && split.share > 0
        ? `Il piatto rimasto si divide: ${split.share} monete a testa.`
        : null,
    interest?.type === "santino_triggered" && interest.amount
      ? `Salvadanaio: +${interest.amount} monete di interessi.`
      : null,
  ].filter(Boolean);

  const cleared = run.phase === "table_cleared";
  const won = run.phase === "won";
  const title = cleared ? "Tavolo superato!" : won ? "Hai sbancato l'osteria!" : "La notte finisce qui";
  const tablesCleared = won ? RUN_TABLES.length : run.tableIndex + (cleared ? 1 : 0);

  return (
    <div className="ui-backdrop">
      <section
        className={`ui-panel ui-pop rk-end rk-end--${cleared || won ? "good" : "bad"}`}
        role="dialog"
        aria-labelledby="rk-end-title"
      >
        <span className="rk-end-emblem" aria-hidden="true">
          {won ? "🏆" : cleared ? "🍷" : "🕯️"}
        </span>
        <h2 id="rk-end-title" className="ui-title rk-end-title">
          {title}
        </h2>
        {lines.map((line) => (
          <p key={line} className="rk-end-line">
            {line}
          </p>
        ))}

        <p className="rk-end-coins">
          {cleared || won ? (
            <>
              {won ? "Chiudi la notte con" : "Ti alzi con"}{" "}
              <span className="ui-coins">
                <img src={coinsImg} alt="" />
                {run.bankroll}
              </span>
              {cleared && ` (quota ${config.quota})`}
            </>
          ) : run.lossReason === "bankrupt" ? (
            "Sei rimasto senza monete."
          ) : (
            `Ti alzi con ${run.bankroll} monete, ma la quota era ${config.quota}.`
          )}
        </p>

        <ol className="rk-end-track" aria-label={`Tavoli superati: ${tablesCleared} su ${RUN_TABLES.length}`}>
          {RUN_TABLES.map((table, i) => (
            <li
              key={table.name}
              className={i < tablesCleared ? "is-done" : i === run.tableIndex && !cleared && !won ? "is-lost" : ""}
              title={table.name}
            >
              {table.boss ? "👑" : i + 1}
            </li>
          ))}
        </ol>

        {cleared ? (
          <button type="button" className="ui-btn ui-btn--gold" onClick={onEnterShop}>
            Entra in bottega
            <span className="ui-btn-detail">Santini e consumabili prima del prossimo tavolo</span>
          </button>
        ) : (
          <div className="rk-end-actions">
            <button type="button" className="ui-btn ui-btn--gold" onClick={onNewRun}>
              Nuova notte
            </button>
            <button type="button" className="ui-btn ui-btn--wood" onClick={onMenu}>
              Menu
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
