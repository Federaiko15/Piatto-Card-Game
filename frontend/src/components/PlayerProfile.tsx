import "../styles/PlayerProfile.css";
import type { UserProfile } from "../types";

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
