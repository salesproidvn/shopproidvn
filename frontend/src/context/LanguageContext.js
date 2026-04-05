import { createContext, useContext, useState, useEffect } from 'react';
import { vi, en } from '../utils/i18n';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'vi'; // Default to Vietnamese
  });

  const t = lang === 'vi' ? vi : en;

  const switchLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
