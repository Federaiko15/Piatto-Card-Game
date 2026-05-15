import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth.tsx";
import Lobbies from "./pages/Lobbies.tsx";
import GameRoom from "./pages/GameRoom.tsx";
import OfflineTable from "./pages/OfflineTable.tsx";
import TermsAndCondition from "./pages/TermsAndConditions.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/lobbies" element={<Lobbies />} />
        <Route path="/game/:lobbyId" element={<GameRoom />} />
        <Route path="/offline-room" element={<OfflineTable />} />
        <Route path="/terms" element={<TermsAndCondition />} />
      </Routes>
    </BrowserRouter>
  );
}
