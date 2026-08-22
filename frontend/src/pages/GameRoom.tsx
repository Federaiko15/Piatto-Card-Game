import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/GameRoom.css";
import PlayerSeat from "../components/PlayerSeat";
import { GameActions } from "../services/GameActions";
import { useGameEngine } from "../hooks/useGameEngine";
import NavbarChat from "../components/NavbarChat";
import WaitingRoom from "../components/WaitingRoom";
import HeroControls from "../components/HeroControls";
import Card from "../components/Cards";
import piatto from "../assets/piatto.png";
import croupier from "../assets/croupier.png";
import coins from "../assets/coins.png";
import tableBg from "../assets/table.png";
import type { SingleCard } from "../types";
import showSwal from "../services/CustomAlert.ts";

export default function GameRoom() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();

  // 1. ESTRAIAMO I DATI DAL CUSTOM HOOK
  const {
    rotatedPlayers,
    isGameStarted,
    gameSocket,
    card,
    pot,
    isMyTurn,
    activePlayerId,
    chatMessages,
    personalId,
    idCreator,
    isGameFinished,
    isWaitingRematch,
    newMazzo,
  } = useGameEngine(lobbyId);

  const [isCardHidden, setIsCardHidden] = useState<boolean>(true);
  const [displayedCard, setDisplayedCard] = useState<SingleCard>({
    seed: "",
    value: 0,
  });

  // ANIMAZIONE CARTA
  useEffect(() => {
    let innerTimer: ReturnType<typeof setTimeout>;
    if (card && card.value > 0) {
      setIsCardHidden(true);
      const swapTimer = setTimeout(() => {
        setDisplayedCard(card);
        innerTimer = setTimeout(() => setIsCardHidden(false), 50);
      }, 300);
      return () => {
        clearTimeout(swapTimer);
        clearTimeout(innerTimer);
      };
    } else {
      setIsCardHidden(true);
    }
  }, [card]);

  // Posizioni fisse per il tavolo verde (Faccia B)
  const seatPosition = [
    "bottom-center",
    "low-right",
    "low-left",
    "mid-right",
    "PIATTO-HUB",
    "mid-left",
    "high-right",
    "CROUPIER-HUB",
    "high-left",
  ];

  const availableSeatIndices = [0, 1, 2, 3, 5, 6, 8];

  const amITheCreator = personalId === idCreator;

  const handleLeaveLobby = async () => {
    const confirmed = await showSwal({
      type: "leave_lobby",
      title: "Sei sicuro di voler uscire?",
      alert: true,
    });

    if (confirmed) {
      GameActions.logout(gameSocket, lobbyId!);
      navigate("/lobbies");
    }
  };

  const handleDeleteLobby = async () => {
    const confirmed = await showSwal({
      type: "leave_lobby",
      title: "Sei sicuro di voler cancellare la lobby?",
      alert: true,
    });

    if (confirmed) {
      GameActions.deleteRoom(gameSocket, lobbyId!);
      navigate("/lobbies");
    }
  };

  // ==========================================
  // FACCIA A: LA SALA D'ATTESA
  // ==========================================
  if (!isGameStarted) {
    return (
      <div className="game-room-container">
        <WaitingRoom
          lobbyId={lobbyId}
          rotatedPlayers={rotatedPlayers}
          personalId={personalId}
          amITheCreator={amITheCreator}
          onDeleteLobby={handleDeleteLobby}
          onLeaveLobby={handleLeaveLobby}
        />
      </div>
    );
  }

  // ==========================================
  // FACCIA B: IL TAVOLO VERDE (Partita Iniziata)
  // ==========================================
  return (
    <div className="game-room-container">
      <NavbarChat
        socket={gameSocket}
        lobbyId={lobbyId!}
        messages={chatMessages}
        playersInfo={rotatedPlayers}
      />

      <div className="poker-table">
        <img
          src={tableBg}
          alt="Tavolo da gioco"
          className="table-background-image"
        />

        {/* OVERLAY FINE PARTITA */}
        {isGameFinished && !isWaitingRematch && (
          <div className="rematch-overlay">
            <div className="rematch-box">
              <h2>Partita conclusa</h2>
              <p>
                Attendi un istante, stiamo verificando se avviare il rematch...
              </p>
            </div>
          </div>
        )}

        {/* OVERLAY ATTESA RISPOSTE */}
        {isWaitingRematch && (
          <div className="rematch-overlay">
            <div className="rematch-box">
              <h2>Rematch confermato</h2>
              <p>In attesa della risposta degli altri utenti...</p>
            </div>
          </div>
        )}

        {/* IL CROUPIER E LA CARTA (In alto) */}
        <div className="grid-cell high-center">
          {newMazzo && (
            <div className="new-mazzo-message">
              <p>E' stato generato un nuovo mazzo per continuare la partita</p>
            </div>
          )}
          <div className="table-high-center">
            <img src={croupier} alt="Croupier" className="pixel-image croupier-img" />
            {displayedCard.value > 0 && (
              <div className="card-display">
                <Card
                  seed={displayedCard.seed}
                  value={displayedCard.value}
                  isHidden={isCardHidden}
                />
              </div>
            )}
          </div>
        </div>

        {/* IL PIATTO E I SOLDI */}
        <div className="grid-cell mid-center">
          <div className="table-center">
            <div className="piatto-container">
              <img src={piatto} alt="Piatto" className="pixel-image piatto-img" />
            </div>
            <div className="pot-container">
              <p className="paragraph-coin">
                <span className="pot-amount">{pot}</span>
                <img src={coins} alt="Monete" className="pixel-coins" />
              </p>
            </div>
          </div>
        </div>

        {/* I GIOCATORI AL TAVOLO */}
        {rotatedPlayers.map((player, index) => {
          const finalSeat = availableSeatIndices[index];
          const positionGrid = seatPosition[finalSeat];
          const isThisSetActive = player.id === activePlayerId;
          const isHero = index === 0;
          const controlsDisabled =
            !isMyTurn || isGameFinished || isWaitingRematch;

          return (
            <div key={player.id} className={`grid-cell ${positionGrid}`}>
              {/* INTERFACCIA DELLO USER PRINCIPALE (Comandi) */}
              {isHero && (
                <>
                  {isMyTurn && !isGameFinished && !isWaitingRematch && (
                    <div className="my-turn-alert">🌟 È IL TUO TURNO! 🌟</div>
                  )}

                  <HeroControls
                    gameSocket={gameSocket}
                    lobbyId={lobbyId!}
                    player={player}
                    pot={pot}
                    controlsDisabled={controlsDisabled}
                  />
                </>
              )}

              {/* IL COMPONENTE DEL POSTO */}
              <PlayerSeat
                player={player}
                isHero={isHero}
                isActive={
                  isThisSetActive && !isGameFinished && !isWaitingRematch
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
