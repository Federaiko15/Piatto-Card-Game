import { useNavigate } from "react-router-dom";
import authBg from "../assets/auth.png";
import { useText } from "../i18n";
import "../styles/ModeSelect.css";

type ModeId = "roguelike" | "offline" | "online";

// le modalità del sito; i testi nella lingua scelta stanno nei dizionari
const MODES: { id: ModeId; icon: string; comingSoon?: boolean }[] = [
  { id: "roguelike", icon: "🍷" },
  { id: "offline", icon: "🤖" },
  { id: "online", icon: "🌐" },
];

// Prima pagina dell'app: il login serve solo per la modalità online
export default function ModeSelect() {
  const navigate = useNavigate();
  const t = useText();

  const handleSelect = (mode: (typeof MODES)[number]) => {
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
        <p className="mode-subtitle">{t.modes.subtitle}</p>
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
              <span className="mode-card-title">{t.modes[mode.id].title}</span>
              <span className="mode-card-description">{t.modes[mode.id].description}</span>
              <span className="mode-tag">
                {mode.comingSoon ? t.modes.soon : t.modes[mode.id].tag}
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
        {t.modes.legal}
      </button>
    </div>
  );
}
