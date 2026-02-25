import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

export default function LoginScreen() {
  const { login, loginError, t, lang, toggleLang } = useDriver();
  const [employeeId, setEmployeeId] = useState('');
  const [companyCode, setCompanyCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(employeeId, companyCode);
  };

  return (
    <div className="da-screen da-login-bg">
      {/* Language toggle */}
      <button onClick={toggleLang} className="da-lang-btn">
        {t('lang.switch')}
      </button>

      <div className="da-login-card">
        {/* Logo */}
        <div className="da-logo">
          <div className="da-logo-icon">🚗</div>
          <h1 className="da-logo-title">{t('login.title')}</h1>
          <p className="da-logo-sub">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="da-form">
          <div className="da-field">
            <label className="da-label">{t('login.employeeId')}</label>
            <input
              className="da-input"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder={t('login.placeholder.id')}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>

          <div className="da-field">
            <label className="da-label">{t('login.companyCode')}</label>
            <input
              className="da-input"
              type="password"
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value)}
              placeholder={t('login.placeholder.code')}
              required
            />
          </div>

          {loginError && (
            <div className="da-error">
              ⚠️ {t('login.error')}
            </div>
          )}

          <button type="submit" className="da-btn-primary">
            {t('login.button')}
          </button>
        </form>

        <p className="da-login-footer">Theodorus © 2025</p>
      </div>
    </div>
  );
}
