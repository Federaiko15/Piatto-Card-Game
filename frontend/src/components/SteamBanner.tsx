import { useState, useEffect } from "react";
import type { SteamPollResponse, SteamPollStats } from "../types";
import showSwal from "../services/CustomAlert";
import { fetchWithAuth } from "../services/fetchWithAuth";
import SocialLinks from "./SocialLinks";
import "../styles/SteamBanner.css";

export default function SteamBanner() {
  const [stats, setStats] = useState<SteamPollStats | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Carica i dati del sondaggio all'avvio
  useEffect(() => {
    const fetchPollData = async () => {
      setIsLoading(true);
      try {
        const res = await fetchWithAuth(
          `${import.meta.env.VITE_API_URL}/api/v1/steam-poll`,
        );

        if (res.ok) {
          const data: SteamPollResponse = await res.json();
          setStats(data.stats);
          if (data.hasVoted) {
            setHasVoted(true);
            setUserVote(data.userVote);
          }
        }
      } catch (err) {
        console.error("Errore nel caricamento del sondaggio Steam:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPollData();
  }, []);

  const handleVote = async (vote: "yes" | "no") => {
    if (hasVoted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/v1/steam-poll/vote`,
        {
          method: "POST",
          body: JSON.stringify({ vote }),
        },
      );

      const data: SteamPollResponse = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setHasVoted(true);
        setUserVote(vote);

        showSwal({
          type: "game-advice",
          title: "Grazie per il tuo feedback su Steam! 🎮",
          alert: false,
        });
      } else {
        if (data.message?.includes("già espresso")) {
          setHasVoted(true);
          setUserVote(vote);
        }
        showSwal({
          type: "error",
          title: data.message || "Errore durante il voto",
          alert: true,
        });
      }
    } catch (err) {
      console.error("Errore invio voto:", err);
      showSwal({
        type: "error",
        title: "Impossibile inviare il voto. Controlla la connessione.",
        alert: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside
      aria-label="Sondaggio interesse Steam"
      className={`steam-banner-wrapper ${isCollapsed ? "collapsed" : ""}`}
    >
      <div className="steam-banner-header">
        <div className="steam-banner-badge">
          <span className="steam-icon" role="img" aria-label="controller">
            🎮
          </span>
          <span className="steam-badge-text">SONDAGGIO STEAM COMMUNITY</span>
        </div>
        <button
          type="button"
          className="steam-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Espandi banner" : "Riduci banner"}
          aria-label={isCollapsed ? "Espandi banner sondaggio" : "Riduci banner sondaggio"}
        >
          {isCollapsed ? "▲ Espandi" : "▼ Riduci"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="steam-banner-body">
          <h2 className="steam-banner-title">
            Vorresti scaricare <span>Piatto</span> su Steam?
          </h2>
          <p className="steam-banner-desc">
            Stiamo valutando la pubblicazione su <strong>Steam</strong> con una
            versione estesa contenente non solo <em>Piatto</em>, ma anche altri
            grandi classici dei <strong>giochi di carte siciliane</strong>{" "}
            (Cucù, Cavalli, Scopa, Briscola, Tressette e multiplayer online)!
          </p>
          <p className="steam-banner-invite">
            📢 <strong>Esprimi il tuo voto e seguici sui nostri canali social</strong> per non perderti novità, anteprime esclusive e annunci sul lancio!
          </p>

          {isLoading ? (
            <div className="steam-loading">Caricamento statistiche...</div>
          ) : hasVoted ? (
            <div className="steam-voted-box">
              <div className="steam-voted-badge">
                ✅ Hai votato:{" "}
                <strong>
                  {userVote === "yes" ? "SÌ, lo vorrei!" : "No, preferisco web"}
                </strong>
              </div>

              {stats && stats.totalVotes > 0 && (
                <div className="steam-stats-section">
                  <div className="steam-stats-labels">
                    <span className="steam-stat-fav">
                      🔥 Favorevoli: {stats.yesPercentage}% ({stats.yesCount})
                    </span>
                    <span className="steam-stat-total">
                      Totale voti: {stats.totalVotes}
                    </span>
                  </div>
                  <div className="steam-progress-bar-bg">
                    <div
                      className="steam-progress-bar-fill"
                      style={{ width: `${stats.yesPercentage}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="steam-thank-you">
                Grazie per averci aiutato a decidere il futuro del gioco! 🚀
              </p>
            </div>
          ) : (
            <div className="steam-actions">
              <button
                type="button"
                className="steam-btn steam-btn-yes"
                onClick={() => handleVote("yes")}
                disabled={isSubmitting}
              >
                🔥 Sì, lo scaricherei subito!
              </button>
              <button
                type="button"
                className="steam-btn steam-btn-no"
                onClick={() => handleVote("no")}
                disabled={isSubmitting}
              >
                ❌ No, solo via browser
              </button>
            </div>
          )}

          {/* Sezione Canali Social Ufficiali */}
          <SocialLinks
            title="Seguici per non perdere nessun aggiornamento 🚀"
            variant="banner"
          />
        </div>
      )}
    </aside>
  );
}
