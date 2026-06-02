import { createContext, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();

  // Normalize ar-EG, ar-SA, etc. to just 'ar'
  const rawLang = i18n.language || 'en';
  const language = rawLang.startsWith('ar') ? 'ar' : 'en';
  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const setLanguage = useCallback(
    (lang) => i18n.changeLanguage(lang),
    [i18n]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
