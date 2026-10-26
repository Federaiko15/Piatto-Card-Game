import { useEffect } from "react";
import { CARD_EFFECTS, type CardEffectId, type RunState } from "@piatto/game-core";
import { MODIFIER_ICONS } from "../../art/manifest";
import ItemArt from "./ItemArt";
import { useText } from "../../i18n";

interface RunHelpProps {
  run: RunState;
  onClose: () => void;
}

// Il promemoria delle regole: regola base, effetti delle figure, regole del tavolo e santini
export default function RunHelp({ run, onClose }: RunHelpProps) {
  const t = useText();
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
          {t.help.title}
        </h2>
        <p className="rk-help-lead">
          {t.help.leadStart}
          <strong>{t.help.low}</strong>
          {t.help.leadMiddle}
          <strong>{t.help.high}</strong>
          {t.help.leadEnd}
        </p>

        <ul className="rk-help-list">
          {(Object.keys(CARD_EFFECTS) as CardEffectId[]).map((id) => (
            <li key={id}>
              <span className="rk-help-icon" aria-hidden="true">
                {CARD_EFFECTS[id].value}
              </span>
              <span>
                <strong>{t.figures[id].name}</strong>: {t.figures[id].effect}
              </span>
            </li>
          ))}
        </ul>

        {run.modifiers.length > 0 && (
          <>
            <h3 className="ui-label rk-help-heading">{t.help.tableRules}</h3>
            <ul className="rk-help-list">
              {run.modifiers.map((id) => (
                <li key={id}>
                  <span className="rk-help-icon" aria-hidden="true">
                    {MODIFIER_ICONS[id]}
                  </span>
                  <span>
                    <strong>{t.modifiers[id].name}</strong>: {t.modifiers[id].effect}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {run.santini.length > 0 && (
          <>
            <h3 className="ui-label rk-help-heading">{t.help.yourSantini}</h3>
            <ul className="rk-help-list">
              {run.santini.map((id) => (
                <li key={id}>
                  <ItemArt id={id} className="rk-help-icon" />
                  <span>
                    <strong>{t.santini[id].name}</strong>: {t.santini[id].effect}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <button type="button" className="ui-btn ui-btn--gold" onClick={onClose}>
          {t.help.back}
        </button>
      </section>
    </div>
  );
}
