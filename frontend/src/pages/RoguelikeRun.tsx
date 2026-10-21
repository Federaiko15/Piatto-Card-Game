import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  RUN_TABLES,
  getHero,
  getTableConfig,
  maxHeroBet,
  type RunEvent,
  type RunState,
} from "@piatto/game-core";
import { useRunEngine } from "../hooks/useRunEngine";
import PlayerSeat from "../components/PlayerSeat";
import Card from "../components/Cards";
import BetControls from "../components/BetControls";
import OpponentsStrip from "../components/OpponentsStrip";
import piattoImg from "../assets/piatto.png";
import croupierImg from "../assets/croupier.png";
import coinsImg from "../assets/coins.png";
import tableBg from "../assets/table.png";
import "../styles/GameRoom.css";
import "../styles/OfflineTable.css";
import "../styles/Roguelike.css";

// Eroe in basso al centro, avversari intorno al tavolo (stesse posizioni del tavolo offline)
const SEAT_POSITIONS = ["bottom-center", "low-right", "low-left", "mid-right", "mid-left"];

const OUTCOME_DURATION = 2500;

// Avviso sul tavolo per le regole che il giocatore potrebbe non aspettarsi
const noticeFor = (events: RunEvent[], run: RunState): string | null => {
  const nameOf = (id: string) =>
    run.table.players.find((p) => p.id === id)?.username ?? id;
  for (const event of events) {
    if (event.type === "pot_refilled") {
      const out = event.eliminated.map(nameOf);
      return `Piatto vuoto! Tutti rimettono la posta: ora ci sono ${event.amount} monete.${
        out.length ? ` Non può pagare ed esce: ${out.join(", ")}.` : ""
      }`;
    }
  }
  return null;
};

export default function RoguelikeRun() {
  const navigate = useNavigate();
  const { run, events, moveId, play, nextTable, startNewRun } = useRunEngine();

  // esito della pescata e avvisi restano visibili per qualche secondo dopo ogni mossa
  const [hiddenMoveId, setHiddenMoveId] = useState(-1);
  useEffect(() => {
    const timer = window.setTimeout(() => setHiddenMoveId(moveId), OUTCOME_DURATION);
    return () => window.clearTimeout(timer);
  }, [moveId]);

  if (!run) return <Navigate to="/roguelike" replace />;

  const config = getTableConfig(run);
  const hero = getHero(run);
  const { players, piatto, currentTurn, deck } = run.table;
  const atTable = run.phase === "table";
  const heroTurn = atTable && players[currentTurn]?.hero;
  const recent = hiddenMoveId !== moveId;
  const lastDraw = recent ? run.lastDraw : null;
  const drawer = lastDraw && players.find((p) => p.id === lastDraw.playerId);
  const notice = recent ? noticeFor(events, run) : null;
  const quotaProgress = Math.min(100, Math.round((hero.balance / config.quota) * 100));

  return (
    <div className="game-room-container offline-theme run-theme">
      <div className="offline-header run-header">
        <button
          type="button"
          onClick={() => navigate("/roguelike")}
          className="btn-leave"
          title="La notte resta salvata"
        >
          Menu
        </button>

        <div className="run-hud">
          <span className="run-hud-step">
            Tavolo {run.tableIndex + 1}/{RUN_TABLES.length}
          </span>
          <span className="run-hud-name">
            {config.boss && "👑 "}
            {config.name}
          </span>
        </div>
      </div>

      <OpponentsStrip players={players} heroId={hero.id} currentTurn={currentTurn} />

      <div className="poker-table offline-table with-strip">
        <img src={tableBg} alt="" className="table-background-image" />

        {/* ESITO DELL'ULTIMA PESCATA (smartphone) */}
        {lastDraw && drawer && (
          <div key={moveId} className={`mobile-turn-banner banner-${lastDraw.outcome}`}>
            <span className="banner-icon">{lastDraw.outcome === "win" ? "🎉" : "💸"}</span>
            <span className="banner-text">
              <strong>{drawer.hero ? "Tu" : drawer.username}</strong>{" "}
              {lastDraw.outcome === "win"
                ? `${drawer.hero ? "prendi" : "prende"}`
                : `${drawer.hero ? "lasci" : "lascia"}`}{" "}
              <strong>{lastDraw.bet}</strong> monete
            </span>
          </div>
        )}

        {notice && (
          <div key={`notice-${moveId}`} className="run-notice" role="status">
            {notice}
          </div>
        )}

        {/* CROUPIER E CARTA */}
        <div className="grid-cell high-center">
          <div className="table-high-center">
            <img src={croupierImg} alt="Croupier" className="pixel-image croupier-img" />
            {run.lastDraw && (
              <div className="card-display">
                <Card
                  key={`${run.tableIndex}-${run.draws}`}
                  seed={run.lastDraw.card.seed}
                  value={run.lastDraw.card.value}
                  reveal
                />
              </div>
            )}
          </div>
        </div>

        {/* PIATTO E MAZZO */}
        <div className="grid-cell mid-center">
          <div className="table-center">
            <div className="piatto-container">
              <img src={piattoImg} alt="Piatto" className="pixel-image piatto-img" />
            </div>
            <div className="pot-container">
              <p className="paragraph-coin">
                <span className="pot-amount">{piatto}</span>
                <img src={coinsImg} alt="Monete nel piatto" className="pixel-coins" />
              </p>
            </div>
            <p className="run-deck-count">
              {deck.length === 1 ? "Ultima carta nel mazzo" : `${deck.length} carte nel mazzo`}
            </p>
          </div>
        </div>

        {/* GIOCATORI */}
        {players.map((player, index) => {
          const isHero = player.hero;
          const outcome =
            lastDraw && lastDraw.playerId === player.id
              ? {
                  text: `${lastDraw.outcome === "win" ? "+" : "−"}${lastDraw.bet}`,
                  type: lastDraw.outcome,
                }
              : null;

          return (
            <div key={player.id} className={`grid-cell ${SEAT_POSITIONS[index]}`}>
              <div className="seat-wrapper">
                {heroTurn && isHero && (
                  <div className="my-turn-alert">È il tuo turno!</div>
                )}

                <PlayerSeat
                  player={player}
                  isHero={isHero}
                  isActive={atTable && currentTurn === index}
                  lastOutcome={outcome}
                />

                {isHero && (
                  <div
                    className={`quota-meter${hero.balance >= config.quota ? " quota-meter--met" : ""}`}
                    aria-label={`Quota del tavolo: ${hero.balance} su ${config.quota}`}
                  >
                    <span className="quota-meter-label">
                      Quota {hero.balance}/{config.quota}
                      {hero.balance >= config.quota && " ✓"}
                    </span>
                    <span className="quota-meter-bar">
                      <span style={{ width: `${quotaProgress}%` }} />
                    </span>
                  </div>
                )}

                {isHero && heroTurn && (
                  <BetControls
                    key={run.tableIndex}
                    max={maxHeroBet(run)}
                    potIsMax={piatto <= hero.balance}
                    initialBet={Math.max(1, Math.floor(hero.balance / 10))}
                    onConfirm={play}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!atTable && (
        <RunResultPanel
          run={run}
          events={events}
          onNextTable={nextTable}
          onNewRun={() => startNewRun(run.heroName)}
          onMenu={() => navigate("/roguelike")}
        />
      )}
    </div>
  );
}

interface RunResultPanelProps {
  run: RunState;
  events: RunEvent[];
  onNextTable: () => void;
  onNewRun: () => void;
  onMenu: () => void;
}

// Pannello di fine tavolo: tavolo superato (con l'anteprima del prossimo), notte vinta o persa
function RunResultPanel({ run, events, onNextTable, onNewRun, onMenu }: RunResultPanelProps) {
  const config = getTableConfig(run);
  const split = events.find((e) => e.type === "pot_split");
  const collected = events.find((e) => e.type === "pot_collected");

  const endLine =
    run.tableEndReason === "opponents_out"
      ? "Hai lasciato tutti gli avversari senza monete!"
      : run.tableEndReason === "deck_empty"
        ? "Il mazzo è finito."
        : null;
  const potLine = collected
    ? `Il piatto è tuo: +${collected.amount} monete.`
    : split && split.share > 0
      ? `Il piatto rimasto si divide: ${split.share} monete a testa.`
      : null;

  if (run.phase === "table_cleared") {
    const next = RUN_TABLES[run.tableIndex + 1];
    return (
      <div className="run-panel-backdrop">
        <div className="run-panel" role="dialog" aria-labelledby="run-panel-title">
          <h2 id="run-panel-title" className="run-panel-title">
            Tavolo superato!
          </h2>
          {endLine && <p>{endLine}</p>}
          {potLine && <p>{potLine}</p>}
          <p className="run-panel-coins">
            Ti alzi con <strong>{run.bankroll}</strong> monete (quota {config.quota})
          </p>

          <div className="run-next-table">
            <span className="run-next-label">Prossimo tavolo</span>
            <span className="run-next-name">
              {next.boss && "👑 "}
              {next.name}
            </span>
            <span className="run-next-detail">
              Posta {next.ante} · Quota {next.quota}
            </span>
            <span className="run-next-detail">
              Al tavolo: {next.opponents.map((o) => o.name).join(", ")}
            </span>
          </div>

          <button type="button" className="run-btn-primary" onClick={onNextTable}>
            Siediti al tavolo
          </button>
        </div>
      </div>
    );
  }

  const won = run.phase === "won";
  const tablesCleared = won ? RUN_TABLES.length : run.tableIndex;
  return (
    <div className="run-panel-backdrop">
      <div className="run-panel" role="dialog" aria-labelledby="run-panel-title">
        <h2 id="run-panel-title" className="run-panel-title">
          {won ? "Hai sbancato l'osteria! 🏆" : "La notte finisce qui"}
        </h2>
        {endLine && <p>{endLine}</p>}
        {potLine && <p>{potLine}</p>}
        <p className="run-panel-coins">
          {won
            ? `Chiudi la notte con ${run.bankroll} monete.`
            : run.lossReason === "bankrupt"
              ? "Sei rimasto senza monete."
              : `Ti alzi con ${run.bankroll} monete, ma la quota era ${config.quota}.`}
        </p>
        <p>
          Tavoli superati: {tablesCleared}/{RUN_TABLES.length}
        </p>
        <div className="run-panel-actions">
          <button type="button" className="run-btn-primary" onClick={onNewRun}>
            Nuova notte
          </button>
          <button type="button" className="run-btn-secondary" onClick={onMenu}>
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
