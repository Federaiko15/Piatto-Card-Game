import { BrowserRouter, Routes, Route } from "react-router-dom";
import ModeSelect from "./pages/ModeSelect.tsx";
import Auth from "./pages/Auth.tsx";
import Lobbies from "./pages/Lobbies.tsx";
import GameRoom from "./pages/GameRoom.tsx";
import OfflineSetup from "./pages/OfflineSetup.tsx";
import RoguelikeMenu from "./pages/RoguelikeMenu.tsx";
import RoguelikeRun from "./pages/RoguelikeRun.tsx";
import OfflineTable from "./pages/OfflineTable.tsx";
import TermsAndCondition from "./pages/TermsAndConditions.tsx";

export default function App() {
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
