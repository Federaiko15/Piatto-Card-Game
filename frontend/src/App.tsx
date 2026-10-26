import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ModeSelect from "./pages/ModeSelect.tsx";
import Auth from "./pages/Auth.tsx";
import Lobbies from "./pages/Lobbies.tsx";
import GameRoom from "./pages/GameRoom.tsx";
import OfflineSetup from "./pages/OfflineSetup.tsx";
import RoguelikeMenu from "./pages/RoguelikeMenu.tsx";
import RoguelikeRun from "./pages/RoguelikeRun.tsx";
import OfflineTable from "./pages/OfflineTable.tsx";
import TermsAndCondition from "./pages/TermsAndConditions.tsx";
import { ITCH } from "./edition";

export default function App() {
  // su itch.io il gioco sta in una sottocartella dentro un iframe: le pagine si tengono dopo il #
  // e c'è solo la roguelike, che non ha bisogno del backend
  if (ITCH) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/roguelike" element={<RoguelikeMenu />} />
          <Route path="/roguelike/run" element={<RoguelikeRun />} />
          <Route path="*" element={<Navigate to="/roguelike" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModeSelect />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/lobbies" element={<Lobbies />} />
        <Route path="/game/:lobbyId" element={<GameRoom />} />
        <Route path="/roguelike" element={<RoguelikeMenu />} />
        <Route path="/roguelike/run" element={<RoguelikeRun />} />
        <Route path="/offline" element={<OfflineSetup />} />
        <Route path="/offline-room" element={<OfflineTable />} />
        <Route path="/terms" element={<TermsAndCondition />} />
      </Routes>
    </BrowserRouter>
  );
}
