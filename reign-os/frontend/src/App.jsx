import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clients from "./pages/Clients.jsx";
import Mentions from "./pages/Mentions.jsx";
import Suppression from "./pages/Suppression.jsx";
import Reports from "./pages/Reports.jsx";
import Legal from "./pages/Legal.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex bg-bg text-text">
      <Sidebar />
      <main className="flex-1 md:ml-[220px] min-w-0">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/mentions" element={<Mentions />} />
            <Route path="/suppression" element={<Suppression />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
