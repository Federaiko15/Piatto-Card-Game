import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authBg from "../assets/auth.png";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from "../types";
import showSwal from "../services/CustomAlert";

interface AuthFormData {
  email: string;
  password: string;
  username?: string;
  otp?: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const [form, setForm] = useState<AuthFormData>({
    email: "",
    password: "",
    username: "",
    otp: "",
  });

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [registrationStep, setRegistrationStep] = useState<1 | 2>(1);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  // Stato per il form della modalità Offline
  const [offlineForm, setOfflineForm] = useState({
    username: "Giocatore 1",
    starterBet: 10,
    numPlayers: 4,
  });

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Inviando i dati...", form);

    if (!isLogin && registrationStep === 1) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users/send-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: form.email }),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          showSwal({ type: "error", title: data.message, alert: true });
          return;
        }

        showSwal({
          type: "success",
          title: "Codice OTP inviato!",
          alert: false,
        });
        setRegistrationStep(2);
      } catch (error) {
        console.error("Errore nell'invio OTP:", error);
        showSwal({
          type: "error",
          title: "Errore di connessione",
          alert: true,
        });
      }
      return;
    }

    try {
      const url = isLogin
        ? `${import.meta.env.VITE_API_URL}/api/v1/users/login`
        : `${import.meta.env.VITE_API_URL}/api/v1/users/register`;

      const payload: LoginCredentials | RegisterCredentials = isLogin
        ? { email: form.email, password: form.password }
        : {
            username: form.username || "",
            email: form.email,
            password: form.password,
            otp: form.otp || "",
          };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AuthResponse & {
        user?: { accessToken: string }; // con questo vedo se nella risposta è presente il campo user, per accedere nel caso al JWT
      };

      if (!response.ok) {
        console.error("Errore dal server:", data);
        showSwal({
          type: "error",
          title: data.message,
          alert: true,
        });
        return;
      }

      console.log("Successo!", data);

      if (isLogin) {
        const accessTokenServer = data.user?.accessToken;
        if (accessTokenServer) {
          localStorage.setItem("tokenPiatto", accessTokenServer);
          navigate("/lobbies", { state: { justLoggedIn: true } });
        } else {
          console.error("Token non trovato nella risposta del server");
        }
      } else {
        showSwal({
          type: "login_register",
          title: "Registrazione completata! Ora puoi fare il login",
          alert: false,
        });
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Errore di rete bloccante:", error);
      showSwal({
        type: "error",
        title: "Hai bisogno di una connessione per accedere al servizio...",
        alert: true,
      });
    }
  };

  useEffect(() => {
    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => setIsOnline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLogin) {
      setRegistrationStep(1);
    }
  }, [isLogin]);

  return (
    <div
      className="min-h-screen w-full flex justify-center items-start pt-[12vh] bg-no-repeat bg-center bg-cover"
      style={{ backgroundImage: `url(${authBg})`, imageRendering: "pixelated" }}
    >
      <div className="bg-[#141419]/95 text-white py-10 px-12 min-w-[320px] border-4 border-[#f39c12] rounded flex flex-col items-center shadow-[12px_12px_0px_rgba(0,0,0,0.8)]">
        {/* CONDIZIONE PRINCIPALE: ONLINE vs OFFLINE */}
        {isOnline ? (
          <>
            <h1 className="mt-0 mb-6 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-2xl font-bold text-center">
              {isLogin ? "Accedi a Piatto 🃏" : "Registrati a Piatto 🃏"}
            </h1>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 w-full"
            >
              {!isLogin && registrationStep === 2 && (
                <input
                  type="text"
                  name="otp"
                  placeholder="Codice OTP (inviato via email)"
                  value={form.otp}
                  onChange={handleChange}
                  required
                  className="p-2.5 text-base rounded-md border border-[#444] bg-[#1e1e1e] text-white focus:outline-none focus:border-[#f39c12] transition-colors"
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
                  className="p-2.5 text-base rounded-md border border-[#444] bg-[#1e1e1e] text-white focus:outline-none focus:border-[#f39c12] transition-colors"
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
                className="p-2.5 text-base rounded-md border border-[#444] bg-[#1e1e1e] text-white focus:outline-none focus:border-[#f39c12] transition-colors disabled:opacity-50"
              />

              {(isLogin || (!isLogin && registrationStep === 2)) && (
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="p-2.5 text-base rounded-md border border-[#444] bg-[#1e1e1e] text-white focus:outline-none focus:border-[#f39c12] transition-colors"
                />
              )}

              <button
                type="submit"
                className="p-2.5 text-lg mt-2.5 bg-[#f39c12] text-white rounded-md font-bold hover:bg-[#d68910] transition-colors shadow-md"
              >
                {isLogin
                  ? "Entra nel locale"
                  : registrationStep === 1
                    ? "Invia OTP"
                    : "Crea un account"}
              </button>
            </form>

            <p className="mt-5 text-center">
              {isLogin ? "Non hai un account? " : "Sei già dei nostri? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="bg-transparent border-none text-[#f39c12] cursor-pointer underline text-base p-0 hover:text-[#d68910] transition-colors"
              >
                {isLogin ? "Registrati" : "Accedi"}
              </button>
            </p>
          </>
        ) : (
          /* SEZIONE MOSTRATA SOLO QUANDO OFFLINE */
          <div className="flex flex-col items-center justify-center p-6 bg-gray-900 rounded-xl shadow-2xl text-white w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-orange-400">
              Connessione Assente 📡
            </h2>
            <p className="text-gray-300 mb-6 text-sm text-center">
              Imposta il tuo tavolo locale e gioca contro i Bot!
            </p>

            <form
              className="flex flex-col gap-4 w-full"
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
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                required
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">
                    Puntata Iniziale
                  </label>
                  <input
                    type="number"
                    name="starterBet"
                    value={offlineForm.starterBet}
                    onChange={handleOfflineChange}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">
                    Num. Giocatori
                  </label>
                  <select
                    name="numPlayers"
                    value={offlineForm.numPlayers}
                    onChange={handleOfflineChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  >
                    <option value={2}>2 Giocatori</option>
                    <option value={3}>3 Giocatori</option>
                    <option value={4}>4 Giocatori</option>
                    <option value={5}>5 Giocatori</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(243,156,18,0.4)]"
              >
                Crea Tavolo Offline
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
