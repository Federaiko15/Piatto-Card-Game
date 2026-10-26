import { CARD_BACK, cardArt } from "../art/manifest";
import { it, type Text } from "../i18n/it";
import "../styles/Cards.css";

interface CardProps {
  seed?: string;
  value?: number;
  isHidden?: boolean; // ci serve per mostrare o il dorso o la parte frontale della carta
  reveal?: boolean; // la carta appena pescata parte coperta e si gira (serve una key nuova a ogni pescata)
  text?: Pick<Text, "cards" | "seeds">; // i testi per chi usa un lettore di schermo; i tavoli classici restano in italiano
}

const Card = ({ seed, value, isHidden = false, reveal = false, text = it }: CardProps) => {
  // Se la carta è coperta, mostriamo il dorso.
  // Altrimenti, mappiamo dinamicamente il percorso usando i dati del server.

  return (
    /* Il contenitore che dà l'effetto di profondità 3D */
    <div className="card-perspective">
      <div
        className={`card-inner ${isHidden ? "" : "is-flipped"} ${reveal && !isHidden ? "card-reveal" : ""}`}
      >
        {/* FACCIA 1: Il Dorso della carta */}
        <div className="card-face card-back">
          <img src={CARD_BACK} alt={text.cards.back} />
        </div>

        {/* FACCIA 2: Il Fronte della carta (nascosto dietro al dorso) */}
        <div className="card-face card-front">
          <img
            src={cardArt(seed ?? "", value ?? 0)}
            alt={text.cards.front(value ?? 0, text.seeds[seed as keyof Text["seeds"]] ?? seed ?? "")}
          />
        </div>
      </div>
    </div>
  );
};

export default Card;
