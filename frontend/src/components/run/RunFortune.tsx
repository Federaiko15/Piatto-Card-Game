import {
  CONSUMABLES,
  FOODS,
  MAX_CONSUMABLES,
  MAX_FOODS,
  MAX_SANTINI,
  SANTINI,
  rememberedCards,
  type ConsumableId,
  type FoodId,
  type RunState,
} from "@piatto/game-core";
import { useState } from "react";
import { SEED_SYMBOLS } from "../../art/manifest";
import { useAnchor } from "../../scene/anchors";
import ItemArt from "./ItemArt";

interface RunFortuneProps {
  run: RunState;
  heroTurn: boolean;
  onPeek: () => void;
  onConsume: (item: ConsumableId) => void;
  onEat: (food: FoodId) => void;
}

type SantinoId = RunState["santini"][number];

// I santini che valgono una volta per tavolo restano spenti dopo l'uso, fino al tavolo successivo
const isSpent = (run: RunState, id: SantinoId) =>
  (id === "corno_rosso" && run.refundUsed) || (id === "coppola_del_nonno" && run.peekUsed);

function SantinoSlot({ id, spent }: { id: SantinoId; spent: boolean }) {
  const anchor = useAnchor(`santino:${id}`);
  const info = SANTINI[id];
  // quando torna buono (al tavolo nuovo) il santino luccica un momento
  const [wasSpent, setWasSpent] = useState(spent);
  const [revived, setRevived] = useState(false);
  if (wasSpent !== spent) {
    setWasSpent(spent);
    if (!spent) setRevived(true);
  }

  return (
    <li
      ref={anchor}
      className={`rk-santino ui-paper rk-santino--${info.rarity}${spent ? " rk-santino--spent" : ""}${
        revived ? " rk-santino--revived" : ""
      }`}
      onAnimationEnd={() => setRevived(false)}
    >
      <ItemArt id={id} className="rk-santino-art" />
      <span className="rk-santino-text">
        <span className="rk-santino-name">{info.name}</span>
        <span className="rk-santino-effect">{spent ? "Usato a questo tavolo: torna buono al prossimo." : info.effect}</span>
      </span>
    </li>
  );
}

// La "fortuna" dell'eroe: santini equipaggiati, consumabili in tasca e quello che i santini fanno vedere.
// Su desktop sta nel pannello a sinistra, sotto la puntata; su smartphone è una striscia scorrevole.
export default function RunFortune({ run, heroTurn, onPeek, onConsume, onEat }: RunFortuneProps) {
  const memory = rememberedCards(run);
  const hasCoppola = run.santini.includes("coppola_del_nonno");
  const emptySlots = MAX_SANTINI - run.santini.length;

  return (
    <section className="rk-fortune" aria-label="La tua fortuna">
      <section className="rk-side-section">
        <h2 className="ui-label">
          Santini {run.santini.length}/{MAX_SANTINI}
        </h2>
        <ul className="rk-santini">
          {run.santini.map((id) => (
            <SantinoSlot key={id} id={id} spent={isSpent(run, id)} />
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <li key={`empty-${i}`} className="rk-santino rk-santino--empty" aria-hidden="true" />
          ))}
        </ul>
      </section>

      {(run.consumables.length > 0 || hasCoppola) && (
        <section className="rk-side-section">
          <h2 className="ui-label">
            In tasca {run.consumables.length}/{MAX_CONSUMABLES}
          </h2>
          <div className="rk-pocket">
            {hasCoppola && (
              <button
                type="button"
                className="ui-btn ui-btn--wood ui-btn--small rk-pocket-btn"
                disabled={!heroTurn || run.peekUsed}
                onClick={onPeek}
                title={SANTINI.coppola_del_nonno.effect}
              >
                <ItemArt id="coppola_del_nonno" />
                <span className="rk-pocket-name">{run.peekUsed ? "Già sbirciato" : "Sbircia"}</span>
              </button>
            )}
            {run.consumables.map((id, i) => (
              <button
                key={`${id}-${i}`}
                type="button"
                className="ui-btn ui-btn--gold ui-btn--small rk-pocket-btn"
                disabled={!heroTurn}
                onClick={() => onConsume(id)}
                title={CONSUMABLES[id].effect}
              >
                <ItemArt id={id} />
                <span className="rk-pocket-name">{CONSUMABLES[id].name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {run.foods.length > 0 && (
        <section className="rk-side-section">
          <h2 className="ui-label">
            Panaru {run.foods.length}/{MAX_FOODS}
          </h2>
          <div className="rk-pocket">
            {run.foods.map((id, i) => (
              <button
                key={`${id}-${i}`}
                type="button"
                className="ui-btn ui-btn--gold ui-btn--small rk-pocket-btn"
                disabled={!heroTurn}
                onClick={() => onEat(id)}
                title={FOODS[id].effect}
              >
                <ItemArt id={id} />
                <span className="rk-pocket-name">{FOODS[id].name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {memory.length > 0 && (
        <section className="rk-side-section" title={SANTINI.memoria_di_ferro.effect}>
          <h2 className="ui-label">Ultime uscite</h2>
          <div className="rk-memory">
            {memory.map((card, i) => (
              <span key={i} className="rk-mini-card">
                {card.value}
                <span aria-label={card.seed}>{SEED_SYMBOLS[card.seed]}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
