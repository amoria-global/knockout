import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// List of active supported locales (English, French, Spanish active; rw & sw paused for dictionary refinements)
export const locales = ['en', 'fr', 'es'] as const;
export type ActiveLocale = (typeof locales)[number];
export type Locale = 'en' | 'fr' | 'es' | 'rw' | 'sw';

export const defaultLocale: ActiveLocale = 'en';

// Language names for display
export const languageNames: Record<Locale, string> = {
  en: 'English',
  fr: 'French',
  es: 'Español',
  rw: 'Kinyarwanda',
  sw: 'Kiswahili',
};

export default getRequestConfig(async ({ locale }) => {
  // Ensure the locale is valid and exists
  const validLocale: string = (locale && (locales as readonly string[]).includes(locale)) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
