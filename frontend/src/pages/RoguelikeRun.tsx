import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getHero, type RunPlayer } from "@piatto/game-core";
import { useRunEngine } from "../hooks/useRunEngine";
import Card from "../components/Cards";
import RunPanel from "../components/run/RunPanel";
import RunShop from "../components/run/RunShop";
import RunHelp from "../components/run/RunHelp";
import RunEndPanel from "../components/run/RunEndPanel";
import { noticesFor } from "../components/run/notices";
import { CHARACTERS, SEED_SYMBOLS, SHOP_ART, sceneArt, sceneInfo, type Expression } from "../art/manifest";
import { AnchorContext, useAnchor, useAnchorRegistry } from "../scene/anchors";
import { directScene } from "../scene/cues";
import FxLayer from "../scene/FxLayer";
import AnimatedNumber from "../scene/AnimatedNumber";
import Portrait from "../scene/Portrait";
import piattoImg from "../assets/piatto.png";
import coinsImg from "../assets/coins.png";
import "../styles/RunScene.css";

// Per quanto restano visibili esito, scritte ed espressioni dopo ogni mossa
const OUTCOME_DURATION = 2500;

// Le bottiglie sulla mensola del bar, finché non arriva il fondale disegnato
const BOTTLES = ["#2f8f5b", "#c8372d", "#f2c14e", "#5aa0d8", "#6b1f33", "#2f8f5b", "#e85a4b"];

interface SeatProps {
  player: RunPlayer;
  active: boolean;
  expression: Expression;
}

// Un avversario seduto di fronte, dall'altra parte del tavolo: le sue monete stanno sul bordo del tavolo
function OpponentSeat({ player, active, expression }: SeatProps) {
  const anchor = useAnchor(player.id);
  const out = player.status !== "playing";
  return (
    <li
      className={`rk-seat${active ? " is-active" : ""}${out ? " is-out" : ""}`}
      title={CHARACTERS[player.character]?.tagline}
    >
      <Portrait character={player.character} expression={out ? "sad" : expression} size="bust" />
      <span ref={anchor} className="rk-seat-plate">
        <span className="rk-seat-name">{player.username}</span>
        {out ? (
          <span className="rk-seat-out">fuori</span>
        ) : (
          <span className="ui-coins">
            <img src={coinsImg} alt="" />
            <AnimatedNumber value={player.balance} />
          </span>
        )}
      </span>
    </li>
  );
}

function PotView({ piatto }: { piatto: number }) {
  const anchor = useAnchor("pot");
  return (
    <div ref={anchor} className="rk-pot" aria-label={`Piatto: ${piatto} monete`}>
      <img src={piattoImg} alt="" className="rk-pot-plate" />
      <span className="ui-coins rk-pot-amount">
        <img src={coinsImg} alt="" />
        <AnimatedNumber value={piatto} />
      </span>
    </div>
  );
}

export default function RoguelikeRun() {
  const navigate = useNavigate();
  const { run, events, moveId, play, nextTable, enterShop, buy, reroll, peek, consume, startNewRun } =
    useRunEngine();
  const registry = useAnchorRegistry();
  const [helpOpen, setHelpOpen] = useState(false);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const sceneRef = useCallback(
    (el: HTMLElement | null) => {
      if (el) registry.set("scene", el);
      else registry.delete("scene");
    },
    [registry],
  );

  // esito, scritte ed espressioni restano visibili per qualche secondo dopo ogni mossa
  const [hiddenMoveId, setHiddenMoveId] = useState(-1);
  useEffect(() => {
    const timer = window.setTimeout(() => setHiddenMoveId(moveId), OUTCOME_DURATION);
    return () => window.clearTimeout(timer);
  }, [moveId]);

  const direction = useMemo(
    () => (run ? directScene(events, run) : { cues: [], expressions: {} }),
    [events, run],
  );

  if (!run) return <Navigate to="/roguelike" replace />;

  if (run.phase === "shop") {
    return (
      <AnchorContext.Provider value={registry}>
        <div
          className={`rk-screen rk-screen--shop${SHOP_ART ? " rk-screen--shop-art" : ""}`}
          style={SHOP_ART ? ({ "--scene-art": `url(${SHOP_ART})` } as CSSProperties) : undefined}
        >
          <RunShop run={run} onBuy={buy} onReroll={reroll} onNextTable={nextTable} />
          <FxLayer cues={direction.cues} moveId={moveId} registry={registry} />
        </div>
      </AnchorContext.Provider>
    );
  }

  const { players, piatto, currentTurn, deck } = run.table;
  const atTable = run.phase === "table";
  const current = players[currentTurn];
  const heroTurn = atTable && Boolean(current?.hero);
  const recent = hiddenMoveId !== moveId;
  const expressions = recent ? direction.expressions : {};
  const notices = recent ? noticesFor(events, run) : [];
  const opponents = players.filter((p) => !p.hero);
  const scene = sceneInfo(run.tableIndex);
  const art = sceneArt(run.tableIndex);
  const sceneStyle = {
    "--scene-wall": scene.wall,
    "--scene-wainscot": scene.wainscot,
    "--scene-lamp": scene.lamp,
    ...(art ? { "--scene-art": `url(${art})` } : {}),
  } as CSSProperties;

  return (
    <AnchorContext.Provider value={registry}>
      <div className="rk-screen" style={sceneStyle}>
        <RunPanel
          run={run}
          heroTurn={heroTurn}
          expression={expressions[getHero(run).id] ?? "neutral"}
          waitingFor={atTable && current && !current.hero ? current.username : null}
          onPlay={play}
          onPeek={peek}
          onConsume={consume}
          onHelp={() => setHelpOpen(true)}
          onMenu={() => navigate("/roguelike")}
        />

        <main ref={sceneRef} className="rk-stage">
          {/* livelli della scena, dal fondo al primo piano: fondale, oggetti, personaggi, tavolo, luce */}
          <div className={`rk-layer rk-backdrop${art ? " rk-backdrop--art" : ""}`} aria-hidden="true" />
          <div className="rk-layer rk-props" aria-hidden="true">
            {!art && (
              <span className="rk-shelf">
                {BOTTLES.map((color, i) => (
                  <span key={i} className="rk-bottle" style={{ "--bottle": color } as CSSProperties} />
                ))}
              </span>
            )}
            <span className="rk-lamp" />
            <span className="rk-smoke rk-smoke--1" />
            <span className="rk-smoke rk-smoke--2" />
          </div>

          <div className="rk-room">
            <ul className="rk-opponents" aria-label="Avversari">
              {opponents.map((player) => (
                <OpponentSeat
                  key={player.id}
                  player={player}
                  active={atTable && current?.id === player.id}
                  expression={expressions[player.id] ?? "neutral"}
                />
              ))}
            </ul>

            {/* il tavolo visto da chi è seduto: il bordo vicino esce dallo schermo */}
            <div className="rk-table">
              <div className="rk-felt">
                <div className="rk-deck" aria-label={`${deck.length} carte nel mazzo`}>
                  <span className="rk-deck-stack">
                    <img src="/cards/back.png" alt="" />
                  </span>
                  <span className="ui-label rk-deck-count">
                    {deck.length === 1 ? "ultima carta" : `${deck.length} carte`}
                  </span>
                </div>

                <PotView piatto={piatto} />

                <div className="rk-drawn">
                  {run.lastDraw ? (
                    <Card
                      key={`${run.tableIndex}-${run.draws}`}
                      seed={run.lastDraw.card.seed}
                      value={run.lastDraw.card.value}
                      reveal
                    />
                  ) : (
                    <span className="rk-drawn-empty ui-label">la prima carta</span>
                  )}
                  {run.peeked && (
                    <span className="rk-peeked" title="La prossima carta, vista con la Coppola del nonno">
                      <span className="ui-label">prossima</span>
                      <span className="rk-mini-card">
                        {run.peeked.value}
                        <span aria-label={run.peeked.seed}>{SEED_SYMBOLS[run.peeked.seed]}</span>
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {notices.length > 0 && (
            <ul key={moveId} className="rk-notices" role="status">
              {notices.slice(0, 3).map((notice, i) => (
                <li key={i} className={`rk-notice rk-notice--${notice.tone}`} style={{ animationDelay: `${i * 120}ms` }}>
                  {notice.text}
                </li>
              ))}
            </ul>
          )}

          <div className="rk-layer rk-light" aria-hidden="true" />
        </main>

        <FxLayer cues={direction.cues} moveId={moveId} registry={registry} />

        {!atTable && (
          <RunEndPanel
            run={run}
            events={events}
            onEnterShop={enterShop}
            onNewRun={() => startNewRun(run.heroName)}
            onMenu={() => navigate("/roguelike")}
          />
        )}
        {helpOpen && <RunHelp run={run} onClose={closeHelp} />}
      </div>
    </AnchorContext.Provider>
  );
}
