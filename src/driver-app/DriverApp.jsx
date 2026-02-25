import { useState } from 'react';
import { DriverProvider, useDriver } from './context/DriverContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ChecklistScreen from './screens/ChecklistScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import BottomNav from './components/BottomNav';
import './driver-app.css';

function DriverShell() {
  const { driver, logout, toggleLang, t } = useDriver();
  const [tab, setTab] = useState('home');

  if (!driver) return <LoginScreen />;

  const screens = {
    home: <HomeScreen />,
    checklist: <ChecklistScreen />,
    documents: <DocumentsScreen />,
  };

  return (
    <div className="da-shell">
      {/* Top bar */}
      <header className="da-topbar">
        <div className="da-topbar-brand">
          <span className="da-topbar-logo">🚗</span>
          <span className="da-topbar-name">Safe-Pass</span>
        </div>
        <div className="da-topbar-actions">
          <button onClick={toggleLang} className="da-topbar-btn">
            {t('lang.switch')}
          </button>
          <button onClick={logout} className="da-topbar-btn da-topbar-logout">
            {t('profile.logout')}
          </button>
        </div>
      </header>

      {/* Screen content */}
      <main className="da-main">
        {screens[tab]}
      </main>

      {/* Bottom navigation */}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function DriverApp() {
  return (
    <DriverProvider>
      <DriverShell />
    </DriverProvider>
  );
}
