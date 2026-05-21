// qui ho utilizzato tailwind perchè volevo convertire l'intero progetto eliminando tutti i file css, ma non ho avuto abbastanza tempo
// per farlo

import PlayerSeat from "./PlayerSeat";
import type { Player } from "../types";

interface WaitingRoomProps {
  lobbyId: string | undefined;
  rotatedPlayers: Player[];
  personalId: string | null;
  amITheCreator: boolean;
  onDeleteLobby: () => void;
  onLeaveLobby: () => void;
}

export default function WaitingRoom({
  lobbyId,
  rotatedPlayers,
  personalId,
  amITheCreator,
  onDeleteLobby,
  onLeaveLobby,
}: WaitingRoomProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2.5 text-white max-w-200 w-[90%]">
      <h2 className="text-[#bdc3c7] text-2xl font-bold mb-2">
        Lobby: {lobbyId}
      </h2>
      <h1 className="text-[#ffd700] text-3xl sm:text-4xl font-bold [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">
        In attesa dei giocatori...
      </h1>
      <p>La partita inizierà quando il tavolo sarà al completo.</p>

      <div className="flex flex-wrap justify-center gap-5 my-7.5">
        {rotatedPlayers.length === 0 ? (
          <p style={{ color: "#aaa" }}>Caricamento giocatori in corso...</p>
        ) : (
          rotatedPlayers.map((player) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isHero={player.id === personalId}
              isActive={false}
            />
          ))
        )}
      </div>

      <div className="mt-5">
        {amITheCreator ? (
          <button
            className="px-5 py-2.5 text-white bg-[#e74c3c] hover:bg-[#c0392b] border-none rounded-[5px] cursor-pointer font-bold shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-105"
            onClick={onDeleteLobby}
          >
            Elimina Lobby
          </button>
        ) : (
          <button
            className="px-5 py-2.5 text-white bg-[#f39c12] hover:bg-[#d68910] border-none rounded-[5px] cursor-pointer font-bold shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-105"
            onClick={onLeaveLobby}
          >
            Esci dalla Lobby
          </button>
        )}
      </div>
    </div>
  );
}
