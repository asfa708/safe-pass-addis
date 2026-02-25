import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const USERS = [
  { email: 'admin@safepass.et',  password: 'admin123',  name: 'Ops Manager',  role: 'Admin' },
  { email: 'abebe@safepass.et',  password: 'driver123', name: 'Abebe Girma',  role: 'Driver', driverId: 'd1' },
  { email: 'dawit@safepass.et',  password: 'driver123', name: 'Dawit Bekele', role: 'Driver', driverId: 'd2' },
  { email: 'yonas@safepass.et',  password: 'driver123', name: 'Yonas Tadesse', role: 'Driver', driverId: 'd3' },
];

export default function LoginPage() {
  const { login } = useApp();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.email === email && u.password === password);
    if (user) {
      login(user);
    } else {
      setError(t('login.invalidCredentials'));
    }
  };

  const quickLogin = (u) => {
    setEmail(u.email);
    setPassword(u.password);
    login(u);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/30 mb-4">
            <Shield size={32} className="text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('login.title')}</h1>
          <p className="text-gold-500 font-semibold tracking-widest text-sm mt-1">FLEET MANAGEMENT</p>
          <p className="text-slate-400 text-sm mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <div className="card border border-navy-600">
          <h2 className="text-lg font-semibold text-white mb-6">{t('login.signIn')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="input"
                placeholder="your@theodorus.et"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">{t('login.password')}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2">
              {t('login.signIn')}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-6 pt-5 border-t border-navy-600">
            <p className="text-xs text-slate-500 mb-3 text-center">{t('login.quickLogin')}</p>
            <div className="grid grid-cols-2 gap-2">
              {USERS.slice(0, 4).map(u => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  className="text-left px-3 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 border border-navy-600 transition-colors"
                >
                  <div className="text-xs font-medium text-slate-200">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          {t('login.copyright')}
        </p>
      </div>
    </div>
  );
}
