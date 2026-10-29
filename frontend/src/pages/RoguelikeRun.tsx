import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { cardsLeft, getHero, getTableConfig, runTables, type RunPlayer } from "@piatto/game-core";
import { useRunEngine } from "../hooks/useRunEngine";
import Card from "../components/Cards";
import RunPanel from "../components/run/RunPanel";
import RunShop from "../components/run/RunShop";
import RunHelp from "../components/run/RunHelp";
import RunEndPanel from "../components/run/RunEndPanel";
import RunBlessing from "../components/run/RunBlessing";
import TiVittiBoard from "../components/run/TiVittiBoard";
import { noticesFor } from "../components/run/notices";
import { characterText, useText } from "../i18n";
import { CARD_BACK, SEED_SYMBOLS, SHOP_ART, sceneArt, sceneInfo, tableArt, type Expression } from "../art/manifest";
import { AnchorContext, useAnchor, useAnchorRegistry } from "../scene/anchors";
import { directScene } from "../scene/cues";
import FxLayer from "../scene/FxLayer";
import { tableZoom, useTableFarEdge } from "../scene/tableEdge";
import { buttonSound } from "../audio/sfx";
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
  host: boolean;
  cards: number | null; // a Ti vitti contano le carte che gli restano, non le monete
}

// Un avversario seduto di fronte, dall'altra parte del tavolo: le sue monete stanno sul bordo del tavolo
function OpponentSeat({ player, active, expression, host, cards }: SeatProps) {
  const t = useText();
  const anchor = useAnchor(player.id);
  const character = characterText(t, player.character);
  const out = player.status !== "playing";
  return (
    <li
      className={`rk-seat${active ? " is-active" : ""}${out ? " is-out" : ""}${host ? " is-host" : ""}`}
      title={character.tagline}
    >
      <Portrait character={player.character} expression={out ? "sad" : expression} size="bust" />
      <span ref={anchor} className="rk-seat-plate">
        <span className="rk-seat-name">{character.name}</span>
        {out ? (
          <span className="rk-seat-out">{t.scene.out}</span>
        ) : cards !== null ? (
          <span className="rk-seat-cards">{t.tivitti.count(cards)}</span>
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

// Al tavolo del boss il padrone di casa (il primo avversario della configurazione) siede al centro, di fronte
// al giocatore; l'ordine dei turni resta quello del motore, cambia solo dove stanno seduti
function seatingOrder(opponents: RunPlayer[], boss?: boolean): { seats: RunPlayer[]; host: RunPlayer | null } {
  if (!boss || opponents.length < 3) return { seats: opponents, host: null };
  const [host, ...others] = opponents;
  const middle = Math.floor(others.length / 2);
  return { seats: [...others.slice(0, middle), host, ...others.slice(middle)], host };
}

function PotView({ piatto }: { piatto: number }) {
  const t = useText();
  const anchor = useAnchor("pot");
  return (
    <div ref={anchor} className="rk-pot" aria-label={t.scene.pot(piatto)}>
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
  // finché le regole sono aperte gli avversari aspettano
  const [helpOpen, setHelpOpen] = useState(false);
  const {
    run,
    events,
    moveId,
    play,
    nextTable,
    enterShop,
    buy,
    reroll,
    peek,
    consume,
    eat,
    chooseBlessing,
    chooseReward,
    tivitti,
    startNewRun,
  } = useRunEngine(helpOpen);
  const registry = useAnchorRegistry();
  const t = useText();
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  // sedendosi in cantina si aprono le regole di Ti vitti, un gioco che quasi nessuno conosce
  const sitDown = useCallback(() => {
    if (run && runTables(run)[run.tableIndex + 1]?.game === "tivitti") setHelpOpen(true);
    nextTable();
  }, [run, nextTable]);
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
  const farEdge = useTableFarEdge(run ? tableArt(run.tableIndex) : undefined);

  if (!run) return <Navigate to="/roguelike" replace />;

  // la scelta del santino della nonna, sopra il fondale del primo tavolo
  if (run.phase === "blessing") {
    const firstArt = sceneArt(0);
    return (
      <div
        className={`rk-screen rk-screen--shop${firstArt ? " rk-screen--shop-art" : ""}`}
        onClickCapture={buttonSound}
        style={firstArt ? ({ "--scene-art": `url(${firstArt})` } as CSSProperties) : undefined}
      >
        <RunBlessing run={run} onChoose={chooseBlessing} />
      </div>
    );
  }

  if (run.phase === "shop") {
    return (
      <AnchorContext.Provider value={registry}>
        <div
          className={`rk-screen rk-screen--shop${SHOP_ART ? " rk-screen--shop-art" : ""}`}
          onClickCapture={buttonSound}
          style={SHOP_ART ? ({ "--scene-art": `url(${SHOP_ART})` } as CSSProperties) : undefined}
        >
          <RunShop run={run} onBuy={buy} onReroll={reroll} onNextTable={sitDown} />
          <FxLayer cues={direction.cues} moveId={moveId} registry={registry} />
        </div>
      </AnchorContext.Provider>
    );
  }

  const { players, piatto, currentTurn, deck } = run.table;
  const atTable = run.phase === "table";
  // in cantina si gioca a Ti vitti: il turno è quello della sua partita, non quello del piatto.
  // A partita finita il tavolo resta quello di Ti vitti, dietro al pannello di fine tavolo
  const game = run.tivitti;
  const current = game ? players.find((p) => p.hero === (game.turn === 0)) : players[currentTurn];
  const heroTurn = atTable && !game && Boolean(current?.hero);
  const recent = hiddenMoveId !== moveId;
  const expressions = recent ? direction.expressions : {};
  const notices = recent ? noticesFor(events, run, t) : [];
  const { seats: opponents, host } = seatingOrder(
    players.filter((p) => !p.hero),
    getTableConfig(run).boss,
  );
  const scene = sceneInfo(run.tableIndex);
  const art = sceneArt(run.tableIndex);
  const table = tableArt(run.tableIndex);
  const sceneStyle = {
    "--scene-wall": scene.wall,
    "--scene-wainscot": scene.wainscot,
    "--scene-lamp": scene.lamp,
    ...(art ? { "--scene-art": `url(${art})` } : {}),
    ...(table ? { "--table-art": `url(${table})` } : {}),
    // finché il disegno del tavolo non è misurato valgono i valori del tavolo fatto in CSS
    ...(farEdge ? { "--table-far": farEdge, "--table-zoom": tableZoom(farEdge) } : {}),
  } as CSSProperties;

  return (
    <AnchorContext.Provider value={registry}>
      <div className="rk-screen" style={sceneStyle} onClickCapture={buttonSound}>
        <RunPanel
          run={run}
          heroTurn={heroTurn}
          expression={expressions[getHero(run).id] ?? "neutral"}
          waitingFor={atTable && current && !current.hero ? characterText(t, current.character).name : null}
          onPlay={play}
          onPeek={peek}
          onConsume={consume}
          onEat={eat}
          onTiVitti={() => tivitti({ type: "ti_vitti" })}
          onHelp={() => setHelpOpen(true)}
          onMenu={() => navigate("/roguelike")}
        />

        {/* la luce della lampada sui personaggi: bianchi e grigi virano al caldo, il contorno nero diventa marrone scuro */}
        <svg className="rk-filters" aria-hidden="true">
          <filter id="rk-lamp-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.95 0.10 0.02 0 0.07
                      0.05 0.82 0.05 0 0.035
                      0.02 0.08 0.62 0 0.015
                      0    0    0    1 0"
            />
          </filter>
        </svg>

        <main ref={sceneRef} className="rk-stage">
          {/* livelli della scena, dal fondo al primo piano: fondale, oggetti, personaggi, tavolo, luce */}
          <div
            className={`rk-layer rk-backdrop${art ? " rk-backdrop--art" : ""}${table ? " rk-backdrop--full" : ""}`}
            aria-hidden="true"
          />
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
            <ul
              className={`rk-opponents${host ? " rk-opponents--boss" : ""}`}
              aria-label={t.scene.opponents}
              style={{ "--seats": opponents.length } as CSSProperties}
            >
              {opponents.map((player) => (
                <OpponentSeat
                  key={player.id}
                  player={player}
                  active={atTable && (!game || game.winner === null) && current?.id === player.id}
                  expression={expressions[player.id] ?? "neutral"}
                  host={player.id === host?.id}
                  cards={game ? cardsLeft(game.hands[1]) + (game.turn === 1 && game.flipped ? 1 : 0) : null}
                />
              ))}
            </ul>

            {/* il tavolo visto da chi è seduto: il bordo vicino esce dallo schermo */}
            <div className={`rk-table${table ? " rk-table--art" : ""}`}>
              <div className={`rk-felt${game ? " rk-felt--tivitti" : ""}`}>
                {game ? (
                  <TiVittiBoard
                    game={game}
                    events={events}
                    opponentName={characterText(t, opponents[0]?.character ?? "incappucciato").name}
                    onMove={tivitti}
                  />
                ) : (
                <>
                <div className="rk-deck" aria-label={t.scene.deck(deck.length)}>
                  <span
                    className="rk-deck-stack"
                    style={{ "--card-back": `url(${CARD_BACK})` } as CSSProperties}
                  >
                    <img src={CARD_BACK} alt="" />
                  </span>
                  <span className="ui-label rk-deck-count">
                    {t.scene.deckCount(deck.length)}
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
                      text={t}
                    />
                  ) : (
                    <span className="rk-drawn-empty ui-label">{t.scene.firstCard}</span>
                  )}
                  {run.peeked && (
                    <span className="rk-peeked" title={t.scene.peekedTitle}>
                      <span className="ui-label">{t.scene.next}</span>
                      <span className="rk-mini-card">
                        {run.peeked.value}
                        <span aria-label={t.seeds[run.peeked.seed]}>{SEED_SYMBOLS[run.peeked.seed]}</span>
                      </span>
                    </span>
                  )}
                </div>
                </>
                )}
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
            onChooseReward={chooseReward}
            onNewRun={() => startNewRun(run.heroName)}
            onMenu={() => navigate("/roguelike")}
          />
        )}
        {helpOpen && <RunHelp run={run} onClose={closeHelp} />}
      </div>
    </AnchorContext.Provider>
  );
}
