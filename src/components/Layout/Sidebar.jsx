import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Car, Users, CalendarCheck,
  Wrench, BarChart3, LogOut, Shield, ChevronRight,
  Truck, Navigation, Smartphone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

const navItems = [
  { to: '/',            icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/operations',  icon: Truck,           labelKey: 'nav.operations' },
  { to: '/rides',       icon: CalendarCheck,   labelKey: 'nav.rides' },
  { to: '/fleet',       icon: Car,             labelKey: 'nav.fleet' },
  { to: '/clients',     icon: Users,           labelKey: 'nav.clients' },
  { to: '/maintenance', icon: Wrench,          labelKey: 'nav.maintenance' },
  { to: '/tracking',    icon: Navigation,      labelKey: 'nav.tracking' },
  { to: '/reports',     icon: BarChart3,       labelKey: 'nav.reports' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { currentUser, logout, stats } = useApp();
  const { t } = useLanguage();

  return (
    <aside className={`flex flex-col bg-navy-800 border-r border-navy-600/60 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-600/60">
        <div className="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-black" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-white text-sm leading-tight">Theodorus</div>
            <div className="text-gold-500 text-xs font-semibold tracking-wide">FLEET</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                isActive
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                  : 'text-slate-400 hover:bg-navy-700/60 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-gold-400' : ''} />
                {!collapsed && <span className="text-sm font-medium">{t(labelKey)}</span>}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-navy-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-navy-600">
                    {t(labelKey)}
                  </div>
                )}
                {/* Badge for pending rides */}
                {to === '/rides' && stats.pendingRides > 0 && !collapsed && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {stats.pendingRides}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Driver App link */}
      <div className="px-2 pb-2">
        <NavLink
          to="/driver"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
              isActive
                ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                : 'text-slate-400 hover:bg-navy-700/60 hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Smartphone size={18} className={isActive ? 'text-gold-400' : ''} />
              {!collapsed && (
                <span className="text-sm font-medium">Driver App</span>
              )}
              {!collapsed && (
                <span className="ml-auto text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                  PWA
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-navy-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-navy-600">
                  Driver App
                </div>
              )}
            </>
          )}
        </NavLink>
      </div>

      {/* User */}
      <div className="border-t border-navy-600/60 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center flex-shrink-0">
            <span className="text-gold-400 text-xs font-bold">
              {currentUser?.name?.[0] || 'A'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{currentUser?.name || 'Admin'}</div>
              <div className="text-xs text-slate-500 truncate">{currentUser?.role || t('common.administrator')}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title={t('common.logout')}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
