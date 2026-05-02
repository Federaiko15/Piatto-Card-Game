/**
 * ---------------------------------------------------------------------------
 * TYPESCRIPT DEFINITIONS
 * In questo file sono raggruppate tutte le interfacce per tipizzare i dati
 * scambiati tra Client e Server (REST e Socket) e i modelli di dominio.
 * ---------------------------------------------------------------------------
 */

// ==========================================
// 1. MODELLI DI DOMINIO (Core Entities)
// ==========================================
export interface User {
  _id: string;
  username: string;
  balance: number;
  status: string;
}

export interface Player {
  id: string;
  username: string;
  balance: number;
  status: string;
  currentBet: number;
}

export interface Lobby {
  _id: string;
  lobbyname: string;
  numPlayers: number;
  starterBet: number;
  activePlayers: string[]; // Array di ID utente
  owner: string;
  status: string;
}

export interface SingleCard {
  seed: string;
  value: number;
}

// ==========================================
// 2. AUTENTICAZIONE (JWT & Credentials)
// ==========================================
export interface JwtPayload {
  // Interfaccia usata in getIdFromToken per prendere l'id dell'utente dal JWT
  userId: string;
  iat: number;
  exp: number;
}

// Dati inviati dal form di Login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Dati inviati dal form di Registrazione
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// La risposta del Server dopo un Login/Registrazione di successo
export interface AuthResponse {
  message: string;
  token?: string; // Il token JWT
  user?: User;
}

// ==========================================
// 3. API REST (Requests & Responses)
// ==========================================

// Dati mandati dal client tramite il form per creare una nuova lobby
export interface NewLobbyData {
  lobbyname: string;
  starterBet: number;
  numPlayers: number;
}

export interface FetchLobbiesResponse {
  message: string;
  allFreeLobbies?: Lobby[];
}

export interface CreateLobbyResponse {
  message: string;
  lobby: Lobby;
}

export interface JoinLobbyApiResponse {
  message: string;
  existingLobby: Lobby;
}

// ==========================================
// 4. COMUNICAZIONE SOCKET.IO (Payloads)
// ==========================================
export interface JoinLobbyResponse {
  message: string;
  idCreatore: string;
  giocatoriAlTavolo: Player[];
}

export interface SocketJoinResponse {
  message: string;
  nuovoGiocatore?: string;
  nuovaPartita?: string;
  giocatoriAlTavolo?: Player[];
  piatto?: number;
  idCreatore?: string;
}

export interface SocketDrawResponse {
  message: string;
  card: SingleCard;
  nextTurn: number;
}

export interface SocketResolvedTurnResponse {
  card: SingleCard;
  winnerId: string; // Il server lo usa come ID di chi ha pescato
  message?: string;
  newBalance: number;
  newPiatto: number;
  nextTurn: number | null; // Il server invia null se isGameFinished è true
  isGameFinished: boolean;
}

export interface SocketMessageChatResponse {
  userId: string | null;
  message: string;
}

export interface SocketLogOutResponse {
  message: string;
  activePlayers?: Player[];
  finalPlayers?: Player[];
}

export interface SocketErrorResponse {
  message: string;
}

// ==========================================
// 5. COMPONENTI UI & UTILITY
// ==========================================
export interface AlertProps {
  type?: string;
  title: string;
  alert: boolean;
}
