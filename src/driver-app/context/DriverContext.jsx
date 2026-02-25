import { createContext, useContext, useState, useCallback } from 'react';
import { initialDrivers, initialRides } from '../../data/mockData';
import am from '../locales/am';
import en from '../locales/en';

const COMPANY_CODE = '1207';

const DriverContext = createContext(null);

export function DriverProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [lang, setLang] = useState('am');
  const [rides, setRides] = useState(initialRides);
  const [loginError, setLoginError] = useState('');

  const strings = lang === 'am' ? am : en;
  const t = (key) => strings[key] || key;

  const login = useCallback((employeeId, companyCode) => {
    if (companyCode !== COMPANY_CODE) {
      setLoginError('error');
      return false;
    }
    const found = initialDrivers.find(
      d => d.id === employeeId.trim().toLowerCase()
    );
    if (!found) {
      setLoginError('error');
      return false;
    }
    setDriver(found);
    setLoginError('');
    return true;
  }, []);

  const logout = useCallback(() => setDriver(null), []);

  const toggleLang = useCallback(() =>
    setLang(l => l === 'am' ? 'en' : 'am'), []);

  const myRides = driver
    ? rides.filter(r => r.driverId === driver.id)
    : [];

  const updateRideStatus = useCallback((rideId, status) => {
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status } : r));
  }, []);

  return (
    <DriverContext.Provider value={{
      driver, login, logout, loginError,
      lang, toggleLang, t,
      myRides, updateRideStatus,
    }}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver must be used within DriverProvider');
  return ctx;
}
