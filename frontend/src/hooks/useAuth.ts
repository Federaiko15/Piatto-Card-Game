// all'interno di questo file non potevo chiamare la funzione fetchWithAuth, perchè ancora i token devono essere creati, quindi
// a differenza degli altri file, ho dovuto chiamare la funzione normale passando tutti i metodo necessari,
// cosa che non faccio negli altri perchè, ad esempio l'headers, viene attaccato direttamente in fetchWithAuth

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from "../types";
import showSwal from "../services/CustomAlert";
import { notificationManager } from "../services/NotificationManager";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasOtpFailed, setHasOtpFailed] = useState<boolean>(false);

  // STATI PER IL RECUPERO PASSWORD
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [hasForgotOtpFailed, setHasForgotOtpFailed] = useState<boolean>(false);

  // Stato per il form della modalità Offline
  const [offlineForm, setOfflineForm] = useState({
    username: "Giocatore 1",
    starterBet: 10,
    numPlayers: 4,
  });

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, type: "register" }),
          credentials: "include",
        },
      );

      const data = await response.json();
      if (!response.ok) {
        showSwal({
          type: "error",
          title: data.message || "Impossibile inviare il codice OTP",
          alert: true,
        });
        return;
      }

      showSwal({
        type: "game-advice",
        title: data.message || "Codice OTP inviato!",
        alert: false,
      });
      setRegistrationStep(2);
      setHasOtpFailed(false);
    } catch (error) {
      console.error("Errore nell'invio OTP:", error);
      showSwal({
        type: "error",
        title: "Errore di connessione con il server",
        alert: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const payload: RegisterCredentials = {
        username: form.username || "",
        email: form.email,
        password: form.password,
        otp: form.otp || "",
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );

      const data = (await response.json()) as AuthResponse & { error?: string };

      if (!response.ok) {
        console.error("Errore dal server:", data);
        showSwal({
          type: "error",
          title: data.message || data.error || "Errore durante la registrazione",
          alert: true,
        });
        setHasOtpFailed(true);
        return;
      }

      showSwal({
        type: "login_register",
        title: data.message || "Registrazione completata! Ora puoi fare il login",
        alert: false,
      });
      setIsLogin(true);
      setRegistrationStep(1);
      setForm((prev) => ({ ...prev, otp: "", password: "" }));
    } catch (error) {
      console.error("Errore di rete bloccante:", error);
      showSwal({
        type: "error",
        title: "Hai bisogno di una connessione per accedere al servizio...",
        alert: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const payload: LoginCredentials = {
        email: form.email,
        password: form.password,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include", // in questa funzione di login è fondamentale avere credentials:include, perchè così
          // e possibile salvare il refresh token nel cookie https
        },
      );

      const data = (await response.json()) as AuthResponse & {
        user?: { accessToken: string };
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

      const accessTokenServer = data.user?.accessToken;
      if (accessTokenServer) {
        localStorage.setItem("tokenPiatto", accessTokenServer);

        // Richiediamo i permessi per le notifiche
        await notificationManager.requestPermission();

        navigate("/lobbies", { state: { justLoggedIn: true } });
      } else {
        console.error("Token non trovato nella risposta del server");
      }
    } catch (error) {
      console.error("Errore di rete bloccante:", error);
      showSwal({
        type: "error",
        title: "Hai bisogno di una connessione per accedere al servizio...",
        alert: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLogin) {
      await handleLogin();
    } else if (registrationStep === 1) {
      await handleSendOtp();
    } else {
      await handleRegister();
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

  const handleForgotSendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotForm.email, type: "reset" }),
          credentials: "include",
        },
      );

      const data = await response.json();
      if (!response.ok) {
        showSwal({
          type: "error",
          title: data.message || "Errore durante l'invio del codice OTP",
          alert: true,
        });
        return;
      }

      showSwal({
        type: "game-advice",
        title:
          forgotStep === 2
            ? "Nuovo codice OTP inviato!"
            : data.message || "Codice OTP inviato!",
        alert: false,
      });
      setForgotStep(2);
      setHasForgotOtpFailed(false);
    } catch (error) {
      console.error("Errore invio OTP recupero password:", error);
      showSwal({
        type: "error",
        title: "Errore di connessione con il server",
        alert: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (forgotStep === 1) {
      await handleForgotSendOtp();
    } else {
      setIsLoading(true);
      if (forgotForm.newPassword !== forgotForm.confirmPassword) {
        showSwal({
          type: "error",
          title: "Le password non coincidono!",
          alert: true,
        });
        setIsLoading(false);
        return;
      }

      if (forgotForm.newPassword.length < 6) {
        showSwal({
          type: "error",
          title: "La password deve contenere almeno 6 caratteri!",
          alert: true,
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users/resetPassword`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: forgotForm.email,
              newPassword: forgotForm.newPassword,
              confirmPassword: forgotForm.confirmPassword,
              otp: forgotForm.otp,
            }),
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          showSwal({
            type: "error",
            title: data.message || "Errore nel reimpostare la password",
            alert: true,
          });
          setHasForgotOtpFailed(true);
          return;
        }

        showSwal({
          type: "game-advice",
          title: data.message || "Password reimpostata con successo!",
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
      } catch (error) {
        console.error("Errore reset password:", error);
        showSwal({
          type: "error",
          title: "Errore di connessione con il server",
          alert: true,
        });
      } finally {
        setIsLoading(false);
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
    isLoading,
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
    hasOtpFailed,
    handleSendOtp,
    hasForgotOtpFailed,
    handleForgotSendOtp,
  };
}
