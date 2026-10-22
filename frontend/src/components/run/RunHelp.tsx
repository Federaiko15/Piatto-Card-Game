import { useEffect } from "react";
import {
  CARD_EFFECTS,
  SANTINI,
  TABLE_MODIFIERS,
  type CardEffectId,
  type RunState,
} from "@piatto/game-core";
import { MODIFIER_ICONS } from "../../art/manifest";
import ItemArt from "./ItemArt";

const EFFECT_ICONS: Record<CardEffectId, string> = {
  fante: "8",
  cavallo: "9",
  re: "10",
};

interface RunHelpProps {
  run: RunState;
  onClose: () => void;
}

// Il promemoria delle regole: regola base, effetti delle figure, regole del tavolo e santini
export default function RunHelp({ run, onClose }: RunHelpProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ui-backdrop" onClick={onClose}>
      <section
        className="ui-panel ui-pop rk-help"
        role="dialog"
        aria-labelledby="rk-help-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="rk-help-title" className="ui-title rk-help-title">
          Come si gioca
        </h2>
        <p className="rk-help-lead">
          Punti e peschi: con una carta da <strong>1 a 5</strong> la puntata va nel piatto, da{" "}
          <strong>6 a 10</strong> la prendi dal piatto. Fante, cavallo e re hanno anche un effetto, per
          tutti al tavolo.
        </p>

        <ul className="rk-help-list">
          {(Object.keys(CARD_EFFECTS) as CardEffectId[]).map((id) => (
            <li key={id}>
              <span className="rk-help-icon" aria-hidden="true">
                {EFFECT_ICONS[id]}
              </span>
              <span>
                <strong>{CARD_EFFECTS[id].name}</strong>: {CARD_EFFECTS[id].effect}
              </span>
            </li>
          ))}
        </ul>

        {run.modifiers.length > 0 && (
          <>
            <h3 className="ui-label rk-help-heading">Regole di questo tavolo</h3>
            <ul className="rk-help-list">
              {run.modifiers.map((id) => (
                <li key={id}>
                  <span className="rk-help-icon" aria-hidden="true">
                    {MODIFIER_ICONS[id]}
                  </span>
                  <span>
                    <strong>{TABLE_MODIFIERS[id].name}</strong>: {TABLE_MODIFIERS[id].effect}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {run.santini.length > 0 && (
          <>
            <h3 className="ui-label rk-help-heading">I tuoi santini</h3>
            <ul className="rk-help-list">
              {run.santini.map((id) => (
                <li key={id}>
                  <ItemArt id={id} className="rk-help-icon" />
                  <span>
                    <strong>{SANTINI[id].name}</strong>: {SANTINI[id].effect}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <button type="button" className="ui-btn ui-btn--gold" onClick={onClose}>
          Torna al tavolo
        </button>
      </section>
    </div>
  );
}
