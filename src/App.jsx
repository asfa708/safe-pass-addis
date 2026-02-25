import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ChatWidget from './components/ChatWidget';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RidesPage from './pages/RidesPage';
import FleetPage from './pages/FleetPage';
import VehiclesPage from './pages/VehiclesPage';
import ClientsPage from './pages/ClientsPage';
import MaintenancePage from './pages/MaintenancePage';
import ReportsPage from './pages/ReportsPage';
import GPSTrackingPage from './pages/GPSTrackingPage';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openNewRide, setOpenNewRide] = useState(false);
  const { currentUser } = useApp();

  if (!currentUser) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onNewRide={() => setOpenNewRide(true)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rides" element={
              <RidesPage openNewRide={openNewRide} setOpenNewRide={setOpenNewRide} />
            } />
            <Route path="/fleet" element={<FleetPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/tracking" element={<GPSTrackingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <ChatWidget />
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}
