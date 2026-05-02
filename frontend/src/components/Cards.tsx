import "../styles/Cards.css";

interface CardProps {
  seed?: string;
  value?: number;
  isHidden?: boolean; // ci serve per mostrare o il dorso o la parte frontale della carta
}

const Card = ({ seed, value, isHidden = false }: CardProps) => {
  // Se la carta è coperta, mostriamo il dorso.
  // Altrimenti, mappiamo dinamicamente il percorso usando i dati del server.

  return (
    /* Il contenitore che dà l'effetto di profondità 3D */
    <div className="card-perspective">
      <div className={`card-inner ${isHidden ? "" : "is-flipped"}`}>
        {/* FACCIA 1: Il Dorso della carta */}
        <div className="card-face card-back">
          <img src="/cards/back.png" alt="Dorso carta" />
        </div>

        {/* FACCIA 2: Il Fronte della carta (nascosto dietro al dorso) */}
        <div className="card-face card-front">
          <img
            src={`/cards/${seed}_${value}.png`}
            alt={`${value} di ${seed}`}
          />
        </div>
      </div>
    </div>
  );
};

export default Card;
