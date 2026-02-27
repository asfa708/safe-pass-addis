import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Car, Users, CalendarCheck,
  Wrench, BarChart3, LogOut, Shield, ChevronRight,
  Truck, Navigation, Smartphone, Brain, Settings,
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
  { to: '/ai',          icon: Brain,           labelKey: 'nav.ai',       badge: 'AI' },
  { to: '/settings',    icon: Settings,        labelKey: 'nav.settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { currentUser, logout, stats } = useApp();
  const { t } = useLanguage();

  return (
    <aside
      className={`flex flex-col border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen relative overflow-hidden flex-shrink-0`}
      style={{ background: '#010e1c', borderColor: 'rgba(0,212,255,0.1)' }}
    >
      {/* Right edge glow line */}
      <div
        className="absolute top-0 right-0 w-px h-full pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,212,255,0.5) 0%, rgba(0,212,255,0.08) 30%, transparent 100%)' }}
      />

      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 relative flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        {/* Logo mark */}
        <div className="relative flex-shrink-0">
          <div
            className="w-9 h-9 flex items-center justify-center"
            style={{
              background: 'rgba(0,212,255,0.07)',
              border: '1px solid rgba(0,212,255,0.35)',
              borderRadius: '3px',
            }}
          >
            <Shield size={17} style={{ color: '#00d4ff' }} />
          </div>
          {/* Corner brackets */}
          <div className="absolute -top-0.5 -left-0.5 w-2 h-2" style={{ borderTop: '1px solid rgba(0,212,255,0.7)', borderLeft: '1px solid rgba(0,212,255,0.7)' }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.7)', borderRight: '1px solid rgba(0,212,255,0.7)' }} />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div
              className="text-white font-bold tracking-widest leading-tight"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
            >
              THEODORUS
            </div>
            <div
              className="tracking-widest leading-tight mt-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.22em' }}
            >
              FLEET OPS
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="ml-auto transition-colors flex-shrink-0"
          style={{ color: 'rgba(0,212,255,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,212,255,0.3)'}
        >
          <ChevronRight size={14} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1.5">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: 'rgba(0,212,255,0.25)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Navigation
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, labelKey, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="block"
          >
            {({ isActive }) => (
              <div
                className="flex items-center gap-2.5 px-2.5 py-2 relative group transition-all duration-150 rounded-sm"
                style={{
                  borderLeft: isActive ? '2px solid #00d4ff' : '2px solid transparent',
                  background: isActive ? 'rgba(0,212,255,0.07)' : 'transparent',
                  color: isActive ? '#00d4ff' : '#475569',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(0,212,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />

                {!collapsed && (
                  <span
                    className="flex-1 min-w-0 truncate font-medium"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.04em' }}
                  >
                    {t(labelKey)}
                  </span>
                )}

                {/* Collapsed tooltip */}
                {collapsed && (
                  <div
                    className="absolute left-full ml-3 px-2.5 py-1.5 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.7rem',
                      background: '#010e1c',
                      border: '1px solid rgba(0,212,255,0.2)',
                      borderRadius: '2px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                    }}
                  >
                    {t(labelKey)}
                  </div>
                )}

                {/* Pending rides badge */}
                {to === '/rides' && stats.pendingRides > 0 && !collapsed && (
                  <span
                    className="text-red-400 font-bold"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.6rem',
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '2px',
                      padding: '0.1rem 0.35rem',
                    }}
                  >
                    {stats.pendingRides}
                  </span>
                )}

                {/* Static badge (AI) */}
                {badge && !collapsed && to !== '/rides' && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      borderRadius: '2px',
                      padding: '0.1rem 0.35rem',
                      color: '#00d4ff',
                    }}
                  >
                    {badge}
                  </span>
                )}

                {/* Active indicator dot */}
                {isActive && (
                  <div
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }}
                  />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Driver App link */}
      <div className="px-2 pb-1" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
        <NavLink to="/driver" className="block mt-1">
          {({ isActive }) => (
            <div
              className="flex items-center gap-2.5 px-2.5 py-2 relative group transition-all duration-150 rounded-sm"
              style={{
                borderLeft: isActive ? '2px solid #00d4ff' : '2px solid transparent',
                background: isActive ? 'rgba(0,212,255,0.07)' : 'transparent',
                color: isActive ? '#00d4ff' : '#475569',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(0,212,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
            >
              <Smartphone size={15} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span
                    className="flex-1 font-medium"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.04em' }}
                  >
                    Driver App
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      borderRadius: '2px',
                      padding: '0.1rem 0.35rem',
                      color: '#00d4ff',
                    }}
                  >
                    PWA
                  </span>
                </>
              )}
              {collapsed && (
                <div
                  className="absolute left-full ml-3 px-2.5 py-1.5 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.7rem',
                    background: '#010e1c',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: '2px',
                  }}
                >
                  Driver App
                </div>
              )}
            </div>
          )}
        </NavLink>
      </div>

      {/* User info */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}
      >
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: '30px',
              height: '30px',
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: '2px',
            }}
          >
            <span
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 700, color: '#00d4ff' }}
            >
              {currentUser?.name?.[0] || 'A'}
            </span>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div
                className="text-slate-300 truncate font-medium"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}
              >
                {currentUser?.name || 'Admin'}
              </div>
              <div
                className="truncate mt-0.5"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,212,255,0.25)', letterSpacing: '0.08em' }}
              >
                {currentUser?.role || 'OPERATOR'}
              </div>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={logout}
              className="transition-colors"
              style={{ color: 'rgba(0,212,255,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,212,255,0.2)'}
              title={t('common.logout')}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
