import "../styles/UserAvatar.css";

interface UserAvatarProps {
  username?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isHero?: boolean;
  isBot?: boolean;
  className?: string;
  avatarIcon?: string;
}

// Palette di gradienti moderni e distinti determinati dal nome utente
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #059669, #10b981)", // Smeraldo
  "linear-gradient(135deg, #d97706, #f59e0b)", // Oro
  "linear-gradient(135deg, #1d4ed8, #3b82f6)", // Zaffiro
  "linear-gradient(135deg, #7c3aed, #8b5cf6)", // Viola
  "linear-gradient(135deg, #b91c1c, #ef4444)", // Rubino
  "linear-gradient(135deg, #c2410c, #f97316)", // Ambra
  "linear-gradient(135deg, #0e7490, #06b6d4)", // Ciano
  "linear-gradient(135deg, #be185d, #ec4899)", // Magenta
];

// Funzione hash per associare sempre lo stesso gradiente a uno username
function getGradientForUser(username: string): string {
  if (!username) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

// Estrae le iniziali (1 o 2 lettere)
function getInitials(username: string): string {
  if (!username) return "?";
  const clean = username.trim().toUpperCase();
  if (clean.length <= 2) return clean;
  const parts = clean.split(/[ _-]/);
  if (parts.length > 1 && parts[0] && parts[1]) {
    return parts[0][0] + parts[1][0];
  }
  return clean.slice(0, 2);
}

export default function UserAvatar({
  username = "Giocatore",
  size = "md",
  isHero = false,
  isBot = false,
  className = "",
  avatarIcon,
}: UserAvatarProps) {
  const gradient = isBot
    ? "linear-gradient(135deg, #475569, #334155)"
    : getGradientForUser(username);

  const initials = isBot ? "🤖" : getInitials(username);
  const content = avatarIcon || initials;

  return (
    <div
      className={`user-avatar user-avatar-${size} ${isHero ? "avatar-hero" : ""} ${className}`}
      style={{ background: gradient }}
      title={username}
    >
      <span className="user-avatar-content">{content}</span>
    </div>
  );
}
