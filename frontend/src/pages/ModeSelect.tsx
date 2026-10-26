import { useNavigate } from "react-router-dom";
import authBg from "../assets/auth.png";
import "../styles/ModeSelect.css";

type Mode = {
  id: string;
  icon: string;
  title: string;
  description: string;
  tag: string;
  comingSoon?: boolean;
};

const MODES: Mode[] = [
  {
    id: "roguelike",
    icon: "🍷",
    title: "Notte all'Osteria",
    description:
      "Piatto con regole nuove, più dinamiche del gioco originale: quattro tavoli in una notte, santini che cambiano le regole, una bottega e un boss finale. Raggiungi la quota di ogni tavolo per arrivare fino in fondo.",
    tag: "Giocatore singolo · Regole nuove",
  },
  {
    id: "offline",
    icon: "🤖",
    title: "Classica contro i Bot",
    description:
      "Le regole di sempre contro avversari controllati dal computer. Funziona anche senza connessione.",
    tag: "Senza account",
  },
  {
    id: "online",
    icon: "🌐",
    title: "Classica Online",
    description:
      "Crea una lobby o entra in quella di un amico e sfida altri giocatori in tempo reale.",
    tag: "Serve un account",
  },
];

// Prima pagina dell'app: il login serve solo per la modalità online
export default function ModeSelect() {
  const navigate = useNavigate();

  const handleSelect = (mode: Mode) => {
    if (mode.comingSoon) return;

    if (mode.id === "roguelike") {
      navigate("/roguelike");
    } else if (mode.id === "offline") {
      navigate("/offline");
    } else if (mode.id === "online") {
      // se l'utente ha già fatto l'accesso lo portiamo direttamente alle lobby
      const token = localStorage.getItem("tokenPiatto");
      navigate(token ? "/lobbies" : "/login");
    }
  };

  return (
    <div
      className="mode-container"
      style={{ backgroundImage: `url(${authBg})`, imageRendering: "pixelated" }}
    >
      <header className="mode-header">
        <h1 className="mode-title">Piatto</h1>
        <p className="mode-subtitle">Scegli come vuoi giocare</p>
      </header>

      <div className="mode-list">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`mode-card${mode.comingSoon ? " mode-card--soon" : ""}`}
            onClick={() => handleSelect(mode)}
            disabled={mode.comingSoon}
          >
            <span className="mode-icon" aria-hidden="true">
              {mode.icon}
            </span>
            <span className="mode-body">
              <span className="mode-card-title">{mode.title}</span>
              <span className="mode-card-description">{mode.description}</span>
              <span className="mode-tag">
                {mode.comingSoon ? "In arrivo" : mode.tag}
              </span>
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="mode-legal-btn"
        onClick={() => navigate("/terms")}
      >
        Note Legali & Privacy
      </button>
    </div>
  );
}
