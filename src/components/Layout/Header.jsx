import { Bell, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from 'react-router-dom';

const pageTitleKeys = {
  '/':            { titleKey: 'nav.dashboard',    subtitleKey: 'nav.subtitleDashboard' },
  '/operations':  { titleKey: 'nav.operations',   subtitleKey: 'nav.subtitleOperations' },
  '/rides':       { titleKey: 'nav.rides',        subtitleKey: 'nav.subtitleRides' },
  '/fleet':       { titleKey: 'nav.fleet',        subtitleKey: 'nav.subtitleFleet' },
  '/clients':     { titleKey: 'nav.clients',      subtitleKey: 'nav.subtitleClients' },
  '/maintenance': { titleKey: 'nav.maintenance',  subtitleKey: 'nav.subtitleMaintenance' },
  '/tracking':    { titleKey: 'nav.tracking',     subtitleKey: 'nav.subtitleTracking' },
  '/reports':     { titleKey: 'nav.reports',      subtitleKey: 'nav.subtitleReports' },
  '/ai':          { titleKey: 'nav.ai',           subtitleKey: 'nav.subtitleAi' },
  '/settings':    { titleKey: 'nav.settings',     subtitleKey: 'nav.subtitleSettings' },
};

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'he', label: 'עב' },
  { code: 'am', label: 'አማ' },
];

export default function Header({ onNewRide }) {
  const { stats } = useApp();
  const { t, lang, setLang } = useLanguage();
  const location = useLocation();
  const info = pageTitleKeys[location.pathname] || pageTitleKeys['/'];

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 relative flex-shrink-0"
      style={{
        background: 'rgba(1, 14, 28, 0.97)',
        borderBottom: '1px solid rgba(0,212,255,0.09)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.45) 30%, rgba(0,212,255,0.45) 70%, transparent 100%)' }}
      />

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-white font-bold tracking-widest uppercase leading-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.18em' }}
        >
          {t(info.titleKey)}
        </h1>
        <p
          className="mt-0.5 truncate"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,212,255,0.28)', letterSpacing: '0.1em' }}
        >
          {t(info.subtitleKey)}
        </p>
      </div>

      {/* Active rides telemetry */}
      {stats.activeRides > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '2px',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#4ade80',
              animation: 'glow-pulse 2s ease-in-out infinite',
              boxShadow: '0 0 6px #4ade80',
            }}
          />
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em' }}
          >
            {stats.activeRides} ACTIVE
          </span>
        </div>
      )}

      {/* Language switcher */}
      <div
        className="flex items-center overflow-hidden"
        style={{ border: '1px solid rgba(0,212,255,0.18)', borderRadius: '2px' }}
      >
        {LANGS.map((l, i) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className="transition-all"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              padding: '0.35rem 0.6rem',
              borderLeft: i > 0 ? '1px solid rgba(0,212,255,0.18)' : 'none',
              background: lang === l.code ? 'rgba(0,212,255,0.12)' : 'rgba(1,25,46,0.8)',
              color: lang === l.code ? '#00d4ff' : '#334155',
              cursor: 'pointer',
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* New Ride button */}
      <button
        type="button"
        onClick={onNewRide}
        className="btn-primary flex items-center gap-1.5"
      >
        <Plus size={12} />
        {t('common.newRide')}
      </button>

      {/* Notifications */}
      <button
        type="button"
        className="relative flex items-center justify-center transition-all"
        style={{
          width: '32px',
          height: '32px',
          background: 'rgba(1,25,46,0.6)',
          border: '1px solid rgba(0,212,255,0.1)',
          borderRadius: '2px',
          color: '#334155',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = '#00d4ff'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.1)'; e.currentTarget.style.color = '#334155'; }}
      >
        <Bell size={14} />
        {stats.pendingRides > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.55rem',
              width: '14px',
              height: '14px',
              background: '#ef4444',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '2px',
            }}
          >
            {stats.pendingRides}
          </span>
        )}
      </button>
    </header>
  );
}
