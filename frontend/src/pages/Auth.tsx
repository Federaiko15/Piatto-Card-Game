import authBg from "../assets/auth.png";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";
import "../styles/LoadingButton.css";
import { useState } from "react";
import LoadingButton from "../components/LoadingButton";

export default function Auth() {
  const {
    form,
    setForm,
    isLogin,
    setIsLogin,
    registrationStep,
    isOnline,
    isLoading,
    handleSubmit,
    navigate,
    isForgotPassword,
    setIsForgotPassword,
    forgotStep,
    setForgotStep,
    forgotForm,
    handleForgotChange,
    handleForgotSubmit,
    hasOtpFailed,
    handleSendOtp,
    hasForgotOtpFailed,
    handleForgotSendOtp,
  } = useAuth();

  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

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
        {/* senza connessione non si può accedere: proponiamo il tavolo contro i bot */}
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
                <LoadingButton
                  type="submit"
                  className="auth-submit-btn"
                  isLoading={isLoading}
                  loadingText="Attendere..."
                >
                  {forgotStep === 1 ? "Invia OTP" : "Reimposta Password"}
                </LoadingButton>

                {forgotStep === 2 && hasForgotOtpFailed && (
                  <button
                    type="button"
                    className="auth-submit-btn auth-resend-btn"
                    onClick={handleForgotSendOtp}
                    disabled={isLoading}
                  >
                    Richiedi nuovo OTP
                  </button>
                )}
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
                {isLogin ? "Accedi a Piatto" : "Registrati a Piatto"}
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

                {!isLogin && registrationStep === 2 && (
                  <div
                    className="terms-checkbox-container"
                    style={{ margin: "10px 0", textAlign: "left" }}
                  >
                    <label
                      style={{
                        color: "#fff",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        required
                        style={{ width: "18px", height: "18px" }}
                      />
                      Accetto i{" "}
                      <span
                        onClick={() => navigate("/terms")}
                        style={{
                          color: "#f1c40f",
                          textDecoration: "underline",
                        }}
                      >
                        Termini, Privacy e Cookie Policy
                      </span>
                    </label>
                  </div>
                )}

                <LoadingButton
                  type="submit"
                  className="auth-submit-btn"
                  isLoading={isLoading}
                  loadingText={
                    isLogin
                      ? "Accesso..."
                      : registrationStep === 1
                        ? "Invio..."
                        : "Registrazione..."
                  }
                  disabled={
                    !isLogin && registrationStep === 2 && !acceptedTerms
                  }
                  style={{
                    opacity:
                      !isLogin && registrationStep === 2 && !acceptedTerms
                        ? 0.6
                        : 1,
                  }}
                >
                  {isLogin
                    ? "Entra nel locale"
                    : registrationStep === 1
                      ? "Invia OTP"
                      : "Crea un account"}
                </LoadingButton>

                {!isLogin && registrationStep === 2 && hasOtpFailed && (
                  <button
                    type="button"
                    className="auth-submit-btn auth-resend-btn"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    Richiedi nuovo OTP
                  </button>
                )}

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

              <p className="auth-switch-text">
                <button
                  onClick={() => navigate("/")}
                  className="auth-switch-btn"
                >
                  ← Scegli un'altra modalità
                </button>
              </p>

              <div
                className="auth-footer"
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  paddingTop: "10px",
                }}
              >
                <button
                  onClick={() => navigate("/terms")}
                  className="auth-switch-btn"
                  style={{ fontSize: "0.75rem" }}
                >
                  Note Legali & Privacy
                </button>
              </div>
            </>
          )
        ) : (
          /* SEZIONE MOSTRATA SOLO QUANDO OFFLINE */
          <div className="offline-box">
            <h2 className="offline-title">Connessione Assente 📡</h2>
            <p className="offline-subtitle">
              Per giocare online serve internet, ma puoi sempre sfidare i Bot!
            </p>
            <button
              type="button"
              className="offline-submit-btn"
              onClick={() => navigate("/offline")}
            >
              Gioca contro i Bot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
