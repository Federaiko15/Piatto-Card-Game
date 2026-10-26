import {
  TABLE_MODIFIERS,
  getHero,
  getTableConfig,
  maxHeroBet,
  runTables,
  type ConsumableId,
  type FoodId,
  type RunState,
} from "@piatto/game-core";
import BetControls from "../BetControls";
import RunFortune from "./RunFortune";
import { MODIFIER_ICONS, type Expression } from "../../art/manifest";
import { useAnchor } from "../../scene/anchors";
import AnimatedNumber from "../../scene/AnimatedNumber";
import Portrait from "../../scene/Portrait";
import { useText } from "../../i18n";
import coinsImg from "../../assets/coins.png";

interface RunPanelProps {
  run: RunState;
  heroTurn: boolean;
  expression: Expression;
  waitingFor: string | null;
  onPlay: (amount: number) => void;
  onPeek: () => void;
  onConsume: (item: ConsumableId) => void;
  onEat: (food: FoodId) => void;
  onHelp: () => void;
  onMenu: () => void;
}

// Il pannello a sinistra, come in Balatro: il tavolo e le sue regole, monete e quota, la puntata,
// poi santini, consumabili e cibi. Su smartphone le sue sezioni si dispongono sopra e sotto la scena.
export default function RunPanel({
  run,
  heroTurn,
  expression,
  waitingFor,
  onPlay,
  onPeek,
  onConsume,
  onEat,
  onHelp,
  onMenu,
}: RunPanelProps) {
  const t = useText();
  const hero = getHero(run);
  const anchor = useAnchor(hero.id);
  const config = getTableConfig(run);
  const progress = Math.min(100, Math.round((hero.balance / config.quota) * 100));
  const met = hero.balance >= config.quota;
  const halfPot = run.modifiers.includes("niente_piatto");

  return (
    <aside className="rk-panel" aria-label={t.panel.label}>
      <div className="rk-panel-top">
        <button
          type="button"
          className="ui-btn ui-btn--wood ui-btn--small"
          onClick={onMenu}
          title={t.panel.menuTitle}
        >
          {t.panel.menu}
        </button>
        <button
          type="button"
          className="ui-btn ui-btn--wood ui-btn--small rk-help-btn"
          onClick={onHelp}
          aria-label={t.panel.help}
        >
          ?
        </button>
      </div>

      <section className={`rk-blind${config.boss ? " rk-blind--boss" : ""}`}>
        <span className="ui-label">
          {t.panel.tableOf(run.tableIndex + 1, runTables(run).length)}
          {config.boss && t.panel.boss}
        </span>
        <h1 className="rk-blind-name">{t.tables[config.id]}</h1>
        {run.modifiers.length > 0 && (
          <ul className="rk-rules">
            {run.modifiers.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={`rk-rule rk-rule--${TABLE_MODIFIERS[id].kind}`}
                  onClick={onHelp}
                  title={t.modifiers[id].effect}
                >
                  <span className="rk-rule-icon" aria-hidden="true">
                    {MODIFIER_ICONS[id]}
                  </span>
                  <span className="rk-rule-text">
                    <span className="rk-rule-name">{t.modifiers[id].name}</span>
                    <span className="rk-rule-effect">{t.modifiers[id].effect}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rk-status" aria-label={t.panel.status(hero.balance, config.quota)}>
        <div ref={anchor} className="rk-stat rk-stat--coins">
          <Portrait character="hero" expression={expression} size="small" />
          <span className="rk-stat-text">
            <span className="ui-label">{run.heroName}</span>
            <span className="ui-coins rk-stat-value">
              <img src={coinsImg} alt="" />
              <AnimatedNumber value={hero.balance} />
            </span>
          </span>
        </div>
        <div className={`rk-stat rk-stat--quota${met ? " is-met" : ""}`}>
          <span className="ui-label">{t.panel.quota} {met && "✓"}</span>
          <span className="rk-stat-value">{config.quota}</span>
        </div>
        <span className={`ui-meter rk-status-meter${met ? " ui-meter--done" : ""}`}>
          <span style={{ width: `${progress}%` }} />
        </span>
      </section>

      <section className={`rk-action${heroTurn ? " is-active" : ""}`} aria-label={t.panel.betLabel}>
        {heroTurn ? (
          <BetControls
            key={run.tableIndex}
            max={maxHeroBet(run)}
            potIsMax={!halfPot && run.table.piatto <= hero.balance}
            limitLabel={halfPot ? t.panel.halfPotLimit : undefined}
            text={t.bet}
            initialBet={Math.max(1, Math.floor(hero.balance / 10))}
            onConfirm={onPlay}
          />
        ) : (
          <p className="rk-waiting">{waitingFor ? t.panel.waiting(waitingFor) : t.panel.closed}</p>
        )}
      </section>

      <RunFortune run={run} heroTurn={heroTurn} onPeek={onPeek} onConsume={onConsume} onEat={onEat} />
    </aside>
  );
}
