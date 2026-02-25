import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en';
import he from '../locales/he';
import am from '../locales/am';

const LOCALES = { en, he, am };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('spa-lang') || 'en');

  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem('spa-lang', lang);
  }, [lang, dir]);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
  }, []);

  const t = useCallback((key) => {
    const parts = key.split('.');
    let result = LOCALES[lang];
    for (const part of parts) {
      result = result?.[part];
    }
    if (result !== undefined && result !== null) return result;
    // Fallback to English
    let fallback = LOCALES.en;
    for (const part of parts) {
      fallback = fallback?.[part];
    }
    return fallback ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ t, lang, setLang, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
