'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { IntlProvider } from 'next-intl';
import { defaultLocale, type Locale } from '../../i18n';
import domTranslationsData from '../../lib/domTranslations.json';

// Import all message files
import enMessages from '../../messages/en.json';
import frMessages from '../../messages/fr.json';
import esMessages from '../../messages/es.json';
import rwMessages from '../../messages/rw.json';

const messages: Record<string, typeof enMessages> = {
  en: enMessages,
  fr: frMessages,
  es: esMessages,
  rw: rwMessages,
};

const domTranslations: Record<string, [string, string, string]> = domTranslationsData as unknown as Record<string, [string, string, string]>;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'NOSCRIPT', 'SVG']);
const LANG_IDX: Record<Exclude<Locale, 'en'>, 0 | 1 | 2> = {
  fr: 0,
  es: 1,
  rw: 2,
};

// Build normalized and reverse dictionaries for resilient multi-way translation
const normalizedDict = new Map<string, [string, string, string]>();
const reverseDict = new Map<string, string>(); // any FR, ES, RW string (lowercase trimmed) -> canonical EN

for (const [enKey, trans] of Object.entries(domTranslations)) {
  const normEn = enKey.trim().toLowerCase();
  normalizedDict.set(normEn, trans);

  // Map each translation back to canonical EN
  for (const t of trans) {
    if (t && typeof t === 'string') {
      const normTrans = t.trim().toLowerCase();
      if (normTrans && normTrans !== normEn) {
        reverseDict.set(normTrans, enKey);
      }
    }
  }
}

function getCanonical(raw: string): { canonical: string; leading: string; suffix: string; trailing: string } | null {
  if (!raw) return null;
  const leading = raw.match(/^\s*/)?.[0] ?? "";
  const trailing = raw.match(/\s*$/)?.[0] ?? "";
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const punctMatch = trimmed.match(/^([^:!?.]+)([:!?.]+)$/);
  const baseTrimmed = punctMatch ? punctMatch[1].trim() : trimmed;
  const suffix = punctMatch ? punctMatch[2] : "";

  if (domTranslations[baseTrimmed]) {
    return { canonical: baseTrimmed, leading, suffix, trailing };
  }
  const lower = baseTrimmed.toLowerCase();
  for (const key of Object.keys(domTranslations)) {
    if (key.toLowerCase() === lower) {
      return { canonical: key, leading, suffix, trailing };
    }
  }
  const rev = reverseDict.get(lower);
  if (rev) {
    return { canonical: rev, leading, suffix, trailing };
  }
  return null;
}

function translateText(raw: string, targetLang: Locale): string {
  const info = getCanonical(raw);
  if (!info) return raw;
  const { canonical, leading, suffix, trailing } = info;
  if (targetLang === "en") {
    return `${leading}${canonical}${suffix}${trailing}`;
  }
  const match = domTranslations[canonical] || normalizedDict.get(canonical.toLowerCase());
  if (!match) return raw;
  const translated = match[LANG_IDX[targetLang]];
  return `${leading}${translated}${suffix}${trailing}`;
}

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)connekt_locale=([^;]+)/);
  const val = match?.[1]?.trim().toLowerCase() as Locale | undefined;
  return val && messages[val] ? val : null;
}

function writeCookieLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `connekt_locale=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('connekyt.com')) {
    document.cookie = `connekt_locale=${locale}; domain=.connekyt.com; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Check URL query param (?lang=rw or ?locale=rw) for mobile/cross-app handoff
    let resolved: Locale | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = (params.get('lang') || params.get('locale'))?.trim().toLowerCase() as Locale | undefined;
      if (urlLang && messages[urlLang]) {
        resolved = urlLang;
      }
    }
    // 2. Fall back to localStorage or shared cookie
    if (!resolved) {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && messages[savedLocale]) {
        resolved = savedLocale;
      } else {
        resolved = readCookieLocale();
      }
    }
    if (resolved && messages[resolved]) {
      setLocaleState(resolved);
      localStorage.setItem('locale', resolved);
      writeCookieLocale(resolved);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    writeCookieLocale(newLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  };

  const origTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const origPlaceholderMapRef = useRef<WeakMap<Element, string>>(new WeakMap());
  const trackedTextNodesRef = useRef<Set<Text>>(new Set());
  const trackedElementsRef = useRef<Set<Element>>(new Set());

  // Non-destructive DOM translator ensuring every unmigrated component or text is translated
  useEffect(() => {
    if (typeof document === 'undefined' || !document.body || !mounted) return;

    const origTextMap = origTextMapRef.current;
    const origPlaceholderMap = origPlaceholderMapRef.current;
    const trackedNodes = trackedTextNodesRef.current;
    const trackedEls = trackedElementsRef.current;

    const processTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-no-translate]")) return;
      const current = node.nodeValue ?? "";
      if (!current.trim()) return;

      let orig = origTextMap.get(node);
      if (orig === undefined) {
        const info = getCanonical(current);
        if (info) {
          orig = `${info.leading}${info.canonical}${info.suffix}${info.trailing}`;
          origTextMap.set(node, orig);
          trackedNodes.add(node);
        } else {
          return;
        }
      }

      const nextVal = translateText(orig, locale);
      if (node.nodeValue !== nextVal) {
        node.nodeValue = nextVal;
      }
    };

    const processElementAttrs = (el: Element) => {
      if (SKIP_TAGS.has(el.tagName) || el.closest("[data-no-translate]")) return;
      const ph = el.getAttribute("placeholder");
      if (ph && ph.trim()) {
        let orig = origPlaceholderMap.get(el);
        if (orig === undefined) {
          const info = getCanonical(ph);
          if (info) {
            orig = `${info.leading}${info.canonical}${info.suffix}${info.trailing}`;
            origPlaceholderMap.set(el, orig);
            trackedEls.add(el);
          }
        }
        if (orig !== undefined) {
          const nextPh = translateText(orig, locale);
          if (el.getAttribute("placeholder") !== nextPh) {
            el.setAttribute("placeholder", nextPh);
          }
        }
      }
    };

    const walk = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let curr: Node | null = walker.currentNode;
      while (curr) {
        if (curr.nodeType === Node.TEXT_NODE) {
          processTextNode(curr as Text);
        } else if (curr.nodeType === Node.ELEMENT_NODE) {
          processElementAttrs(curr as Element);
        }
        curr = walker.nextNode();
      }
    };

    // First re-translate all previously tracked nodes immediately
    trackedNodes.forEach((node) => {
      if (!node.isConnected) {
        trackedNodes.delete(node);
        return;
      }
      const orig = origTextMap.get(node);
      if (orig) {
        const nextVal = translateText(orig, locale);
        if (node.nodeValue !== nextVal) node.nodeValue = nextVal;
      }
    });

    trackedEls.forEach((el) => {
      if (!el.isConnected) {
        trackedEls.delete(el);
        return;
      }
      const orig = origPlaceholderMap.get(el);
      if (orig) {
        const nextPh = translateText(orig, locale);
        if (el.getAttribute('placeholder') !== nextPh) el.setAttribute('placeholder', nextPh);
      }
    });

    walk(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((added) => walk(added));
        } else if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          processTextNode(m.target as Text);
        } else if (m.type === 'attributes' && m.attributeName === 'placeholder' && m.target instanceof Element) {
          processElementAttrs(m.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder'],
    });

    return () => observer.disconnect();
  }, [locale, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  // Use the locale's messages if available, otherwise fall back to default locale
  const currentMessages = messages[locale] || messages[defaultLocale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <IntlProvider key={locale} messages={currentMessages} locale={locale}>
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
