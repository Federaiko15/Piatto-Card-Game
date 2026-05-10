import authBg from "../assets/auth.png";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";

export default function Auth() {
  const {
    form,
    setForm,
    isLogin,
    setIsLogin,
    registrationStep,
    isOnline,
    offlineForm,
    setOfflineForm,
    handleSubmit,
    navigate,
    isForgotPassword,
    setIsForgotPassword,
    forgotStep,
    setForgotStep,
    forgotForm,
    handleForgotChange,
    handleForgotSubmit,
  } = useAuth();

  const handleOfflineChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setOfflineForm((prev) => ({
      ...prev,
      [name]: name === "username" ? value : Number(value),
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  return (
    <div
      className="auth-container"
      style={{ backgroundImage: `url(${authBg})`, imageRendering: "pixelated" }}
    >
      <div className="auth-box">
        {/* CONDIZIONE PRINCIPALE: ONLINE vs OFFLINE */}
        {isOnline ? (
          isForgotPassword ? (
            <>
              <h1 className="auth-title">Recupera Password 🔐</h1>
              <form className="auth-form" onSubmit={handleForgotSubmit}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={forgotForm.email}
                  onChange={handleForgotChange}
                  required
                  disabled={forgotStep === 2}
                  className="auth-input"
                />
                {forgotStep === 2 && (
                  <>
                    <input
                      type="text"
                      name="otp"
                      placeholder="Codice OTP (ricevuto via mail)"
                      value={forgotForm.otp}
                      onChange={handleForgotChange}
                      required
                      className="auth-input"
                    />
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Nuova Password"
                      value={forgotForm.newPassword}
                      onChange={handleForgotChange}
                      required
                      className="auth-input"
                    />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Conferma Nuova Password"
                      value={forgotForm.confirmPassword}
                      onChange={handleForgotChange}
                      required
                      className="auth-input"
                    />
                  </>
                )}
                <button type="submit" className="auth-submit-btn">
                  {forgotStep === 1 ? "Invia OTP" : "Reimposta Password"}
                </button>
              </form>
              <p className="auth-switch-text">
                Ti sei ricordato la password?{" "}
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotStep(1);
                  }}
                  className="auth-switch-btn"
                >
                  Torna al Login
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-title">
                {isLogin ? "Accedi a Piatto 🃏" : "Registrati a Piatto 🃏"}
              </h1>

              <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && registrationStep === 2 && (
                  <input
                    type="text"
                    name="otp"
                    placeholder="Codice OTP (inviato via email)"
                    value={form.otp}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                )}

                {!isLogin && registrationStep === 2 && (
                  <input
                    type="text"
                    name="username"
                    placeholder="Il tuo Nickname"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                )}

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={!isLogin && registrationStep === 2}
                  className="auth-input"
                />

                {(isLogin || (!isLogin && registrationStep === 2)) && (
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                )}

                <button type="submit" className="auth-submit-btn">
                  {isLogin
                    ? "Entra nel locale"
                    : registrationStep === 1
                      ? "Invia OTP"
                      : "Crea un account"}
                </button>
              </form>

              <p className="auth-switch-text">
                {isLogin ? "Non hai un account? " : "Sei già dei nostri? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="auth-switch-btn"
                >
                  {isLogin ? "Registrati" : "Accedi"}
                </button>
              </p>
              {isLogin && (
                <p className="auth-switch-text">
                  Hai dimenticato la password?{" "}
                  <button
                    onClick={() => setIsForgotPassword(true)}
                    className="auth-switch-btn"
                  >
                    Recupera
                  </button>
                </p>
              )}
            </>
          )
        ) : (
          /* SEZIONE MOSTRATA SOLO QUANDO OFFLINE */
          <div className="offline-box">
            <h2 className="offline-title">Connessione Assente 📡</h2>
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
                  </select>
                </div>
              </div>

              <button type="submit" className="offline-submit-btn">
                Crea Tavolo Offline
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
