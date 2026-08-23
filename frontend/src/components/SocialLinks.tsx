import showSwal from "../services/CustomAlert";
import "../styles/SocialLinks.css";

// Inserisci qui i link ai canali quando saranno pronti
export const SOCIAL_URLS = {
  discord: "", // es. "https://discord.gg/..."
  instagram: "", // es. "https://instagram.com/..."
  telegram: "", // es. "https://t.me/..."
  tiktok: "", // es. "https://tiktok.com/@..."
  youtube: "", // es. "https://youtube.com/@..."
};

interface SocialLinksProps {
  title?: string;
  variant?: "banner" | "footer";
}

export default function SocialLinks({
  title = "Seguici per non perdere nessun aggiornamento!",
  variant = "banner",
}: SocialLinksProps) {
  const handleSocialClick = (name: string, url: string) => {
    if (url && url.trim() !== "" && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      showSwal({
        type: "game-advice",
        title: `Il nostro canale ${name} sarà disponibile a breve! 🚀`,
        alert: false,
      });
    }
  };

  const socialItems = [
    {
      id: "discord",
      name: "Discord",
      icon: "💬",
      url: SOCIAL_URLS.discord,
      className: "social-btn-discord",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📸",
      url: SOCIAL_URLS.instagram,
      className: "social-btn-instagram",
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: "✈️",
      url: SOCIAL_URLS.telegram,
      className: "social-btn-telegram",
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: "🎵",
      url: SOCIAL_URLS.tiktok,
      className: "social-btn-tiktok",
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: "🎥",
      url: SOCIAL_URLS.youtube,
      className: "social-btn-youtube",
    },
  ];

  return (
    <div className={`social-links-container variant-${variant}`}>
      {title && <p className="social-links-title">{title}</p>}
      <div className="social-buttons-grid">
        {socialItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`social-btn ${item.className}`}
            onClick={() => handleSocialClick(item.name, item.url)}
            title={`Seguici su ${item.name}`}
            aria-label={`Canale ${item.name}`}
          >
            <span className="social-icon">{item.icon}</span>
            <span className="social-name">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
