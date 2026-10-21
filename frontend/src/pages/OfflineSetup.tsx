import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authBg from "../assets/auth.png";
import "../styles/Auth.css";

type OfflineForm = {
  username: string;
  starterBet: number;
  numPlayers: number;
};

// Pagina di preparazione del tavolo classico contro i bot: non serve né il login né la connessione
export default function OfflineSetup() {
  const navigate = useNavigate();
  // "Gioca ancora" dal tavolo torna qui con le impostazioni della partita appena finita
  const previous = useLocation().state as OfflineForm | null;

  const [offlineForm, setOfflineForm] = useState<OfflineForm>(
    previous ?? { username: "Giocatore 1", starterBet: 10, numPlayers: 4 },
  );

  const handleOfflineChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setOfflineForm((prev) => ({
      ...prev,
      [name]: name === "username" ? value : Number(value),
    }));
  };

  return (
    <div
      className="auth-container"
      style={{ backgroundImage: `url(${authBg})`, imageRendering: "pixelated" }}
    >
      <div className="offline-box">
        <h2 className="offline-title">Classica contro i Bot 🤖</h2>
        <p className="offline-subtitle">
          Imposta il tuo tavolo locale e gioca contro i Bot!
        </p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            // Navighiamo alla rotta offline PASSANDO I DATI!
            navigate("/offline-room", { state: offlineForm });
          }}
        >
          <input
            type="text"
            name="username"
            value={offlineForm.username}
            onChange={handleOfflineChange}
            placeholder="Il tuo nome"
            className="offline-input"
            required
          />

          <div className="offline-row">
            <div className="offline-col">
              <label className="offline-label">Puntata Iniziale</label>
              <input
                type="number"
                name="starterBet"
                value={offlineForm.starterBet}
                onChange={handleOfflineChange}
                min="1"
                className="offline-input"
                required
              />
            </div>
            <div className="offline-col">
              <label className="offline-label">Num. Giocatori</label>
              <select
                name="numPlayers"
                value={offlineForm.numPlayers}
                onChange={handleOfflineChange}
                className="offline-input"
              >
                <option value={2}>2 Giocatori</option>
                <option value={3}>3 Giocatori</option>
                <option value={4}>4 Giocatori</option>
                <option value={5}>5 Giocatori</option>
                <option value={6}>6 Giocatori</option>
                <option value={7}>7 Giocatori</option>
              </select>
            </div>
          </div>

          <button type="submit" className="offline-submit-btn">
            Crea Tavolo Offline
          </button>
        </form>

        <p className="auth-switch-text">
          <button onClick={() => navigate("/")} className="auth-switch-btn">
            ← Scegli un'altra modalità
          </button>
        </p>
      </div>
    </div>
  );
}
