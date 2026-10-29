import type { CSSProperties } from "react";
import { CHARACTERS, EMOTE_GLYPHS, characterArt, characterLayers, emoteArt, type Expression } from "../art/manifest";
import LayeredBust from "./LayeredBust";

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
  // al tavolo, se il personaggio è disegnato a livelli, respira
  const layered = size === "bust" && characterLayers(character) !== undefined;
  const badge = EXPRESSION_BADGES[expression];
  // chi non mostra il volto esprime le emozioni con un segno sopra la testa
  const emote = info.emotes && expression !== "neutral" ? expression : null;
  const emoteImg = emote ? emoteArt(emote) : undefined;

  return (
    <span
      className={`portrait portrait--${size} portrait--${expression}`}
      style={{ "--portrait-color": info.color } as CSSProperties}
    >
      {layered ? (
        <LayeredBust character={character} expression={expression} />
      ) : art ? (
        <img src={art} alt="" className="portrait-art" />
      ) : (
        <span className="portrait-placeholder" aria-hidden="true">
          {info.emoji}
          {size === "bust" && <span className="portrait-shoulders" />}
        </span>
      )}
      {emote && (
        <span key={emote} className={`portrait-emote portrait-emote--${emote}`} aria-hidden="true">
          {emoteImg ? <img src={emoteImg} alt="" /> : EMOTE_GLYPHS[emote]}
        </span>
      )}
      {!art && !layered && !info.emotes && badge && (
        <span key={expression} className="portrait-badge" aria-hidden="true">
          {badge}
        </span>
      )}
    </span>
  );
}
