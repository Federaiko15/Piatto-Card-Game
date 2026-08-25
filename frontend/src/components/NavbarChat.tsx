import { useState, useRef, useEffect } from "react";
import "../styles/NavbarChat.css";
import { GameActions } from "../services/GameActions";
import type { Socket } from "socket.io-client";
import type { SocketMessageChatResponse, Player } from "../types/index.ts";
import { useNavigate } from "react-router-dom";
import showSwal from "../services/CustomAlert.ts";

import UserAvatar from "./UserAvatar";

interface NavbarChatProps {
  socket: Socket | null;
  lobbyId: string;
  messages: SocketMessageChatResponse[];
  playersInfo: Player[];
}

const NavbarChat = ({
  socket,
  lobbyId,
  messages,
  playersInfo,
}: NavbarChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isCooldown, setIsCooldown] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const navigate = useNavigate();

  // Tracciamento messaggi non letti (SOLO messaggi degli utenti, escludendo i messaggi di sistema/turni)
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      prevMessagesLengthRef.current = messages.length;
    } else {
      if (messages.length > prevMessagesLengthRef.current) {
        const newMessages = messages.slice(prevMessagesLengthRef.current);
        const newUserMessages = newMessages.filter((msg) => msg.userId !== null).length;
        if (newUserMessages > 0) {
          setUnreadCount((prev) => prev + newUserMessages);
        }
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages, isOpen]);

  const toggleNavbar = () => {
    setIsOpen((prevState) => {
      if (!prevState) {
        setUnreadCount(0);
      }
      return !prevState;
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault(); // così si evita di ricaricare, ad ogni messaggio mandato, la pagina, cosa che farebbe saltare la connesione con il socket

    if (message.trim() === "") return; // controllo per i messaggi vuoti
    if (isCooldown) return; // Se l'utente è in cooldown, ignoriamo il click

    if (message.length > 150) {
      showSwal({
        type: "error",
        title: "Il messaggio è troppo lungo (max 150 caratteri)!",
        alert: true,
      });
      return;
    }

    GameActions.sendMessage(socket, lobbyId, message);
    setMessage(""); // meglio svuotare l'input dopo aver mandato il messaggio

    // Attiviamo il cooldown di 1.5 secondi per evitare lo spam
    setIsCooldown(true);
    setTimeout(() => {
      setIsCooldown(false);
    }, 1500);
  };
  // questo hook, useRef, è utilizzato per creare un riferimento, un ancora, ad un elemento html
  // lo utilizzo per far scorrere automaticamente la chat.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    const confirmed = await showSwal({
      type: "leave_lobby",
      title: "Sei sicuro di voler uscire?",
      alert: true,
    });

    if (confirmed) {
      GameActions.logout(socket, lobbyId!);
      navigate("/lobbies");
    }
  };

  // 3. L'effetto che si attiva quando cambiano i messaggi o si apre la chat
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  return (
    <div className="div-container">
      <button
        className={`navbar-toggle ${!isOpen && unreadCount > 0 ? "has-unread" : ""}`}
        onClick={toggleNavbar}
        aria-label="Apri o chiudi chat"
      >
        {isOpen ? (
          <span className="toggle-content">✕ Chiudi</span>
        ) : (
          <span className="toggle-content">
            💬 Chat
            {unreadCount > 0 && (
              <span className="chat-unread-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        )}
      </button>

      <nav className={`navbar ${isOpen ? "opened" : "closed"}`}>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>

        <div className="chat-history">
          {messages.length === 0 ? (
            <p className="chat-empty-message">
              Ancora nessun messaggio. Rompi il ghiaccio!
            </p>
          ) : (
            messages.map((msg, index) => {
              const isSystemMessage = msg.userId === null;

              // Messaggio di sistema (es. eventi di gioco)
              if (isSystemMessage) {
                return (
                  <div key={index} className="chat-message system-message">
                    <span className="chat-text">📢 {msg.message}</span>
                  </div>
                );
              }

              // Messaggio inviato da un utente
              const sender = playersInfo.find((p) => p.id === msg.userId);
              const displayName = sender
                ? sender.username
                : "Giocatore";

              return (
                <div key={index} className="chat-message-row">
                  <UserAvatar
                    username={displayName}
                    size="xs"
                    className="chat-avatar"
                  />
                  <div className="chat-bubble">
                    <span className="chat-username">{displayName}</span>
                    <span className="chat-text">{msg.message}</span>
                  </div>
                </div>
              );
            })
          )}
          {/* 4. Il div invisibile che fa da ancora per lo scroll */}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            type="text"
            placeholder="Scrivi in chat..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={150}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={isCooldown}
            className="chat-submit-btn"
          >
            {isCooldown ? "Wait..." : "Invia"}
          </button>
        </form>
      </nav>
    </div>
  );
};

export default NavbarChat;
