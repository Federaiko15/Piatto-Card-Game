import { SANTINI, type RunState, type SantinoId } from "@piatto/game-core";
import ItemArt from "./ItemArt";

interface SwapChooserProps {
  run: RunState;
  incoming: SantinoId;
  onPick: (index: number) => void;
  onCancel: () => void;
}

// Con i santini al completo: quale lasciare per far posto a quello nuovo. Gli scambi sono pochi per notte
export default function SwapChooser({ run, incoming, onPick, onCancel }: SwapChooserProps) {
  return (
    <div className="ui-backdrop">
      <section className="ui-panel ui-pop rk-swap" role="dialog" aria-labelledby="rk-swap-title">
        <h2 id="rk-swap-title" className="ui-title rk-swap-title">
          Quale santino lasci?
        </h2>
        <p className="rk-swap-intro">
          Per prendere <strong>{SANTINI[incoming].name}</strong> devi lasciarne uno. Scambi rimasti stanotte:{" "}
          {run.swapsLeft}.
        </p>
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
                  <span className="rk-santino-name">{SANTINI[id].name}</span>
                  <span className="rk-santino-effect">{SANTINI[id].effect}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="ui-btn ui-btn--wood" onClick={onCancel}>
          Tienili tutti
        </button>
      </section>
    </div>
  );
}
