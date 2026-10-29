import {
  MAX_SANTINI,
  getTableConfig,
  runTables,
  type RunEvent,
  type RunState,
} from "@piatto/game-core";
import { useState } from "react";
import coinsImg from "../../assets/coins.png";
import ItemArt from "./ItemArt";
import SwapChooser from "./SwapChooser";
import { useText } from "../../i18n";

interface RunEndPanelProps {
  run: RunState;
  events: RunEvent[];
  onEnterShop: () => void;
  onChooseReward: (reward: "coins" | "santino", replace?: number) => void;
  onNewRun: () => void;
  onMenu: () => void;
}

// Pannello di fine tavolo: tavolo superato (si va in bottega), notte vinta o persa
// Il premio dell'incappucciato, a tavolo superato: una buona somma da spendere in bottega o uno dei suoi oggetti
function StrangerReward({ run, onChoose }: { run: RunState; onChoose: RunEndPanelProps["onChooseReward"] }) {
  const t = useText();
  const santino = run.strangerReward?.santino;
  // con i santini al completo il suo oggetto si prende con uno scambio, se ne restano
  const full = run.santini.length >= MAX_SANTINI;
  const blocked = full && run.swapsLeft <= 0;
  const [swapping, setSwapping] = useState(false);
  return (
    <section className="rk-reward" aria-labelledby="rk-reward-title">
      <p id="rk-reward-title" className="rk-reward-intro">
        {t.end.strangerIntro} <em>{t.end.strangerLine}</em>
      </p>
      <div className="rk-reward-options">
        <button type="button" className="ui-btn ui-btn--gold rk-reward-option" onClick={() => onChoose("coins")}>
          <span className="ui-coins rk-reward-coins">
            <img src={coinsImg} alt="" />
            {t.end.rewardCoins}
          </span>
          <span className="ui-btn-detail">{t.end.rewardCoinsDetail}</span>
        </button>
        {santino && (
          <button
            type="button"
            className="ui-btn ui-btn--wood rk-reward-option"
            disabled={blocked}
            onClick={() => (full ? setSwapping(true) : onChoose("santino"))}
            title={t.santini[santino].effect}
          >
            <ItemArt id={santino} className="rk-reward-art" />
            <span>{t.santini[santino].name}</span>
            <span className="ui-btn-detail">
              {blocked
                ? t.shop.santiniFull
                : full
                  ? t.end.rewardSwap(t.santini[santino].effect)
                  : t.santini[santino].effect}
            </span>
          </button>
        )}
      </div>
      {swapping && santino && (
        <SwapChooser
          run={run}
          incoming={santino}
          onPick={(replace) => onChoose("santino", replace)}
          onCancel={() => setSwapping(false)}
        />
      )}
    </section>
  );
}

export default function RunEndPanel({ run, events, onEnterShop, onChooseReward, onNewRun, onMenu }: RunEndPanelProps) {
  const t = useText();
  const config = getTableConfig(run);
  const tables = runTables(run);
  const split = events.find((e) => e.type === "pot_split");
  const collected = events.find((e) => e.type === "pot_collected");
  const interest = events.find((e) => e.type === "santino_triggered" && e.santino === "salvadanaio");

  // a Ti vitti: chi ha vinto e, se ha vinto l'incappucciato, cosa si è preso
  const tivitti = run.tivittiResult;
  const lines = tivitti
    ? [
        tivitti.won
          ? null
          : tivitti.stolen
            ? t.tivitti.stolenSantino(t.santini[tivitti.stolen].name)
            : tivitti.coins > 0
              ? t.tivitti.stolenCoins(tivitti.coins)
              : t.tivitti.stolenNothing,
      ].filter(Boolean)
    : [
    run.tableEndReason === "opponents_out"
      ? t.end.opponentsOut
      : run.tableEndReason === "deck_empty"
        ? t.end.deckEmpty
        : null,
    collected?.type === "pot_collected"
      ? t.end.potCollected(collected.amount)
      : split?.type === "pot_split" && split.share > 0
        ? t.end.potSplit(split.share)
        : null,
    interest?.type === "santino_triggered" && interest.amount ? t.end.interest(interest.amount) : null,
  ].filter(Boolean);

  const cleared = run.phase === "table_cleared";
  const won = run.phase === "won";
  const title = tivitti && cleared
    ? tivitti.won
      ? t.tivitti.endWon
      : t.tivitti.endLost
    : cleared
      ? t.end.cleared
      : won
        ? t.end.won
        : t.end.lost;
  const tablesCleared = won ? tables.length : run.tableIndex + (cleared ? 1 : 0);

  return (
    <div className="ui-backdrop">
      <section
        className={`ui-panel ui-pop rk-end rk-end--${(cleared && tivitti?.won !== false) || won ? "good" : "bad"}`}
        role="dialog"
        aria-labelledby="rk-end-title"
      >
        <span className="rk-end-emblem" aria-hidden="true">
          {won ? "🏆" : cleared ? (tivitti?.won === false ? "🕴️" : "🍷") : "🕯️"}
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
              {won ? t.end.closeWith : t.end.leaveWith}{" "}
              <span className="ui-coins">
                <img src={coinsImg} alt="" />
                {run.bankroll}
              </span>
              {cleared && !tivitti && t.end.quotaNote(config.quota)}
            </>
          ) : run.lossReason === "bankrupt" ? (
            t.end.bankrupt
          ) : (
            t.end.belowQuota(run.bankroll, config.quota)
          )}
        </p>

        <ol className="rk-end-track" aria-label={t.end.track(tablesCleared, tables.length)}>
          {tables.map((table, i) => (
            <li
              key={table.id}
              className={i < tablesCleared ? "is-done" : i === run.tableIndex && !cleared && !won ? "is-lost" : ""}
              title={t.tables[table.id]}
            >
              {table.boss ? "👑" : table.stranger ? "?" : i + 1}
            </li>
          ))}
        </ol>

        {cleared && run.strangerReward ? (
          <StrangerReward run={run} onChoose={onChooseReward} />
        ) : cleared ? (
          <button type="button" className="ui-btn ui-btn--gold" onClick={onEnterShop}>
            {t.end.enterShop}
            <span className="ui-btn-detail">{t.end.enterShopDetail}</span>
          </button>
        ) : (
          <div className="rk-end-actions">
            <button type="button" className="ui-btn ui-btn--gold" onClick={onNewRun}>
              {t.end.newNight}
            </button>
            <button type="button" className="ui-btn ui-btn--wood" onClick={onMenu}>
              {t.end.menu}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
