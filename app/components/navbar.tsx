'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';
import { getAuthToken } from '@/lib/api/client';
import { getDashboardUrlWithToken } from '@/lib/utils/dashboard-url';
import { useToast } from '@/lib/notifications/ToastProvider';
import { locales, languageNames, type Locale } from '../../i18n';
import { getPublicEvents, getPhotographers, getPhotographerById } from '@/lib/APIs/public';
import { getStreamVideo } from '@/lib/APIs/streams/route';
import { APP_STORE_URL, PLAY_STORE_URL, GET_APP_PAGE_URL, detectMobilePlatform } from '@/lib/qr/eventQr';
import QrCodeSvg from './QrCodeSvg';
import GetAppModal from './GetAppModal';
import { StoreBadge, StoreBadges } from './StoreBadges';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Map category names to icons
const categoryIcons: Record<string, string> = {
  'wedding': 'bi-heart-fill',
  'portrait': 'bi-person-fill',
  'event': 'bi-calendar-event-fill',
  'commercial': 'bi-briefcase-fill',
  'fashion': 'bi-camera-fill',
  'product': 'bi-box-fill',
};

const getIconForCategory = (name: string): string => {
  const normalized = name.toLowerCase();
  return categoryIcons[normalized] || 'bi-camera-fill';
};

// Known event categories - icons and translation keys (must match messages/en.json eventCategories keys)
const EVENT_CATEGORY_BASE: { value: string; icon: string; translationKey: string }[] = [
  { value: 'wedding',       icon: 'bi-heart-fill',        translationKey: 'wedding' },
  { value: 'concert',       icon: 'bi-music-note-beamed', translationKey: 'concert' },
  { value: 'corporate',     icon: 'bi-briefcase-fill',    translationKey: 'corporate' },
  { value: 'sports',        icon: 'bi-trophy-fill',       translationKey: 'sports' },
  { value: 'cultural',      icon: 'bi-globe',             translationKey: 'cultural' },
  { value: 'conference',    icon: 'bi-people-fill',       translationKey: 'conference' },
  { value: 'academic',      icon: 'bi-mortarboard-fill',  translationKey: 'academic' },
  { value: 'gathering',     icon: 'bi-people-fill',       translationKey: 'gathering' },
  { value: 'fashion',       icon: 'bi-bag-fill',          translationKey: 'fashion' },
  { value: 'religious',     icon: 'bi-star-fill',         translationKey: 'religious' },
  { value: 'entertainment', icon: 'bi-controller',        translationKey: 'entertainment' },
  { value: 'birthday',      icon: 'bi-cake2-fill',        translationKey: 'birthday' },
  { value: 'babyshower',    icon: 'bi-balloon-fill',      translationKey: 'babyShower' },
  { value: 'graduation',    icon: 'bi-award-fill',        translationKey: 'graduation' },
  { value: 'anniversary',   icon: 'bi-stars',             translationKey: 'anniversary' },
  { value: 'other',         icon: 'bi-grid-fill',         translationKey: 'other' },
];

// Map category names to translation keys
const getCategoryTranslationKey = (name: string): string => {
  return name.toLowerCase();
};

/**
 * Humanize a raw category value/translation key into a display label.
 * Used as the fallback when the i18n message file doesn't carry a
 * translation for a backend-provided category (e.g. "baby shower"
 * doesn't exist in `nav.eventCategories.*`, so we display "Baby Shower").
 */
const humanizeCategory = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const AmoriaKNavbar = () => {
  const { locale, setLocale } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Safe category label resolver. The i18n `nav.eventCategories.*` and
   * `nav.photographerCategories.*` namespaces only carry entries for the
   * curated default categories. Backend-provided categories (e.g. "baby
   * shower") don't have a corresponding translation, which makes `t()`
   * throw `MISSING_MESSAGE` and crash the page. This wrapper:
   *   1. Prefers a `displayName` if the category provides one
   *   2. Tries the i18n key, swallowing missing-message errors
   *   3. Falls back to a Title-Cased humanized version of the raw value
   */
  const safeCatLabel = (
    cat: { translationKey: string; displayName?: string; value?: string },
    scope: 'eventCategories' | 'photographerCategories'
  ): string => {
    if (cat.displayName) return cat.displayName;
    try {
      return t(`${scope}.${cat.translationKey}` as never);
    } catch {
      return humanizeCategory(cat.value || cat.translationKey || '');
    }
  };

  // Pages with a full-bleed dark cinematic hero - the navbar should sit
  // transparent over the hero and switch to dark glass once the user scrolls
  // past it (Prime Video / Plex pattern).
  const DARK_HERO_ROUTES = [
    '/user/events/view-event',
    '/user/events/join-package',
  ];
  const isDarkHeroPage = pathname
    ? DARK_HERO_ROUTES.some((p) => pathname.startsWith(p))
    : false;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isGetAppOpen, setIsGetAppOpen] = useState(false);
  const [isGetAppModalOpen, setIsGetAppModalOpen] = useState(false);
  const [userPlatform, setUserPlatform] = useState<'android' | 'ios' | null>(null);
  const [selectedLang, setSelectedLang] = useState(languageNames[locale as Locale]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPhotographersDropdownOpen, setIsPhotographersDropdownOpen] = useState(false);
  const [isFindMyPhotosDropdownOpen, setIsFindMyPhotosDropdownOpen] = useState(false);
  const [isEventsDropdownOpen, setIsEventsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [photographerCategories, setPhotographerCategories] = useState<{ value: string; translationKey: string; icon: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [eventCategories, setEventCategories] = useState<{ value: string; icon: string; translationKey: string; displayName?: string; isLive: boolean }[]>([]);
  const [eventCategoriesLoading, setEventCategoriesLoading] = useState(true);
  const [hasLiveEvents, setHasLiveEvents] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const getAppDropdownRef = useRef<HTMLDivElement>(null);
  const navPillRef = useRef<HTMLDivElement>(null);
  const photographersDropdownRef = useRef<HTMLDivElement>(null);
  const eventsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  // Tracks the touchstart position on the mobile-menu backdrop so we can
  // distinguish a "tap to close" from a scroll-gesture that happened to
  // begin on the backdrop. Without this, iOS often dismisses the drawer
  // when the user merely starts scrolling.
  const backdropTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const languageFlags: Record<string, string> = {
    en: 'gb',
    fr: 'fr',
    es: 'es',
  };

  const languages = locales.map((code) => ({
    code,
    name: languageNames[code],
    flagCode: languageFlags[code] || '',
  }));

  // Helper function - no locale prefix needed now
  const getLocalePath = (path: string) => {
    return path;
  };

  // Fetch photographer categories - derive cards directly from photographer specialties
  useEffect(() => {
    const fetchCategoriesAndSpecialties = async () => {
      try {
        const pgResponse = await getPhotographers({ size: 100 });

        if (!pgResponse.success || !pgResponse.data) {
          setCategoriesLoading(false);
          return;
        }

        const allPhotographers = pgResponse.data.content;
        const seen = new Map<string, { value: string; translationKey: string; icon: string }>();

        // If list response includes specialties, derive cards from them
        allPhotographers.forEach((p) => {
          (p.specialties ?? []).forEach((s) => {
            const name = typeof s === 'string' ? s : (s as { id: string; name: string }).name;
            const key = name.toLowerCase();
            if (!seen.has(key)) {
              seen.set(key, {
                value: key,
                translationKey: getCategoryTranslationKey(name),
                icon: getIconForCategory(name),
              });
            }
          });
        });

        // If list response doesn't include specialties, fetch detail for each photographer
        if (seen.size === 0 && allPhotographers.length > 0) {
          const details = await Promise.allSettled(
            allPhotographers.map((p) => getPhotographerById(p.id))
          );
          details.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success && result.value.data) {
              (result.value.data.specialties ?? []).forEach((s) => {
                const name = typeof s === 'string' ? s : (s as { id: string; name: string }).name;
                const key = name.toLowerCase();
                if (!seen.has(key)) {
                  seen.set(key, {
                    value: key,
                    translationKey: getCategoryTranslationKey(name),
                    icon: getIconForCategory(name),
                  });
                }
              });
            }
          });
        }

        setPhotographerCategories([...seen.values()]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategoriesAndSpecialties();
  }, []);

  // Fetch public events to derive active categories and live status
  useEffect(() => {
    const fetchEventCategories = async () => {
      try {
        const res = await getPublicEvents({ size: 100 });
        if (res.success && res.data) {
          const allEvents = res.data.content;
          // Filter out completed/stream-ended events older than 2 days (match events page)
          const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
          const events = allEvents.filter(ev => {
            const isEnded = (ev.eventStatus || '').toUpperCase() === 'COMPLETED' || (ev as Record<string, unknown>).streamStatus === 'ended';
            if (!isEnded) return true;
            const dateStr = ev.updatedAt || ev.eventDate;
            if (!dateStr) return true;
            const ts = new Date(dateStr).getTime();
            if (isNaN(ts)) return true;
            return ts > twoDaysAgo;
          });
          // First pass: record which categories have any visible event
          const catMap = new Map<string, boolean>(); // category → isVerifiedLive
          const ongoingEvents = events.filter(ev => (ev.eventStatus as string)?.toLowerCase() === 'ongoing' && (ev as Record<string, unknown>).streamStatus !== 'ended');

          for (const ev of events) {
            const raw = (ev.eventCategory?.name || '').toLowerCase().trim();
            if (!raw) continue;
            catMap.set(raw, catMap.get(raw) ?? false);
          }

          // Second pass: mark live - ONGOING + (hasLiveStream OR streamStatus
          // signaling live) is sufficient; Cloudflare check adds any missed ones
          let anyLive = false;

          for (const ev of ongoingEvents) {
            const ss = ((ev as Record<string, unknown>).streamStatus || '') as string;
            const isLive = ev.hasLiveStream === true || ss === 'live' || ss === 'started' || ss === 'streaming';
            if (isLive) {
              anyLive = true;
              const raw = (ev.eventCategory?.name || '').toLowerCase().trim();
              if (raw) catMap.set(raw, true);
            }
          }

          if (ongoingEvents.length > 0) {
            const checks = await Promise.allSettled(
              ongoingEvents.map(ev => getStreamVideo(ev.id))
            );
            checks.forEach((result, i) => {
              if (result.status === 'fulfilled' && result.value.success) {
                const d = result.value.data as { data?: { connectionStatus?: string }; connectionStatus?: string };
                const connStatus = d?.data?.connectionStatus ?? d?.connectionStatus;
                if (connStatus === 'live') {
                  anyLive = true;
                  const raw = (ongoingEvents[i].eventCategory?.name || '').toLowerCase().trim();
                  if (raw) catMap.set(raw, true);
                }
              }
            });
          }

          setHasLiveEvents(anyLive);

          // Known base categories that have events
          const knownValues = new Set(EVENT_CATEGORY_BASE.map(c => c.value));
          const knownCards = EVENT_CATEGORY_BASE
            .filter(c => catMap.has(c.value))
            .map(c => ({ ...c, displayName: undefined as string | undefined, isLive: catMap.get(c.value) ?? false }));

          // Dynamic categories from API not in EVENT_CATEGORY_BASE (e.g. "anniversary")
          const dynamicCards = [...catMap.entries()]
            .filter(([key]) => !knownValues.has(key))
            .map(([key, isLive]) => ({
              value: key,
              icon: 'bi-calendar-event-fill',
              translationKey: key,
              displayName: key.charAt(0).toUpperCase() + key.slice(1),
              isLive,
            }));

          setEventCategories([...knownCards, ...dynamicCards]);
        }
      } catch { /* silent - navbar should never break on API errors */ }
      finally { setEventCategoriesLoading(false); }
    };
    fetchEventCategories();
    const interval = setInterval(fetchEventCategories, 30000);
    return () => clearInterval(interval);
  }, []);

  // Effect to detect screen size and mobile platform
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    setUserPlatform(detectMobilePlatform());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to handle scroll events.
  // Threshold is 8px so a 1-pixel browser jiggle doesn't toggle the
  // background; threshold is 64px on dark-hero pages so the navbar stays
  // glassy-transparent while the cinematic hero is in view.
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const threshold = isDarkHeroPage ? 64 : 8;
      setIsScrolled(y > threshold);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Effect to handle clicks outside of the language dropdown and profile dropdown.
  //
  // NOTE: the mobile menu drawer is INTENTIONALLY excluded from this handler -
  // it uses a dedicated backdrop overlay (rendered when `isMobileMenuOpen`) to
  // catch tap-outside-to-close, plus the explicit X close button. Including
  // the drawer here was closing it mid-scroll on touch devices because
  // mobile browsers fire synthetic mousedown/click events during scroll
  // gestures, falsely matching "tap outside the drawer".
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close language dropdown
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      // Close get app dropdown
      if (getAppDropdownRef.current && !getAppDropdownRef.current.contains(event.target as Node)) {
        setIsGetAppOpen(false);
      }
      // Close profile dropdown
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Restore body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close the mobile menu only when an actual route change completes.
  //
  // Why: on mobile, a touch "scroll" gesture with minimal finger movement
  // registers as a synthetic click on whatever Link the finger landed on.
  // If we close the drawer on every Link onClick, scrolling-while-touching-
  // a-link silently dismisses the menu. By tying close to pathname change,
  // a same-page tap (which produces no navigation) leaves the menu open,
  // while a real navigation away from the page closes it as expected.
  const lastPathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
      setIsPhotographersDropdownOpen(false);
      setIsEventsDropdownOpen(false);
      setIsLangMenuOpen(false);
      setIsGetAppOpen(false);
      setIsProfileDropdownOpen(false);
    }
  }, [pathname, isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => {
      const next = !prev;
      if (next) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return next;
    });
  };

  const toggleLangMenu = () => {
    setIsLangMenuOpen(prev => !prev);
  };

  const handleLangSelect = (langCode: string, langName: string) => {
    setSelectedLang(langName);
    setIsLangMenuOpen(false);

    // Update locale using our context
    setLocale(langCode as Locale);
  };

  // Kept as a no-op so existing `onClick={handleLinkClick}` references in
  // mobile drawer Links don't break, but we no longer close the drawer here.
  // Closing now happens centrally via the pathname-change effect above -
  // that prevents accidental closes when a touch "scroll" gesture inside
  // the drawer registers as a synthetic click on a Link.
  const handleLinkClick = () => { /* close handled by pathname effect */ };

  const { showBanner } = useToast();

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
    showBanner('You have been logged out successfully.', '#DC2626');
    router.push('/');
  };

  const getDashboardUrl = () => {
    const token = getAuthToken();
    // Use type-based URL with user's customerType (token-only, no email needed)
    return getDashboardUrlWithToken(user?.customerType, token || undefined) || '/user/photographers';
  };

  return (
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      data-theme={isDarkHeroPage ? (isScrolled ? 'dark-solid' : 'dark-transparent') : (isScrolled ? 'light-solid' : 'light-flat')}
      style={{
        // Inline position:fixed as a belt-and-suspenders override for
        // the Tailwind `fixed` class above. On mobile some viewers were
        // seeing the navbar only at scrollY=0 and disappearing on scroll,
        // consistent with the utility class not taking effect (or being
        // overridden) — explicit inline declarations win the cascade
        // regardless of Tailwind layer order or purge gotchas.
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        fontFamily: "'Pragati Narrow', sans-serif",
        // Background:
        //  • dark-hero page over hero  → fully transparent (hero shows through)
        //  • dark-hero page scrolled   → dark glass with brand-blue tint
        //  • normal page top           → solid light gray
        //  • normal page scrolled      → translucent white glass
        backgroundColor: isDarkHeroPage
          ? (isScrolled ? 'rgba(7, 8, 13, 0.78)' : 'transparent')
          : (isScrolled ? 'rgba(255, 255, 255, 0.85)' : '#DBDBDB'),
        backdropFilter: isDarkHeroPage
          ? (isScrolled ? 'blur(20px) saturate(160%)' : 'none')
          : (isScrolled ? 'blur(16px)' : 'none'),
        WebkitBackdropFilter: isDarkHeroPage
          ? (isScrolled ? 'blur(20px) saturate(160%)' : 'none')
          : (isScrolled ? 'blur(16px)' : 'none'),
        // Drop shadow + an inset bottom highlight (in place of a literal
        // border-bottom). The inset shadow renders via the compositor and
        // doesn't leave a fixed-pixel hairline that flashes during scroll
        // re-renders - same fix philosophy as the event-card seam.
        //
        // IMPORTANT: do NOT add `transform`, `will-change: transform`, or
        // any property that creates a CSS containing block here. Those
        // would scope `position: fixed` descendants (like the mobile menu
        // drawer at line ~1571) to the navbar's bounds instead of the
        // viewport, making the drawer invisible. The flashing-line fix is
        // handled entirely by removing the literal border-bottom and
        // replacing it with the inset shadow below.
        boxShadow: isDarkHeroPage
          ? (isScrolled
              ? '0 8px 32px rgba(0, 0, 0, 0.55), inset 0 -1px 0 rgba(255, 255, 255, 0.06)'
              : 'none')
          : (isScrolled
              ? '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04), inset 0 -1px 0 rgba(0, 0, 0, 0.04)'
              : 'none'),
      }}
    >
      {/* Live Animation Styles for Event Category Cards */}
      <style>{`
        @keyframes nav-live-dot-ping {
          0% { transform: scale(1); opacity: 1; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes nav-live-dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .nav-live-dot-wrap {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-live-dot {
          position: relative;
          width: 8px;
          height: 8px;
        }

        .nav-live-dot-inner {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e53e3e;
          animation: nav-live-dot-blink 1.2s ease-in-out infinite;
        }

        .nav-live-dot-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(229, 62, 62, 0.5);
          animation: nav-live-dot-ping 1.2s ease-out infinite;
        }

        .nav-live-label {
          font-size: 9px;
          font-weight: 800;
          color: #e53e3e;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          animation: nav-live-dot-blink 1.2s ease-in-out infinite;
        }

        @keyframes nav-sound-wave-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5),
                        0 0 12px rgba(16, 185, 129, 0.5);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(16, 185, 129, 0),
                        0 0 0 20px rgba(16, 185, 129, 0),
                        0 0 18px rgba(16, 185, 129, 0.7);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 12px rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes nav-border-beep {
          0%, 100% {
            border-color: rgba(220, 38, 38, 0.7);
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7),
                        0 0 0 0 rgba(220, 38, 38, 0.5);
          }
          25% {
            box-shadow: 0 0 0 4px rgba(220, 38, 38, 0),
                        0 0 0 8px rgba(220, 38, 38, 0);
          }
          50% {
            border-color: rgba(248, 113, 113, 1);
            box-shadow: 0 0 0 8px rgba(220, 38, 38, 0),
                        0 0 0 16px rgba(220, 38, 38, 0);
          }
          75% {
            box-shadow: 0 0 0 4px rgba(220, 38, 38, 0),
                        0 0 0 8px rgba(220, 38, 38, 0);
          }
        }

        @keyframes nav-icon-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.9;
          }
        }

        .nav-live-card {
          animation: nav-border-beep 1s ease-out infinite;
          border: 1.5px solid rgba(220, 38, 38, 0.7);
        }

        .nav-live-card:hover {
          animation: none;
          box-shadow: inset 0 0 0 1.5px rgba(220, 38, 38, 0.6);
        }

        .nav-live-icon {
          animation: nav-icon-pulse 1s ease-in-out infinite;
        }

        .nav-live-card:hover .nav-live-icon {
          animation: none;
        }

        .nav-live-text {
          color: #dc2626 !important;
        }

        .nav-live-card:hover .nav-live-text {
          color: #b91c1c !important;
        }

        @keyframes nav-skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes nav-dropdown-enter {
          from {
            opacity: 0;
            margin-top: -8px;
          }
          to {
            opacity: 1;
            margin-top: 0;
          }
        }

        @keyframes nav-events-border-vibrate {
          0%, 100% {
            border-color: rgba(220, 38, 38, 0.7);
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7),
                        0 0 0 0 rgba(220, 38, 38, 0.5);
          }
          25% {
            box-shadow: 0 0 0 8px rgba(220, 38, 38, 0),
                        0 0 0 16px rgba(220, 38, 38, 0);
          }
          50% {
            border-color: rgba(248, 113, 113, 1);
            box-shadow: 0 0 0 16px rgba(220, 38, 38, 0),
                        0 0 0 28px rgba(220, 38, 38, 0);
          }
          75% {
            box-shadow: 0 0 0 8px rgba(220, 38, 38, 0),
                        0 0 0 16px rgba(220, 38, 38, 0);
          }
        }

        .nav-events-link {
          color: #dc2626 !important;
          border: 1px solid rgba(220, 38, 38, 0.7);
          border-radius: 10px;
          padding: 6px 12px !important;
          animation: nav-events-border-vibrate 1s ease-out infinite;
        }

        .nav-events-link:hover {
          color: #b91c1c !important;
          animation: none;
          border-color: rgba(220, 38, 38, 1);
          background-color: rgba(220, 38, 38, 0.08) !important;
        }

        .nav-link-hover {
          position: relative;
          padding: 7px 18px;
          border-radius: 10px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: #4b5563;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-link-hover:hover {
          background-color: rgba(8, 58, 133, 0.08);
          color: #083A85 !important;
        }

        .nav-link-hover.nav-events-link:hover {
          color: #b91c1c !important;
          background-color: rgba(220, 38, 38, 0.08) !important;
        }

        .nav-link-hover.nav-link-active {
          background-color: #083A85;
          color: #ffffff !important;
          box-shadow: 0 2px 10px rgba(8, 58, 133, 0.35);
        }

        /* Logo animations */
        @keyframes logo-power-on {
          0% {
            opacity: 0;
            transform: scale(0.7) rotate(-12deg);
            filter: drop-shadow(0 0 0px rgba(8, 58, 133, 0));
          }
          40% {
            opacity: 1;
            transform: scale(1.1) rotate(4deg);
            filter: drop-shadow(0 0 20px rgba(8, 58, 133, 0.8));
          }
          70% {
            transform: scale(0.98) rotate(-1deg);
            filter: drop-shadow(0 0 8px rgba(8, 58, 133, 0.3));
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 0px rgba(8, 58, 133, 0));
          }
        }

        @keyframes text-neon-on {
          0% {
            opacity: 0;
            transform: translateX(-8px);
            text-shadow: none;
            color: transparent;
          }
          30% {
            opacity: 0.6;
            color: #4a7fd4;
            text-shadow:
              0 0 7px rgba(8, 58, 133, 0.8),
              0 0 20px rgba(8, 58, 133, 0.4);
          }
          50% {
            opacity: 0.3;
            color: #6da3f0;
          }
          70% {
            opacity: 1;
            transform: translateX(0);
            color: #083A85;
            text-shadow:
              0 0 10px rgba(8, 58, 133, 0.9),
              0 0 30px rgba(8, 58, 133, 0.5),
              0 0 50px rgba(8, 58, 133, 0.2);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            color: #083A85;
            text-shadow: none;
          }
        }

        @keyframes neon-glow-pulse {
          0%, 100% {
            color: #083A85;
            text-shadow:
              0 0 5px rgba(8, 58, 133, 0.4),
              0 0 12px rgba(8, 58, 133, 0.2);
          }
          50% {
            color: #0d4ea8;
            text-shadow:
              0 0 8px rgba(8, 58, 133, 0.6),
              0 0 20px rgba(8, 58, 133, 0.3),
              0 0 35px rgba(8, 58, 133, 0.12);
          }
        }

        @keyframes logo-hover-glow {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 4px rgba(8, 58, 133, 0.35));
          }
          50% {
            transform: scale(1.06) rotate(5deg);
            filter: drop-shadow(0 0 10px rgba(8, 58, 133, 0.5)) drop-shadow(0 0 20px rgba(8, 58, 133, 0.2));
          }
        }

        @keyframes dot-blink {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 3px rgba(8, 58, 133, 0.5), 0 0 6px rgba(8, 58, 133, 0.25);
          }
          50% {
            opacity: 0.2;
            box-shadow: 0 0 1px rgba(8, 58, 133, 0.2);
          }
        }

        .nav-logo-group {
          display: flex;
          align-items: center;
        }

        .nav-logo-icon {
          animation: none;
        }

        .nav-logo-text {
          animation: none;
        }

        .nav-logo-dot {
          display: none;
        }

        /* ── Dark theme overrides ──────────────────────────────────
           When the navbar is on a dark-hero page (data-theme starts
           with "dark") the logo, pill, links, language button, and
           Log In button switch to white-on-glass styling. The Sign Up
           button stays brand-blue (intentional accent on dark bg). */
        nav[data-theme^="dark"] .nav-logo-text {
          color: #ffffff !important;
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
        }
        nav[data-theme^="dark"] [data-navpill] {
          background: rgba(7, 8, 13, 0.55) !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
          backdrop-filter: blur(14px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(160%) !important;
        }
        nav[data-theme^="dark"] [data-navpill] .nav-link-hover {
          color: #f4f6fb !important;
        }
        nav[data-theme^="dark"] [data-navpill] .nav-link-hover:hover,
        nav[data-theme^="dark"] [data-navpill] .nav-link-hover.nav-link-active {
          color: #93c5fd !important;
        }
        nav[data-theme^="dark"] [data-navpill] .nav-link-hover::after {
          background: #93c5fd !important;
        }
        nav[data-theme^="dark"] [data-langbtn] {
          color: #f4f6fb !important;
        }
        nav[data-theme^="dark"] [data-langbtn]:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        nav[data-theme^="dark"] [data-getappbtn] {
          color: #f4f6fb !important;
          background: rgba(255, 255, 255, 0.10) !important;
          border-color: rgba(255, 255, 255, 0.20) !important;
        }
        nav[data-theme^="dark"] [data-getappbtn] i {
          color: #93c5fd !important;
        }
        nav[data-theme^="dark"] [data-getappbtn]:hover {
          background-color: rgba(255, 255, 255, 0.18) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
        }
        nav[data-theme^="dark"] [data-mobile-getapp-pill] {
          color: #f4f6fb !important;
          background: rgba(255, 255, 255, 0.10) !important;
          border-color: rgba(255, 255, 255, 0.22) !important;
        }
        nav[data-theme^="dark"] [data-mobile-getapp-pill] i {
          color: #93c5fd !important;
        }
        nav[data-theme^="dark"] [data-mobile-getapp-pill]:hover {
          background-color: rgba(255, 255, 255, 0.18) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
        }
        nav[data-theme^="dark"] [data-loginbtn] {
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.45) !important;
        }
        nav[data-theme^="dark"] [data-loginbtn]:hover {
          background-color: rgba(255, 255, 255, 0.10) !important;
          border-color: rgba(255, 255, 255, 0.75) !important;
        }
        /* Mobile menu toggle (hamburger) - bars use currentColor */
        nav[data-theme^="dark"] button[aria-label*="menu" i],
        nav[data-theme^="dark"] button[aria-label*="navigation" i] {
          color: #ffffff !important;
        }

        /* ── Dropdown panels (Photographers / Events / Language / Profile) ──
           Convert the white panels to dark glass to match the navbar. The
           coloured header strips inside each panel keep their brand
           gradients - they read fine against either bg. */
        nav[data-theme^="dark"] [data-navdropdown] {
          background: rgba(7, 8, 13, 0.92) !important;
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(255, 255, 255, 0.04) !important;
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
        }
        /* Default text inside the panel - light */
        nav[data-theme^="dark"] [data-navdropdown] {
          color: #f4f6fb;
        }
        /* "No items available" placeholder text */
        nav[data-theme^="dark"] [data-navdropdown] p {
          color: #9ca3af !important;
        }
        /* Skeleton placeholder shimmer - match dark panel */
        nav[data-theme^="dark"] [data-navdropdown] [style*="nav-skeleton-pulse"],
        nav[data-theme^="dark"] [data-navdropdown] div[style*="background: rgb(243, 244, 246)"] {
          background: rgba(255, 255, 255, 0.06) !important;
        }

        /* Category chips inside dropdowns - dark glass with white text,
           hover lifts to a brand-blue tinted glass. Live chips keep their
           emerald accent but on a darker base. */
        nav[data-theme^="dark"] [data-navchip] {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #e5e7eb !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }
        nav[data-theme^="dark"] [data-navchip]:hover {
          background: rgba(31, 107, 255, 0.28) !important;
          color: #ffffff !important;
          border-color: rgba(31, 107, 255, 0.65) !important;
          box-shadow: 0 4px 14px rgba(31, 107, 255, 0.30) !important;
        }
        nav[data-theme^="dark"] [data-navchip].nav-live-card {
          background: rgba(220, 38, 38, 0.12) !important;
          color: #fca5a5 !important;
          border-color: rgba(220, 38, 38, 0.40) !important;
        }
        nav[data-theme^="dark"] [data-navchip].nav-live-card:hover {
          background: rgba(220, 38, 38, 0.32) !important;
          color: #ffffff !important;
          border-color: rgba(220, 38, 38, 0.75) !important;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.40) !important;
        }

        /* Language menu rows - flip light bg/text to dark glass + white */
        nav[data-theme^="dark"] [data-navdropdown] a,
        nav[data-theme^="dark"] [data-navdropdown] button {
          color: #f4f6fb !important;
        }
        nav[data-theme^="dark"] [data-navdropdown] a:hover,
        nav[data-theme^="dark"] [data-navdropdown] button:hover {
          background-color: rgba(31, 107, 255, 0.18) !important;
          color: #ffffff !important;
        }
        /* Selected language row keeps a brand-blue tint */
        nav[data-theme^="dark"] [data-navdropdown] a[style*="rgba(8, 58, 133"] {
          background-color: rgba(31, 107, 255, 0.22) !important;
          color: #93c5fd !important;
        }

        /* ── Mobile drawer ──────────────────────────────────────────
           Convert the slide-in mobile menu to dark glass too. Excludes
           [data-navchip] elements via :not() so the chip-specific rules
           still own the chip styling inside sub-dropdowns. */
        nav[data-theme^="dark"] [data-mobiledrawer] {
          background-color: rgba(7, 8, 13, 0.96) !important;
          border-top-color: rgba(255, 255, 255, 0.10) !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55) !important;
        }
        /* Top-level buttons (Photographers/Events/Lang triggers) and
           links (About/Donate/Find My Photos/Login/Signup) - white text. */
        nav[data-theme^="dark"] [data-mobiledrawer] button:not([data-navchip]),
        nav[data-theme^="dark"] [data-mobiledrawer] a:not([data-navchip]) {
          color: #f4f6fb !important;
        }
        nav[data-theme^="dark"] [data-mobiledrawer] button:not([data-navchip]):hover,
        nav[data-theme^="dark"] [data-mobiledrawer] a:not([data-navchip]):hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
        }
        /* Hamburger close icon when menu is open - keep visible */
        nav[data-theme^="dark"] button[aria-label="Toggle menu"] {
          color: #ffffff !important;
        }
        nav[data-theme^="dark"] button[aria-label="Toggle menu"]:hover {
          background-color: rgba(255, 255, 255, 0.10) !important;
        }
        /* Divider rule between sections of the mobile drawer */
        nav[data-theme^="dark"] [data-mobiledrawer] .border-gray-200 {
          border-color: rgba(255, 255, 255, 0.10) !important;
        }
        /* Mobile sub-dropdown panels (Photographers/Events/Lang sub-list)
           - these are the [data-navdropdown] containers nested inside the
           drawer. The sub-panel itself uses an inline rgba(255,255,255,0.6)
           background that needs to flip dark too. The [data-navdropdown]
           rule above already handles this - the override below only
           tightens the border that was a brand-blue tint. */
        nav[data-theme^="dark"] [data-mobiledrawer] [data-navdropdown] {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        /* Mobile-drawer Sign Up button keeps brand-blue (intentional accent),
           override its hover from #001f4d (dark navy that's invisible on dark
           glass) to a brighter brand-blue. */
        nav[data-theme^="dark"] [data-mobiledrawer] a.bg-\\[\\#002D72\\]:hover {
          background-color: #1f6bff !important;
          color: #ffffff !important;
        }
        /* Mobile drawer Get App card dark theme */
        nav[data-theme^="dark"] [data-mobileappbox] {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }
        nav[data-theme^="dark"] [data-mobileappbox] span {
          color: #ffffff !important;
        }
        nav[data-theme^="dark"] [data-mobileappbox] p {
          color: #cbd5e1 !important;
        }

        /* Phones and tablets. The global reset zeroes Tailwind padding, and the logo
           carries negative offsets meant for desktop, so on a phone the logo and the menu
           icon sat against (and past) the screen edges. Plain rules fix both. */
        @media (max-width: 1023px) {
          .nav-shell { padding-left: 16px !important; padding-right: 16px !important; }
          .nav-shell .nav-logo-icon { left: 0 !important; top: 0 !important; }
          .nav-shell .nav-logo-text { margin-left: 8px !important; }
        }
        @media (max-width: 359px) {
          .nav-shell { padding-left: 12px !important; padding-right: 12px !important; }
          .nav-shell .nav-logo-text { font-size: 1.1rem !important; }
        }
        @media (max-width: 1023px) { .nav-mobile-cluster { display: flex; align-items: center; gap: 8px; flex: none; } }
        .nav-app-pill {
          display: inline-flex; align-items: center; gap: 6px; flex: none;
          height: 36px; padding: 0 14px; border: 0; border-radius: 9999px; cursor: pointer;
          color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.01em; white-space: nowrap;
          background: linear-gradient(135deg, #083A85 0%, #0F4FB6 100%);
          box-shadow: 0 6px 14px -4px rgba(8, 58, 133, 0.5), inset 0 1px 0 rgba(255,255,255,0.18);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .nav-app-pill:active { transform: scale(0.96); }
        .nav-app-pill i { font-size: 14px; }
        .nav-menu-btn {
          display: inline-flex; align-items: center; justify-content: center; flex: none;
          width: 40px; height: 40px; border-radius: 10px; border: 0; background: transparent; cursor: pointer; color: #374151;
        }
        .nav-menu-btn:hover { background: rgba(8, 58, 133, 0.07); }
        .nav-app-pill:focus-visible, .nav-menu-btn:focus-visible { outline: 3px solid #F20C8F; outline-offset: 2px; }
      `}</style>
      {/* Main navbar container */}
      <div className="nav-shell px-3 sm:px-4 xl:px-6" style={{ maxWidth: '1440px', margin: '0 auto', overflow: 'visible', position: 'relative' }}>
        <div className="flex items-center justify-between gap-3" style={{ height: '64px', overflow: 'visible' }}>
          {/* Left: Logo with neon glow + blinking dot */}
          <Link href="/" onClick={handleLinkClick} className="nav-logo-group flex-shrink-0" style={{ zIndex: 1, textDecoration: 'none' }}>
            <img
              src="/logo.png"
              alt="Connekyt Logo"
              className="nav-logo-icon"
              style={{ width: isMobile ? '39px' : '49px', height: isMobile ? '39px' : '49px', objectFit: 'contain', position: 'relative', top: '-1px', left: '-15px' }}
            />
            <span
              className="nav-logo-text font-bold"
              style={{ color: '#083A85', fontSize: isMobile ? '1.25rem' : '1.3rem', marginLeft: '-20px', letterSpacing: '0.3px' }}
            >
              Connekyt
            </span>
          </Link>

          {/* Center: Navigation Links (Desktop) - centered in flex flow, guaranteed non-overlapping */}
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0" style={{ overflow: 'visible' }}>
            <div ref={navPillRef} data-navpill className="flex items-center gap-0 xl:gap-0.5 2xl:gap-1 flex-shrink-0" style={{
              overflow: 'visible',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(8, 58, 133, 0.08)',
              borderRadius: '10px',
              padding: '3px 4px',
            }}>
            {/* Photographers Dropdown */}
            <div
              ref={photographersDropdownRef}
              className="relative"
              onMouseEnter={() => setIsPhotographersDropdownOpen(true)}
              onMouseLeave={() => setIsPhotographersDropdownOpen(false)}
            >
              <Link
                href={getLocalePath('/user/photographers')}
                className={`nav-link-hover ${isPhotographersDropdownOpen ? 'nav-link-active' : ''} flex items-center gap-1 text-gray-700 hover:text-[#083A85] text-[11.5px] xl:text-[13px] 2xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer px-1.5 xl:px-2.5 2xl:px-3 py-1`}
              >
                <span>{t('photographers')}</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isPhotographersDropdownOpen ? 'rotate-180' : ''}`}></i>
              </Link>

              {isPhotographersDropdownOpen && (
                <>
                  {/* Invisible hover bridge */}
                  <div style={{ position: 'absolute', top: '100%', left: '-20px', right: '-20px', height: '16px', zIndex: 9998 }} />
                  <div
                    data-navdropdown
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      left: (() => { if (!navPillRef.current || !photographersDropdownRef.current) return '50%'; const pill = navPillRef.current.getBoundingClientRect(); const link = photographersDropdownRef.current.getBoundingClientRect(); return `${pill.left - link.left}px`; })(),
                      zIndex: 9999,
                      width: navPillRef.current ? `${navPillRef.current.offsetWidth}px` : 'min(420px, 90vw)',
                      background: '#ffffff',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      animation: 'nav-dropdown-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Slim header bar */}
                    <div style={{
                      background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 100%)',
                      padding: '0.75rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="bi bi-camera-fill" style={{ fontSize: '16px', color: 'white' }}></i>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                          {t('photographerCategories.browseTitle')}
                        </span>
                      </div>
                      <Link
                        href={getLocalePath('/user/photographers')}
                        onClick={() => setIsPhotographersDropdownOpen(false)}
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.12)',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      >
                        View all <i className="bi bi-arrow-right" style={{ fontSize: '10px' }}></i>
                      </Link>
                    </div>

                    {/* Categories - compact chips */}
                    <div style={{ padding: '0.75rem 1rem' }}>
                      {categoriesLoading ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                              height: '30px',
                              width: '80px',
                              borderRadius: '10px',
                              background: '#f3f4f6',
                              animation: 'nav-skeleton-pulse 1.5s ease-in-out infinite',
                              animationDelay: `${i * 0.08}s`
                            }} />
                          ))}
                        </div>
                      ) : photographerCategories.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '1rem 0' }}>
                          No photographers available right now.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {photographerCategories.map((category) => (
                            <Link
                              key={category.value}
                              href={getLocalePath(`/user/photographers?category=${category.value}`)}
                              onClick={() => setIsPhotographersDropdownOpen(false)}
                              data-navchip
                              className="block cursor-pointer"
                              style={{
                                padding: '6px 14px',
                                fontSize: '12.5px',
                                fontWeight: '500',
                                color: '#374151',
                                borderRadius: '10px',
                                border: '1px solid #e5e7eb',
                                transition: 'all 0.15s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                background: '#ffffff'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#083A85';
                                e.currentTarget.style.color = '#ffffff';
                                e.currentTarget.style.borderColor = '#083A85';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(8, 58, 133, 0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.color = '#374151';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <i className={`bi ${category.icon}`} style={{ fontSize: '11px' }}></i>
                              <span>{safeCatLabel(category, 'photographerCategories')}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Events Dropdown */}
            <div
              ref={eventsDropdownRef}
              className="relative"
              onMouseEnter={() => setIsEventsDropdownOpen(true)}
              onMouseLeave={() => setIsEventsDropdownOpen(false)}
            >
              <Link
                href={getLocalePath('/user/events')}
                className={`nav-link-hover ${isEventsDropdownOpen ? 'nav-link-active' : ''} ${hasLiveEvents ? 'nav-events-link' : 'text-gray-700 hover:text-[#083A85]'} flex items-center gap-1 text-[11.5px] xl:text-[13px] 2xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer px-1.5 xl:px-2.5 2xl:px-3 py-1`}
              >
                <span>{t('events')}</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isEventsDropdownOpen ? 'rotate-180' : ''}`}></i>
              </Link>

              {isEventsDropdownOpen && (
                <>
                  {/* Invisible hover bridge */}
                  <div style={{ position: 'absolute', top: '100%', left: '-20px', right: '-20px', height: '16px', zIndex: 9998 }} />
                  <div
                    data-navdropdown
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      left: (() => { if (!navPillRef.current || !eventsDropdownRef.current) return '50%'; const pill = navPillRef.current.getBoundingClientRect(); const link = eventsDropdownRef.current.getBoundingClientRect(); return `${pill.left - link.left}px`; })(),
                      zIndex: 9999,
                      width: navPillRef.current ? `${navPillRef.current.offsetWidth}px` : 'min(420px, 90vw)',
                      background: '#ffffff',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      animation: 'nav-dropdown-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Slim header bar */}
                    <div style={{
                      background: hasLiveEvents
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : 'linear-gradient(135deg, #083A85 0%, #0a4da3 100%)',
                      padding: '0.75rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="bi bi-calendar-event-fill" style={{ fontSize: '16px', color: 'white' }}></i>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                          {t('eventCategories.browseTitle')}
                        </span>
                        {hasLiveEvents && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                          }}>
                            <span style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              animation: 'nav-icon-pulse 1.2s ease-in-out infinite'
                            }}></span>
                            Live
                          </span>
                        )}
                      </div>
                      <Link
                        href={getLocalePath('/user/events')}
                        onClick={() => setIsEventsDropdownOpen(false)}
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.12)',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      >
                        View all <i className="bi bi-arrow-right" style={{ fontSize: '10px' }}></i>
                      </Link>
                    </div>

                    {/* Categories - compact chips */}
                    <div style={{ padding: '0.75rem 1rem' }}>
                      {eventCategoriesLoading ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                              height: '30px',
                              width: '80px',
                              borderRadius: '10px',
                              background: '#f3f4f6',
                              animation: 'nav-skeleton-pulse 1.5s ease-in-out infinite',
                              animationDelay: `${i * 0.08}s`
                            }} />
                          ))}
                        </div>
                      ) : eventCategories.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '1rem 0' }}>
                          No events available right now.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {eventCategories.map((category) => (
                            <Link
                              key={category.value}
                              href={getLocalePath(`/user/events?category=${category.value}`)}
                              onClick={() => setIsEventsDropdownOpen(false)}
                              data-navchip
                              className={`block cursor-pointer ${category.isLive ? 'nav-live-card' : ''}`}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12.5px',
                                fontWeight: category.isLive ? '600' : '500',
                                color: category.isLive ? '#dc2626' : '#374151',
                                borderRadius: '10px',
                                border: category.isLive ? '1px solid rgba(220, 38, 38, 0.45)' : '1px solid #e5e7eb',
                                transition: 'all 0.15s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                background: category.isLive ? 'rgba(220, 38, 38, 0.06)' : '#ffffff'
                              }}
                              onMouseEnter={(e) => {
                                if (category.isLive) {
                                  e.currentTarget.style.backgroundColor = '#dc2626';
                                  e.currentTarget.style.color = '#ffffff';
                                  e.currentTarget.style.borderColor = '#dc2626';
                                } else {
                                  e.currentTarget.style.backgroundColor = '#083A85';
                                  e.currentTarget.style.color = '#ffffff';
                                  e.currentTarget.style.borderColor = '#083A85';
                                }
                                e.currentTarget.style.boxShadow = category.isLive
                                  ? '0 2px 8px rgba(220, 38, 38, 0.32)'
                                  : '0 2px 8px rgba(8, 58, 133, 0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = category.isLive ? 'rgba(220, 38, 38, 0.06)' : '#ffffff';
                                e.currentTarget.style.color = category.isLive ? '#dc2626' : '#374151';
                                e.currentTarget.style.borderColor = category.isLive ? 'rgba(220, 38, 38, 0.45)' : '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <i className={`bi ${category.icon} ${category.isLive ? 'nav-live-icon' : ''}`} style={{ fontSize: '11px' }}></i>
                              <span>{safeCatLabel(category, 'eventCategories')}</span>
                              {category.isLive && (
                                <span style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  backgroundColor: 'currentColor',
                                  animation: 'nav-icon-pulse 1.2s ease-in-out infinite',
                                  flexShrink: 0
                                }}></span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link href={getLocalePath('/user/about')} className="nav-link-hover text-gray-700 hover:text-[#083A85] text-[11.5px] xl:text-[13px] 2xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer px-1.5 xl:px-2.5 2xl:px-3 py-1">{t('about')}</Link>
            <Link href={getLocalePath('/user/hall-of-fame')} className="nav-link-hover text-gray-700 hover:text-[#083A85] text-[11.5px] xl:text-[13px] 2xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer px-1.5 xl:px-2.5 2xl:px-3 py-1">Hall of fame</Link>
            <Link href={getLocalePath('/user/donations')} className="nav-link-hover text-gray-700 hover:text-[#083A85] text-[11.5px] xl:text-[13px] 2xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer px-1.5 xl:px-2.5 2xl:px-3 py-1">Donate</Link>
            {/* Find My Photos - dropdown with two paths:
                  • Get Your Photos  → existing face-recognition lookup
                  • Browse Photos   → new stock-style content album browse */}
            <div
              className="relative"
              onMouseEnter={() => setIsFindMyPhotosDropdownOpen(true)}
              onMouseLeave={() => setIsFindMyPhotosDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsFindMyPhotosDropdownOpen(v => !v)}
                className={`nav-link-hover ${isFindMyPhotosDropdownOpen ? 'nav-link-active' : ''} flex items-center gap-1 text-gray-700 hover:text-[#083A85] text-[11.5px] xl:text-[13px] 2xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer bg-transparent border-0 px-1.5 xl:px-2.5 2xl:px-3 py-1`}
              >
                <span>Find My Photos</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isFindMyPhotosDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {isFindMyPhotosDropdownOpen && (
                <>
                  <div style={{ position: 'absolute', top: '100%', left: '-20px', right: '-20px', height: '16px', zIndex: 9998 }} />
                  <div
                    data-navdropdown
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      right: 0,
                      zIndex: 9999,
                      minWidth: 240,
                      background: '#ffffff',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      animation: 'nav-dropdown-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    <Link
                      href={getLocalePath('/user/find-my-photos')}
                      onClick={() => setIsFindMyPhotosDropdownOpen(false)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', textDecoration: 'none', color: '#1a2332' }}
                    >
                      <i className="bi bi-person-bounding-box" style={{ fontSize: 18, color: '#083A85', marginTop: 2 }} />
                      <span>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>Get Your Photos</span>
                        <span style={{ display: 'block', fontSize: 11.5, color: '#6b7280' }}>AI face scan from your events</span>
                      </span>
                    </Link>
                    <div style={{ height: 1, background: '#f0f2f5' }} />
                    <Link
                      href={getLocalePath('/user/browse-photos')}
                      onClick={() => setIsFindMyPhotosDropdownOpen(false)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', textDecoration: 'none', color: '#1a2332' }}
                    >
                      <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: 18, color: '#F20C8F', marginTop: 2 }} />
                      <span>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>Browse Photos</span>
                        <span style={{ display: 'block', fontSize: 11.5, color: '#6b7280' }}>Stock photos by category, paid per photo</span>
                      </span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

          {/* Right: Language, Get App and Auth Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 2xl:gap-3 flex-shrink-0" style={{ zIndex: 1 }}>
            {/* Get App Dropdown / Popover (Desktop) */}
            <div
              ref={getAppDropdownRef}
              className="relative"
              onMouseEnter={() => setIsGetAppOpen(true)}
              onMouseLeave={() => setIsGetAppOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsGetAppOpen(prev => !prev)}
                data-getappbtn
                className="flex items-center gap-1.5 font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                style={{
                  color: '#083A85',
                  fontSize: '12.5px',
                  padding: '5px 11px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(8, 58, 133, 0.08)',
                  border: '1px solid rgba(8, 58, 133, 0.16)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.14)';
                  e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.16)';
                }}
                aria-label="Get the mobile app"
              >
                <i className="bi bi-phone" style={{ fontSize: '13px' }} />
                <span className="hidden xl:inline">{t('getApp')}</span>
                <span className="hidden lg:inline xl:hidden">App</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isGetAppOpen ? 'rotate-180' : ''}`} style={{ fontSize: '9.5px' }} />
              </button>

              {isGetAppOpen && (
                <>
                  <div style={{ position: 'absolute', top: '100%', left: '-20px', right: '-20px', height: '14px', zIndex: 9998 }} />
                  <div
                    data-navdropdown
                    className="absolute right-0"
                    style={{
                      width: '300px',
                      top: 'calc(100% + 10px)',
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 48px -8px rgba(8, 58, 133, 0.22), 0 0 0 1px rgba(8, 58, 133, 0.08)',
                      padding: '14px 16px',
                      overflow: 'hidden',
                      zIndex: 10000,
                      animation: 'nav-dropdown-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #083A85, #0F4FB6)',
                            color: '#fff',
                            fontSize: '12px',
                          }}>
                            <i className="bi bi-phone" />
                          </span>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                            {t('getAppTitle')}
                          </h4>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: 'rgba(8, 58, 133, 0.08)',
                          color: '#083A85',
                        }}>
                          Free
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                        {t('getAppDescription')}
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div style={{
                      background: 'rgba(8, 58, 133, 0.03)',
                      border: '1px solid rgba(8, 58, 133, 0.12)',
                      borderRadius: '12px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}>
                      <QrCodeSvg value={GET_APP_PAGE_URL} size={118} fgColor="#083A85" />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#083A85', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bi bi-camera" style={{ fontSize: '11.5px', color: '#F20C8F' }} />
                        Scan with phone camera
                      </span>
                    </div>

                    <StoreBadges size="sm" direction="column" />

                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsGetAppOpen(false);
                        setIsGetAppModalOpen(true);
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#083A85',
                        background: 'rgba(8, 58, 133, 0.05)',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.05)'; }}
                    >
                      <span>View app features & details</span>
                      <i className="bi bi-arrow-right" style={{ fontSize: '10px' }} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Language Dropdown (Desktop) */}
            <div ref={langMenuRef} className="relative">
              <button
                onClick={toggleLangMenu}
                data-langbtn
                className="flex items-center gap-1.5 font-medium transition-all duration-200 cursor-pointer"
                style={{ color: '#6b7280', fontSize: '13.5px', padding: '6px 10px', borderRadius: '8px' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#083A85'; e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                 <i className="bi bi-globe" style={{ fontSize: '15px' }}></i>
                <span>{selectedLang}</span>
              </button>
              {isLangMenuOpen && (
                <div
                  data-navdropdown
                  className="absolute right-0 w-44"
                  style={{
                    top: 'calc(100% + 12px)',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    right: '-4rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {languages.map((lang) => (
                    <a
                      key={lang.code}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLangSelect(lang.code, lang.name);
                      }}
                      className="cursor-pointer"
                      style={{
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: lang.name === selectedLang ? '#083A85' : '#374151',
                        backgroundColor: lang.name === selectedLang ? 'rgba(8, 58, 133, 0.08)' : 'transparent',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        if (lang.name !== selectedLang) {
                          e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.05)';
                          e.currentTarget.style.color = '#083A85';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (lang.name !== selectedLang) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#374151';
                        }
                      }}
                    >
                      <img
                        src={`https://flagcdn.com/w40/${lang.flagCode}.png`}
                        alt={lang.name}
                        style={{ width: '20px', height: '14px', marginRight: '8px', borderRadius: '2px', objectFit: 'cover' }}
                      />
                      {lang.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated && user ? (
              <div ref={profileDropdownRef} className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 cursor-pointer border-none bg-transparent"
                >
                  <div
                    className="w-9 h-9 rounded-full bg-[#083A85] flex items-center justify-center overflow-hidden"
                    style={{ boxShadow: '0 2px 8px rgba(8, 58, 133, 0.25)' }}
                  >
                    {user.customerType?.toLowerCase() === 'viewer' ? (
                      <i className="bi bi-person-fill" style={{ color: '#fff', fontSize: '18px' }}></i>
                    ) : user.profilePicture ? (
                      <img src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <i className={`bi bi-chevron-down text-gray-600 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} style={{ fontSize: '12px' }}></i>
                </button>

                {isProfileDropdownOpen && (
                  <div
                    data-navdropdown
                    className="absolute right-0 mt-2 w-56"
                    style={{
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      overflow: 'hidden',
                      zIndex: 10000,
                    }}
                  >
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px', marginBottom: '2px' }}>
                        {user.firstName} {user.lastName}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </p>
                    </div>
                    <div style={{ padding: '8px' }}>
                      {user.customerType?.toLowerCase() !== 'viewer' && (
                        <a
                          href={getDashboardUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block cursor-pointer"
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            backgroundColor: 'transparent',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.05)';
                            e.currentTarget.style.color = '#083A85';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#374151';
                          }}
                        >
                          <i className="bi bi-speedometer2" style={{ fontSize: '16px' }}></i>
                          Dashboard
                        </a>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left cursor-pointer"
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#dc2626',
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <i className="bi bi-box-arrow-right" style={{ fontSize: '16px' }}></i>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href={`${getLocalePath('/user/auth/login')}?redirect=${encodeURIComponent(pathname)}`}
                  data-loginbtn
                  className="font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
                  style={{
                    color: '#083A85',
                    fontSize: '14px',
                    padding: '9px 22px',
                    borderRadius: '10px',
                    border: '1.5px solid #083A85',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {t('login')}
                </Link>
                <Link
                  href={`${getLocalePath('/user/auth/signup')}?redirect=${encodeURIComponent(pathname)}`}
                  className="text-white font-semibold whitespace-nowrap cursor-pointer"
                  style={{
                    fontSize: '14px',
                    background: '#083A85',
                    padding: '9px 22px',
                    borderRadius: '10px',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(8, 58, 133, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#062d6b';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(8, 58, 133, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#083A85';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(8, 58, 133, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right: Get App Pill + Hamburger Menu */}
          <div className="lg:hidden nav-mobile-cluster" style={{ zIndex: 1 }}>
            <button
              type="button"
              onClick={() => setIsGetAppModalOpen(true)}
              data-mobile-getapp-pill
              className="nav-app-pill"
              aria-label="Get the mobile app"
            >
              <i className="bi bi-download" />
              <span>App</span>
            </button>

            <button
              ref={mobileMenuButtonRef}
              onClick={toggleMobileMenu}
              className="nav-menu-btn"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: '1.6rem', lineHeight: 1 }}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay - closes the drawer ONLY on a real tap, not
              when a scroll gesture happens to start on the backdrop area.
              We track the touchstart position and compare against touchend;
              if the finger moved more than ~8px in any direction, it's a
              swipe/scroll and we ignore it. Prevents accidental dismissal
              while the user is just trying to scroll the drawer. */}
          <div
            onTouchStart={(e) => {
              const t = e.touches[0];
              backdropTouchStartRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = backdropTouchStartRef.current;
              backdropTouchStartRef.current = null;
              if (!start) return;
              const t = e.changedTouches[0];
              const dx = Math.abs(t.clientX - start.x);
              const dy = Math.abs(t.clientY - start.y);
              // Only treat as a tap if the finger barely moved.
              // Otherwise it's a scroll gesture - leave the drawer open.
              if (dx < 8 && dy < 8) {
                e.preventDefault(); // prevent the synthetic click that follows
                setIsMobileMenuOpen(false);
                document.body.style.overflow = '';
              }
            }}
            onClick={(e) => {
              // For pure mouse clicks (no touch involved), the touchstart
              // ref will be null. If a touch was just processed (handled in
              // onTouchEnd), this onClick is the synthetic follow-up - skip.
              if (e.nativeEvent && (e.nativeEvent as PointerEvent).pointerType === 'touch') return;
              setIsMobileMenuOpen(false);
              document.body.style.overflow = '';
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 40,
              touchAction: 'manipulation',
            }}
          />
        </>
      )}
      <div
        ref={mobileMenuRef}
        data-mobiledrawer
        className="lg:hidden"
        style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          zIndex: 45,
          overflowY: 'auto',
          /* Prevent overscroll from bleeding to body and stop elastic
             scroll on iOS from triggering events on the backdrop */
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
        }}
      >
          <div style={{ paddingLeft: isMobile ? '0.75rem' : '1rem', paddingRight: isMobile ? '0.75rem' : '1rem', paddingTop: '0.75rem', paddingBottom: isMobile ? '1.5rem' : '2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {/* Photographers Dropdown - Mobile */}
            <div>
              <button
                onClick={() => setIsPhotographersDropdownOpen(prev => !prev)}
                className="w-full text-left rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors flex items-center justify-between cursor-pointer"
                style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}
              >
                <span>{t('photographers')}</span>
                <i className={`bi bi-chevron-down transform transition-transform ${isPhotographersDropdownOpen ? 'rotate-180' : ''}`} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}></i>
              </button>
              {isPhotographersDropdownOpen && (
                <div
                  data-navdropdown
                  style={{
                    padding: isMobile ? '6px' : '8px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: isMobile ? '8px' : '10px',
                    border: '1px solid rgba(8, 58, 133, 0.1)',
                    marginLeft: isMobile ? '8px' : '12px',
                    marginTop: '0.5rem'
                  }}
                >
                  {categoriesLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{
                          height: isMobile ? '32px' : '36px',
                          borderRadius: isMobile ? '6px' : '8px',
                          background: '#f3f4f6',
                          animation: 'nav-skeleton-pulse 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.08}s`,
                        }} />
                      ))}
                    </div>
                  )}
                  {!categoriesLoading && photographerCategories.length === 0 && (
                    <p style={{ padding: '8px 10px', color: '#9ca3af', fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>
                      No photographers available right now.
                    </p>
                  )}
                  {photographerCategories.map((category) => (
                    <Link
                      key={category.value}
                      href={getLocalePath(`/user/photographers?category=${category.value}`)}
                      onClick={() => {
                        setIsPhotographersDropdownOpen(false);
                        handleLinkClick();
                      }}
                      className="block cursor-pointer"
                      style={{
                        padding: isMobile ? '8px 10px' : '10px 12px',
                        borderRadius: isMobile ? '6px' : '8px',
                        fontSize: isMobile ? '0.8125rem' : '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease',
                        marginBottom: isMobile ? '2px' : '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '6px' : '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.1)';
                        e.currentTarget.style.color = '#083A85';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#374151';
                      }}
                    >
                      <i className={`bi ${category.icon}`} style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}></i>
                      <span>{safeCatLabel(category, 'photographerCategories')}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Events Dropdown - Mobile */}
            <div>
              <button
                onClick={() => setIsEventsDropdownOpen(prev => !prev)}
                className="w-full text-left rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors flex items-center justify-between cursor-pointer"
                style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}
              >
                <span>{t('events')}</span>
                <i className={`bi bi-chevron-down transform transition-transform ${isEventsDropdownOpen ? 'rotate-180' : ''}`} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}></i>
              </button>
              {isEventsDropdownOpen && (
                <div
                  data-navdropdown
                  style={{
                    padding: isMobile ? '6px' : '8px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: isMobile ? '8px' : '10px',
                    border: '1px solid rgba(8, 58, 133, 0.1)',
                    marginLeft: isMobile ? '8px' : '12px',
                    marginTop: '0.5rem'
                  }}
                >
                  {eventCategoriesLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{
                          height: isMobile ? '32px' : '36px',
                          borderRadius: isMobile ? '6px' : '8px',
                          background: '#f3f4f6',
                          animation: 'nav-skeleton-pulse 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.08}s`,
                        }} />
                      ))}
                    </div>
                  )}
                  {!eventCategoriesLoading && eventCategories.length === 0 && (
                    <p style={{ padding: '8px 10px', color: '#9ca3af', fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>
                      No events available right now.
                    </p>
                  )}
                  {!eventCategoriesLoading && eventCategories.map((category) => (
                    <Link
                      key={category.value}
                      href={getLocalePath(`/user/events?category=${category.value}`)}
                      onClick={() => {
                        setIsEventsDropdownOpen(false);
                        handleLinkClick();
                      }}
                      className="block cursor-pointer"
                      style={{
                        padding: isMobile ? '8px 10px' : '10px 12px',
                        borderRadius: isMobile ? '6px' : '8px',
                        fontSize: isMobile ? '0.8125rem' : '0.875rem',
                        fontWeight: '500',
                        color: category.isLive ? '#dc2626' : '#374151',
                        backgroundColor: category.isLive ? 'rgba(254, 226, 226, 0.8)' : 'transparent',
                        transition: 'all 0.2s ease',
                        marginBottom: isMobile ? '2px' : '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '6px' : '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = category.isLive ? 'rgba(254, 202, 202, 0.9)' : 'rgba(8, 58, 133, 0.1)';
                        e.currentTarget.style.color = category.isLive ? '#b91c1c' : '#083A85';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = category.isLive ? 'rgba(254, 226, 226, 0.8)' : 'transparent';
                        e.currentTarget.style.color = category.isLive ? '#dc2626' : '#374151';
                      }}
                    >
                      <i className={`bi ${category.icon}`} style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: category.isLive ? '#ef4444' : 'inherit' }}></i>
                      <span>{safeCatLabel(category, 'eventCategories')}</span>
                      {category.isLive && (
                        <span style={{
                          marginLeft: 'auto',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          animation: 'nav-icon-pulse 1.2s ease-in-out infinite'
                        }}></span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={getLocalePath('/user/about')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>{t('about')}</Link>
            <Link href={getLocalePath('/user/hall-of-fame')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>Hall of fame</Link>
            <Link href={getLocalePath('/user/donations')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>Donate</Link>
            {/* Mobile: two-row dropdown content (no JS state needed -
                always visible in the slide-out so the buyer never has to
                tap-to-expand inside an already-open mobile menu). */}
            <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>Find My Photos</div>
            <Link href={getLocalePath('/user/find-my-photos')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: '0.5rem 1.25rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>
              <i className="bi bi-person-bounding-box mr-2" /> Get Your Photos
            </Link>
            <Link href={getLocalePath('/user/browse-photos')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: '0.5rem 1.25rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>
              <i className="bi bi-grid-3x3-gap-fill mr-2" /> Browse Photos
            </Link>

            {/* Location Section (Mobile) - Hidden but location detection still active */}

            {/* Language Dropdown (Mobile) */}
            <div className="border-t border-gray-200" style={{ marginTop: isMobile ? '0.5rem' : '0.75rem', marginBottom: isMobile ? '0.5rem' : '0.75rem' }}></div>
             <div ref={langMenuRef} className="relative">
              <button
                onClick={toggleLangMenu}
                className="w-full text-left rounded-md text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-between cursor-pointer"
                style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}
              >
                <span>{t('language')}: {selectedLang}</span>
                 <i className={`bi bi-chevron-down transform transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}></i>
              </button>
              {isLangMenuOpen && (
                 <div
                   style={{
                     padding: isMobile ? '6px' : '8px',
                     background: 'rgba(255, 255, 255, 0.5)',
                     backdropFilter: 'blur(8px)',
                     WebkitBackdropFilter: 'blur(8px)',
                     borderRadius: isMobile ? '8px' : '10px',
                     border: '1px solid rgba(8, 58, 133, 0.1)',
                     marginLeft: isMobile ? '8px' : '12px',
                     marginTop: '0.5rem'
                   }}
                 >
                    {languages.map((lang) => (
                        <a
                            key={lang.code}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLangSelect(lang.code, lang.name);
                            }}
                            className="cursor-pointer"
                            style={{
                              padding: isMobile ? '8px 10px' : '8px 12px',
                              borderRadius: isMobile ? '6px' : '8px',
                              fontSize: isMobile ? '0.8125rem' : '0.875rem',
                              fontWeight: '500',
                              color: lang.name === selectedLang ? '#083A85' : '#374151',
                              backgroundColor: lang.name === selectedLang ? 'rgba(8, 58, 133, 0.1)' : 'transparent',
                              transition: 'all 0.2s ease',
                              marginBottom: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                              if (lang.name !== selectedLang) {
                                e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.06)';
                                e.currentTarget.style.color = '#083A85';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (lang.name !== selectedLang) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#374151';
                              }
                            }}
                        >
                            <img
                              src={`https://flagcdn.com/w40/${lang.flagCode}.png`}
                              alt={lang.name}
                              style={{ width: '20px', height: '14px', marginRight: '8px', borderRadius: '2px', objectFit: 'cover' }}
                            />
                            {lang.name}
                        </a>
                    ))}
                </div>
              )}
            </div>

            {/* Get Connekyt Mobile App in Mobile Drawer */}
            <div
              data-mobileappbox
              style={{
                marginTop: isMobile ? '0.625rem' : '0.875rem',
                marginBottom: isMobile ? '0.625rem' : '0.875rem',
                padding: isMobile ? '0.875rem' : '1.125rem',
                borderRadius: isMobile ? '12px' : '16px',
                background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.08) 0%, rgba(242, 12, 143, 0.05) 50%, rgba(15, 79, 182, 0.12) 100%)',
                border: '1px solid rgba(8, 58, 133, 0.16)',
                boxShadow: '0 4px 16px rgba(8, 58, 133, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, #083A85, #0F4FB6)',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 2px 6px rgba(8, 58, 133, 0.25)',
                  }}>
                    <i className="bi bi-phone" />
                  </span>
                  <span style={{ fontSize: isMobile ? '0.875rem' : '0.9375rem', fontWeight: 700, color: '#083A85' }}>
                    {t('getAppTitle')}
                  </span>
                </div>
                <span
                  className="mobileapp-badge"
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: 'rgba(8, 58, 133, 0.10)',
                    color: '#083A85',
                  }}
                >
                  Free App
                </span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '0.78rem' : '0.8125rem', color: '#4b5563', lineHeight: 1.45 }}>
                {t('getAppDescription')}
              </p>

              {userPlatform === 'ios' || userPlatform === 'android' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <StoreBadge kind={userPlatform} size="md" block />
                  <a
                    href={userPlatform === 'ios' ? PLAY_STORE_URL : APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#64748B', textDecoration: 'none', textAlign: 'center' }}
                  >
                    {userPlatform === 'ios' ? 'Also available on Google Play' : 'Also available on the App Store'}
                  </a>
                </div>
              ) : (
                <StoreBadges size="md" direction="column" />
              )}

              {/* Open full modal / scan details */}
              <button
                type="button"
                onClick={() => setIsGetAppModalOpen(true)}
                style={{
                  marginTop: '9px',
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: isMobile ? '11px' : '11.5px',
                  fontWeight: 600,
                  color: '#083A85',
                  background: 'rgba(8, 58, 133, 0.05)',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>Learn more & scan QR code</span>
                <i className="bi bi-arrow-right" style={{ fontSize: '10px' }} />
              </button>
            </div>

            <div className="border-t border-gray-200" style={{ marginTop: isMobile ? '0.5rem' : '0.75rem', marginBottom: isMobile ? '0.5rem' : '0.75rem' }}></div>

            {isAuthenticated && user ? (
              <>
                {/* User Info */}
                <div style={{
                  padding: isMobile ? '0.75rem' : '1rem',
                  backgroundColor: 'rgba(8, 58, 133, 0.05)',
                  borderRadius: isMobile ? '8px' : '10px',
                  marginBottom: isMobile ? '0.5rem' : '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: isMobile ? '36px' : '40px',
                        height: isMobile ? '36px' : '40px',
                        borderRadius: '50%',
                        backgroundColor: '#083A85',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {user.customerType?.toLowerCase() === 'viewer' ? (
                        <i className="bi bi-person-fill" style={{ color: '#fff', fontSize: '18px' }}></i>
                      ) : user.profilePicture ? (
                        <img src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#fff', fontWeight: '600', fontSize: isMobile ? '12px' : '14px' }}>
                          {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: '600', color: '#1f2937', fontSize: isMobile ? '13px' : '14px', marginBottom: '2px' }}>
                        {user.firstName} {user.lastName}
                      </p>
                      <p style={{ fontSize: isMobile ? '11px' : '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Link - hidden for viewers */}
                {user.customerType?.toLowerCase() !== 'viewer' && (
                  <a
                    href={getDashboardUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="block text-center rounded-md text-gray-900 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                    style={{
                      padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.75rem',
                      fontSize: isMobile ? '0.9375rem' : '1rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="bi bi-speedometer2"></i>
                    Dashboard
                  </a>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-center rounded-md font-medium transition-colors cursor-pointer"
                  style={{
                    padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.75rem',
                    fontSize: isMobile ? '0.9375rem' : '1rem',
                    border: '1px solid #dc2626',
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    borderRadius: '10px',
                    marginTop: isMobile ? '0.25rem' : '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href={`${getLocalePath('/user/auth/login')}?redirect=${encodeURIComponent(pathname)}`} onClick={handleLinkClick} className="block text-center rounded-md text-gray-900 hover:bg-gray-50 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>{t('login')}</Link>
                <Link href={`${getLocalePath('/user/auth/signup')}?redirect=${encodeURIComponent(pathname)}`} onClick={handleLinkClick} className="block text-center bg-[#002D72] text-white rounded-[10px] hover:bg-[#001f4d] font-semibold transition-all duration-300 shadow-sm cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>{t('signup')}</Link>
              </>
            )}
          </div>
      </div>
      <GetAppModal
        isOpen={isGetAppModalOpen}
        onClose={() => setIsGetAppModalOpen(false)}
        userPlatform={userPlatform}
      />
    </nav>
    <div style={{ height: '64px' }} />
    </>
  );
};

export default AmoriaKNavbar;