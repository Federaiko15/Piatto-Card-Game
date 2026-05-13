import { useState } from "react";
import "../styles/PlayerProfile.css";
import type { UserProfile } from "../types";
import showSwal from "../services/CustomAlert";
import { fetchWithAuth } from "../services/fetchWithAuth";
import { useNavigate } from "react-router-dom";

interface PlayerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

const PlayerProfile = ({
  isOpen,
  onClose,
  userProfile,
  onLogout,
}: PlayerProfileProps) => {
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [deleteAccount, setDeleteAccount] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const navigate = useNavigate();

  const fetchNewCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showSwal({
        type: "error",
        title: "Le password non corrispondono!",
        alert: true,
      });
      return;
    }
    try {
      const options = {
        method: "PUT",
        body: JSON.stringify({
          email: userProfile?.email,
          password: oldPassword,
          newPassword: newPassword,
        }),
      };

      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/v1/users/updatePassword`,
        options,
      );

      if (!response.ok) {
        showSwal({
          type: "game-alert",
          title: "Qualcosa è andato storto...",
          alert: false,
        });
        return;
      } else {
        setChangePassword(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showSwal({
          type: "game-advice",
          title: "Cambio password avvenuto con successo",
          alert: false,
        });
      }
    } catch (error) {
      showSwal({
        type: "game-alert",
        title: "Qualcosa è andato storto...",
        alert: false,
      });
      console.error("Server Error nella modifica della password", error);
      return;
    }
  };

  const fetchDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (oldPassword !== confirmPassword) {
      showSwal({
        type: "error",
        title: "Le password non corrispondono!",
        alert: true,
      });
      return;
    }
    const wantToDelete = await showSwal({
      type: "logout",
      title:
        "Sei sicuro di voler eliminare completamente il tuo profilo? Tutti i tuoi dati saranno correttamente rimossi!",
      alert: true,
    });

    if (!wantToDelete) {
      return;
    }
    try {
      const options = {
        method: "DELETE",
        body: JSON.stringify({
          password: oldPassword,
        }),
      };

      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/v1/users/profile/${userProfile?._id}`,
        options,
      );

      if (!response.ok) {
        showSwal({
          type: "game-alert",
          title: "Qualcosa è andato storto...",
          alert: false,
        });
        return;
      } else {
        setDeleteAccount(false);
        setOldPassword("");
        setConfirmPassword("");
        navigate("/");
        showSwal({
          type: "game-advice",
          title: "Cambio password avvenuto con successo",
          alert: false,
        });
      }
    } catch (error) {
      showSwal({
        type: "game-alert",
        title: "Qualcosa è andato storto...",
        alert: false,
      });
      console.error("Server Error nella modifica della password", error);
      return;
    }
  };

  return (
    <>
      {/* Overlay scuro per chiudere la finestra cliccando fuori */}
      <div
        className={`profile-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      {/* Finestra laterale (Sidebar) */}
      <div className={`profile-sidebar ${isOpen ? "open" : ""}`}>
        <div className="profile-header">
          <h2>Il Tuo Profilo</h2>
          <button className="close-btn" onClick={onClose}>
            X
          </button>
        </div>

        <div className="profile-content">
          {userProfile ? (
            <>
              <div className="profile-avatar">👤</div>
              <h3 className="profile-username">{userProfile.username}</h3>
              <p className="profile-email">{userProfile.email}</p>

              <div className="profile-stats">
                <div className="stat-box">
                  <span className="stat-label">Saldo Attuale</span>
                  <span className="stat-value">💰 {userProfile.balance}</span>
                </div>
              </div>

              <div className="profile-change-credentials">
                <button onClick={() => setChangePassword(!changePassword)}>
                  Modifica la password
                </button>
                {changePassword && (
                  <form
                    onSubmit={fetchNewCredentials}
                    className="form-change-password"
                  >
                    <input
                      type="password"
                      placeholder="Vecchia Password"
                      required
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Nuova Password"
                      required
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Conferma Password"
                      required
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="submit" className="btn-change-password">
                      Conferma
                    </button>
                  </form>
                )}
              </div>

              <div className="delete-account">
                <button onClick={() => setDeleteAccount(!deleteAccount)}>
                  Elimina il tuo account
                </button>
                {deleteAccount && (
                  <form
                    onSubmit={fetchDeleteAccount}
                    className="form-change-password"
                  >
                    <input
                      type="password"
                      placeholder="Inserisci la password"
                      required
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Conferma la password"
                      required
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="submit" className="btn-change-password">
                      Conferma
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="profile-loading">
              <div className="spinner"></div>
              <p>Caricamento profilo in corso...</p>
            </div>
          )}
        </div>
        <div className="profile-footer">
          <button className="profile-logout-btn" onClick={onLogout}>
            Esci dal locale
          </button>
        </div>
      </div>
    </>
  );
};

export default PlayerProfile;
