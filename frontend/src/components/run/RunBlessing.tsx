import { SANTINI, runTables, type RunState } from "@piatto/game-core";
import ItemArt from "./ItemArt";
import { characterText, useText } from "../../i18n";

interface RunBlessingProps {
  run: RunState;
  onChoose: (index: number) => void;
}

// Prima del primo tavolo: la nonna mette in tasca all'eroe un santino a scelta fra tre.
// Aiuta a raggiungere la prima quota e dà alla notte una direzione fin dall'inizio
export default function RunBlessing({ run, onChoose }: RunBlessingProps) {
  const t = useText();
  const first = runTables(run)[0];

  return (
    <div className="rk-shop-screen">
      <header className="rk-shop-header">
        <div>
          <p className="ui-label">{t.blessing.before}</p>
          <h1 className="ui-title rk-shop-title">{t.blessing.title}</h1>
          <p className="rk-blessing-intro">{t.blessing.intro}</p>
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
              <span className={`ui-tag ui-tag--${info.rarity}`}>{t.rarity[info.rarity]}</span>
              <span className="rk-offer-name">{t.santini[id].name}</span>
              <span className="rk-offer-effect">{t.santini[id].effect}</span>
              <button type="button" className="ui-btn ui-btn--gold rk-offer-buy" onClick={() => onChoose(index)}>
                {t.blessing.take}
              </button>
            </li>
          );
        })}
      </ul>

      <section className="ui-panel rk-next" aria-labelledby="rk-first-title">
        <p className="ui-label">{t.blessing.first}</p>
        <h2 id="rk-first-title" className="rk-next-name">
          {t.tables[first.id]}
        </h2>
        <p className="rk-next-detail">
          {t.shop.tableDetail(
            first.ante,
            first.quota,
            first.opponents.map((o) => characterText(t, o.character).name).join(", "),
          )}
        </p>
      </section>
    </div>
  );
}
