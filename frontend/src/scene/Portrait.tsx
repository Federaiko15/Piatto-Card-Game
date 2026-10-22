import type { CSSProperties } from "react";
import { CHARACTERS, characterArt, type Expression } from "../art/manifest";

interface PortraitProps {
  character: string;
  expression?: Expression;
  size?: "small" | "medium" | "large" | "bust";
}

// Finché non ci sono i disegni, l'espressione si vede con una faccina accanto al segnaposto
const EXPRESSION_BADGES: Record<Expression, string | null> = {
  neutral: null,
  happy: "😄",
  sad: "😣",
  suspicious: "🤨",
};

// Il ritratto di un personaggio: l'immagine dell'espressione se esiste, altrimenti il segnaposto.
// "bust" è il mezzobusto seduto dietro al tavolo: il segnaposto ha testa e spalle.
export default function Portrait({ character, expression = "neutral", size = "medium" }: PortraitProps) {
  const info = CHARACTERS[character] ?? CHARACTERS.hero;
  const art = characterArt(character, expression);
  const badge = EXPRESSION_BADGES[expression];

  return (
    <span
      className={`portrait portrait--${size} portrait--${expression}`}
      style={{ "--portrait-color": info.color } as CSSProperties}
    >
      {art ? (
        <img src={art} alt="" className="portrait-art" />
      ) : (
        <span className="portrait-placeholder" aria-hidden="true">
          {info.emoji}
          {size === "bust" && <span className="portrait-shoulders" />}
        </span>
      )}
      {!art && badge && (
        <span key={expression} className="portrait-badge" aria-hidden="true">
          {badge}
        </span>
      )}
    </span>
  );
}
