import { SANTINI, type RunState, type SantinoId } from "@piatto/game-core";
import ItemArt from "./ItemArt";
import { useText } from "../../i18n";

interface SwapChooserProps {
  run: RunState;
  incoming: SantinoId;
  onPick: (index: number) => void;
  onCancel: () => void;
}

// Con i santini al completo: quale lasciare per far posto a quello nuovo. Gli scambi sono pochi per notte
export default function SwapChooser({ run, incoming, onPick, onCancel }: SwapChooserProps) {
  const t = useText();
  return (
    <div className="ui-backdrop">
      <section className="ui-panel ui-pop rk-swap" role="dialog" aria-labelledby="rk-swap-title">
        <h2 id="rk-swap-title" className="ui-title rk-swap-title">
          {t.swap.title}
        </h2>
        <p className="rk-swap-intro">{t.swap.intro(t.santini[incoming].name, run.swapsLeft)}</p>
        <ul className="rk-swap-list">
          {run.santini.map((id, index) => (
            <li key={id}>
              <button
                type="button"
                className={`rk-santino ui-paper rk-santino--${SANTINI[id].rarity} rk-swap-option`}
                onClick={() => onPick(index)}
              >
                <ItemArt id={id} className="rk-santino-art" />
                <span className="rk-santino-text">
                  <span className="rk-santino-name">{t.santini[id].name}</span>
                  <span className="rk-santino-effect">{t.santini[id].effect}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="ui-btn ui-btn--wood" onClick={onCancel}>
          {t.swap.keep}
        </button>
      </section>
    </div>
  );
}
