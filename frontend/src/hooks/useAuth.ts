import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export function useAuth() {
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
  const [isForcedOffline, setIsForcedOffline] = useState<boolean>(false);

  // STATI PER IL RECUPERO PASSWORD
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Stato per il form della modalità Offline
  const [offlineForm, setOfflineForm] = useState({
    username: "Giocatore 1",
    starterBet: 10,
    numPlayers: 4,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

  const handleForgotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (forgotStep === 1) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users/send-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: forgotForm.email }),
          },
        );

        if (!response.ok) {
          showSwal({
            type: "error",
            title: "Errore di connessione",
            alert: true,
          });
        }
        setForgotStep(2);
      } catch (error) {
        showSwal({
          type: "error",
          title: "Errore di connessione",
          alert: true,
        });
        return;
      }
    } else {
      if (forgotForm.newPassword !== forgotForm.confirmPassword) {
        showSwal({
          type: "error",
          title: "Le password non coincidono!",
          alert: true,
        });
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users/resetPassword`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: forgotForm.email,
              newPassword: forgotForm.newPassword,
              confirmPassword: forgotForm.confirmPassword,
              otp: forgotForm.otp,
            }),
          },
        );

        if (!response.ok) {
          showSwal({
            type: "game-error",
            title: "Errore nel reimpostare la password",
            alert: false,
          });
        }

        showSwal({
          type: "game-advice",
          title: "Password reimpostata con successo!",
          alert: false,
        });
        setIsForgotPassword(false);
        setForgotStep(1);
        setForgotForm({
          email: "",
          otp: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch {
        showSwal({
          type: "error",
          title: "Server Error",
          alert: true,
        });
      }
    }
  };

  return {
    form,
    setForm,
    isLogin,
    setIsLogin,
    registrationStep,
    isOnline,
    isForcedOffline,
    setIsForcedOffline,
    offlineForm,
    setOfflineForm,
    handleSubmit,
    navigate,
    isForgotPassword,
    setIsForgotPassword,
    forgotStep,
    setForgotStep,
    forgotForm,
    setForgotForm,
    handleForgotChange,
    handleForgotSubmit,
  };
}
