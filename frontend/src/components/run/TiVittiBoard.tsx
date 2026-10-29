import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  SEEDS,
  fitsOn,
  fitsStack,
  type Card,
  type RunEvent,
  type Seed,
  type TiVittiAction,
  type TiVittiState,
} from "@piatto/game-core";
import { CARD_BACK, SEED_SYMBOLS, cardArt } from "../../art/manifest";
import { useText } from "../../i18n";

interface TiVittiBoardProps {
  game: TiVittiState;
  events: RunEvent[]; // gli eventi dell'ultima mossa: le carte dell'incappucciato volano al loro posto
  opponentName: string;
  onMove: (move: TiVittiAction) => void;
}

// Quanto dura il volo di una carta dell'incappucciato
const FLIGHT_MS = 480;

type From = "flipped" | "pile";

interface Drag {
  from: From;
  card: Card;
  x: number;
  y: number;
  // dove l'eroe ha preso la carta, per farla seguire il dito senza scatti
  offsetX: number;
  offsetY: number;
  size: number;
}

const top = (pile: readonly Card[]): Card | undefined => pile[pile.length - 1];

function CardFace({ card, className = "" }: { card: Card; className?: string }) {
  const t = useText();
  return (
    <img
      className={`tv-card ${className}`}
      src={cardArt(card.seed, card.value)}
      alt={t.cards.front(card.value, t.seeds[card.seed])}
      draggable={false}
    />
  );
}

// Il tavolo di Ti vitti: a sinistra il mazzo e la pila dell'eroe, al centro le scale, a destra la pila e il
// mazzo dell'incappucciato. L'eroe gira cliccando il suo mazzo e sposta le carte trascinandole; il gioco non
// suggerisce le mosse, perché accorgersene è il gioco
export default function TiVittiBoard({ game, events, opponentName, onMove }: TiVittiBoardProps) {
  const t = useText();
  const board = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [rejected, setRejected] = useState(0); // cresce a ogni mossa non valida: fa tremare la carta
  const [hero, stranger] = game.hands;
  const heroTurn = game.turn === 0 && game.winner === null;
  const heroFlipped = heroTurn ? game.flipped : null;
  const strangerFlipped = game.turn === 1 ? game.flipped : null;
  const heroTop = top(hero.pile);
  const heroUnder = hero.pile[hero.pile.length - 2];
  const strangerTop = top(stranger.pile);

  // Quando l'incappucciato dà una carta all'eroe o la mette in una scala, la carta vola dalla sua pila al posto
  // dove finisce, che fino all'arrivo mostra ancora la carta di prima. È un'animazione del DOM fatta a mano:
  // la carta in volo sta nel body, fuori dal filtro del tavolo
  useLayoutEffect(() => {
    const root = board.current;
    const last = [...events].reverse().find((e) => e.type === "tivitti" && e.event.seat === 1);
    if (!root || last?.type !== "tivitti") return;
    const move = last.event;
    if (move.type !== "given" && move.type !== "stacked") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const source = root.querySelector<HTMLElement>(".tv-pile--target");
    const target = root.querySelector<HTMLElement>(
      move.type === "given" ? '[data-drop="own"]' : `[data-drop="stack:${move.card.seed}"]`,
    );
    if (!source || !target) return;
    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    // la carta girata era sollevata sopra la sua pila
    const lift = move.from === "flipped" ? from.height * 0.3 : 0;
    const landed = target.querySelector<HTMLElement>(".tv-top");

    const flight = document.createElement("img");
    flight.src = cardArt(move.card.seed, move.card.value);
    flight.alt = "";
    flight.className = "tv-card tv-flight";
    flight.style.width = `${to.width}px`;
    flight.style.height = `${to.height}px`;
    document.body.appendChild(flight);
    if (landed) landed.style.visibility = "hidden";
    const scale = from.width / to.width;
    const animation = flight.animate(
      [
        { transform: `translate(${from.left}px, ${from.top - lift}px) scale(${scale}) rotate(6deg)` },
        { transform: `translate(${(from.left + to.left) / 2}px, ${Math.min(from.top, to.top) - to.height * 0.6}px) scale(1.12) rotate(-4deg)`, offset: 0.5 },
        { transform: `translate(${to.left}px, ${to.top}px) scale(1) rotate(0deg)` },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)" },
    );
    const land = () => {
      flight.remove();
      if (landed) landed.style.visibility = "";
    };
    animation.onfinish = land;
    return () => {
      animation.cancel();
      land();
    };
  }, [events]);

  const startDrag = (from: From, card: Card) => (event: PointerEvent<HTMLElement>) => {
    if (!heroTurn) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      from,
      card,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      size: rect.width,
    });
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (drag) setDrag({ ...drag, x: event.clientX, y: event.clientY });
  };

  // la carta lasciata su un posto valido diventa la mossa; altrimenti torna dov'era
  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag) return;
    setDrag(null);
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drop]");
    const drop = target?.dataset.drop;
    if (!drop) return;
    const { from, card } = drag;
    let move: TiVittiAction | null = null;
    if (drop === "opponent" && fitsOn(card, strangerTop)) move = { type: "give", from };
    else if (drop === `stack:${card.seed}` && fitsStack(card, game.stacks)) move = { type: "stack", from };
    else if (drop === "own" && from === "flipped") move = { type: "keep" };
    if (move) onMove(move);
    else if (drop !== "own") setRejected((n) => n + 1);
  };

  const draggable = (from: From, card: Card) => ({
    onPointerDown: startDrag(from, card),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: () => setDrag(null),
  });

  const stackCard = (seed: Seed): Card | null => (game.stacks[seed] > 0 ? { seed, value: game.stacks[seed] } : null);
  const dragging = (from: From) => drag?.from === from;

  return (
    <div ref={board} className={`tv-board${heroTurn ? " is-hero-turn" : ""}${drag ? " is-dragging" : ""}`}>
      {/* l'eroe: il mazzo da cui girare e la pila, con sopra la carta appena girata */}
      <div className="tv-side tv-side--hero">
        <button
          type="button"
          className="tv-slot tv-deck"
          disabled={!heroTurn || Boolean(heroFlipped) || hero.deck.length + hero.pile.length === 0}
          onClick={() => onMove({ type: "flip" })}
          aria-label={`${t.tivitti.yourDeck}: ${t.tivitti.count(hero.deck.length)}`}
        >
          {hero.deck.length > 0 ? (
            <img className="tv-card" src={CARD_BACK} alt="" draggable={false} />
          ) : (
            <span className="tv-empty" aria-hidden="true">↻</span>
          )}
          <span className="ui-label tv-count">{t.tivitti.count(hero.deck.length)}</span>
        </button>

        <div className="tv-slot tv-pile" data-drop="own" aria-label={t.tivitti.yourPile}>
          {/* la carta sotto la cima: si vede mentre si trascina la cima o mentre arriva una carta */}
          {heroUnder && <CardFace card={heroUnder} className="tv-under" />}
          {heroTop && (
            <span
              className={`tv-grab tv-top${dragging("pile") ? " is-dragging" : ""}`}
              {...(heroTurn && !heroFlipped ? draggable("pile", heroTop) : {})}
            >
              <CardFace card={heroTop} />
            </span>
          )}
          {heroFlipped && (
            <span
              key={`${heroFlipped.seed}-${heroFlipped.value}-${rejected}`}
              className={`tv-grab tv-in-hand${dragging("flipped") ? " is-dragging" : ""}${rejected ? " is-rejected" : ""}`}
              {...draggable("flipped", heroFlipped)}
            >
              <CardFace card={heroFlipped} />
            </span>
          )}
          <span className="ui-label tv-count">{t.tivitti.count(hero.pile.length)}</span>
        </div>
      </div>

      {/* le scale al centro, una per seme */}
      <div className="tv-stacks" aria-label={t.tivitti.stacks}>
        {SEEDS.map((seed) => {
          const card = stackCard(seed);
          const under = card && card.value > 1 ? { seed, value: card.value - 1 } : null;
          return (
            <div key={seed} className="tv-slot tv-stack" data-drop={`stack:${seed}`} title={t.seeds[seed]}>
              {under && <CardFace card={under} className="tv-under" />}
              {card ? (
                <CardFace card={card} className="tv-top" />
              ) : (
                <span className="tv-empty" aria-label={t.seeds[seed]}>
                  {SEED_SYMBOLS[seed]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* l'incappucciato: la sua pila, dove si danno le carte, e il suo mazzo */}
      <div className="tv-side tv-side--stranger">
        <div className="tv-slot tv-pile tv-pile--target" data-drop="opponent" aria-label={t.tivitti.hisPile(opponentName)}>
          {strangerTop && <CardFace card={strangerTop} />}
          {strangerFlipped && (
            <span className="tv-grab tv-in-hand tv-in-hand--stranger">
              <CardFace card={strangerFlipped} />
            </span>
          )}
          <span className="ui-label tv-count">{t.tivitti.count(stranger.pile.length)}</span>
        </div>
        <div className="tv-slot tv-deck" aria-label={`${t.tivitti.hisDeck(opponentName)}: ${t.tivitti.count(stranger.deck.length)}`}>
          {stranger.deck.length > 0 ? (
            <img className="tv-card" src={CARD_BACK} alt="" draggable={false} />
          ) : (
            <span className="tv-empty" aria-hidden="true">↻</span>
          )}
          <span className="ui-label tv-count">{t.tivitti.count(stranger.deck.length)}</span>
        </div>
      </div>

      {/* la carta che segue il dito mentre la si trascina: sta nel body, perché il filtro del tavolo
          sposterebbe una posizione fissa */}
      {drag &&
        createPortal(
          <span
            className="tv-ghost"
            style={
              { left: drag.x - drag.offsetX, top: drag.y - drag.offsetY, width: drag.size, height: drag.size } as CSSProperties
            }
            aria-hidden="true"
          >
            <CardFace card={drag.card} />
          </span>,
          document.body,
        )}
    </div>
  );
}
