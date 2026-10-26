import { SANTINI, runTables, type RunState } from "@piatto/game-core";
import ItemArt from "./ItemArt";

interface RunBlessingProps {
  run: RunState;
  onChoose: (index: number) => void;
}

// Prima del primo tavolo: la nonna mette in tasca all'eroe un santino a scelta fra tre.
// Aiuta a raggiungere la prima quota e dà alla notte una direzione fin dall'inizio
export default function RunBlessing({ run, onChoose }: RunBlessingProps) {
  const first = runTables(run)[0];

  return (
    <div className="rk-shop-screen">
      <header className="rk-shop-header">
        <div>
          <p className="ui-label">Prima di uscire di casa</p>
          <h1 className="ui-title rk-shop-title">Il santino della nonna</h1>
          <p className="rk-blessing-intro">
            "Pigghia, ca stanotti ti servi." Scegline uno: ti accompagna per tutta la notte.
          </p>
        </div>
      </header>

      <ul className="rk-offers">
        {run.blessing!.map((id, index) => {
          const info = SANTINI[id];
          return (
            <li
              key={id}
              className={`rk-offer ui-paper ui-pop rk-offer--${info.rarity}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="rk-offer-art">
                <ItemArt id={id} />
              </span>
              <span className={`ui-tag ui-tag--${info.rarity}`}>{info.rarity}</span>
              <span className="rk-offer-name">{info.name}</span>
              <span className="rk-offer-effect">{info.effect}</span>
              <button type="button" className="ui-btn ui-btn--gold rk-offer-buy" onClick={() => onChoose(index)}>
                Prendilo
              </button>
            </li>
          );
        })}
      </ul>

      <section className="ui-panel rk-next" aria-labelledby="rk-first-title">
        <p className="ui-label">Primo tavolo</p>
        <h2 id="rk-first-title" className="rk-next-name">
          {first.name}
        </h2>
        <p className="rk-next-detail">
          Posta {first.ante} · Quota {first.quota} · Al tavolo: {first.opponents.map((o) => o.name).join(", ")}
        </p>
      </section>
    </div>
  );
}
