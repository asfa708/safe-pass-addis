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
    <header className="bg-navy-800/90 backdrop-blur border-b border-navy-600/60 px-6 py-4 flex items-center gap-4">
      <div className="flex-1">
        <h1 className="text-lg font-bold text-white">{t(info.titleKey)}</h1>
        <p className="text-xs text-slate-500">{t(info.subtitleKey)}</p>
      </div>

      {/* Active rides indicator */}
      {stats.activeRides > 0 && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/50 rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-300 text-sm font-medium">{stats.activeRides} {t('common.active')}</span>
        </div>
      )}

      {/* Language switcher */}
      <div className="flex items-center rounded-lg border border-navy-600 overflow-hidden">
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              lang === l.code
                ? 'bg-gold-500 text-black'
                : 'bg-navy-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* New Ride button */}
      <button
        onClick={onNewRide}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <Plus size={16} />
        {t('common.newRide')}
      </button>

      {/* Notifications */}
      <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-navy-700 text-slate-400 hover:text-white transition-colors border border-navy-600">
        <Bell size={16} />
        {stats.pendingRides > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {stats.pendingRides}
          </span>
        )}
      </button>
    </header>
  );
}
