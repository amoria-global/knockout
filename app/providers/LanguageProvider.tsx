'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IntlProvider } from 'next-intl';
import { defaultLocale, type Locale } from '../../i18n';

// Import all message files
import enMessages from '../../messages/en.json';
import frMessages from '../../messages/fr.json';
import esMessages from '../../messages/es.json';

const messages: Record<string, typeof enMessages> = {
  en: enMessages,
  fr: frMessages,
  es: esMessages,
};

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && messages[savedLocale]) {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  // Use the locale's messages if available, otherwise fall back to default locale
  const currentMessages = messages[locale] || messages[defaultLocale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <IntlProvider messages={currentMessages} locale={locale}>
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
