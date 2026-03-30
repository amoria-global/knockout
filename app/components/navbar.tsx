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

// Known event categories — icons and translation keys (must match messages/en.json eventCategories keys)
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

const AmoriaKNavbar = () => {
  const { locale, setLocale } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languageNames[locale as Locale]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPhotographersDropdownOpen, setIsPhotographersDropdownOpen] = useState(false);
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
  const navPillRef = useRef<HTMLDivElement>(null);
  const photographersDropdownRef = useRef<HTMLDivElement>(null);
  const eventsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  // Fetch photographer categories — derive cards directly from photographer specialties
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

          // Second pass: mark live — same logic as the event cards:
          // ONGOING + hasLiveStream flag is sufficient; Cloudflare check adds any missed ones
          let anyLive = false;

          for (const ev of ongoingEvents) {
            if (ev.hasLiveStream === true) {
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
      } catch { /* silent — navbar should never break on API errors */ }
      finally { setEventCategoriesLoading(false); }
    };
    fetchEventCategories();
    const interval = setInterval(fetchEventCategories, 30000);
    return () => clearInterval(interval);
  }, []);

  // Effect to detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect to handle clicks outside of the mobile menu, language dropdown, and profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close mobile menu (but not if clicking the menu button)
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
      // Close language dropdown
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
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

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

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
    return getDashboardUrlWithToken(user?.customerType, token || undefined) || '/user/dashboard';
  };

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        fontFamily: "'Pragati Narrow', sans-serif",
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.85)' : '#DBDBDB',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
        boxShadow: isScrolled
          ? '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)'
          : 'none',
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
            border-color: rgba(16, 185, 129, 0.7);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          25% {
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0),
                        0 0 0 8px rgba(16, 185, 129, 0);
          }
          50% {
            border-color: rgba(52, 211, 153, 1);
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0);
          }
          75% {
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0),
                        0 0 0 8px rgba(16, 185, 129, 0);
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
          border: 1.5px solid rgba(16, 185, 129, 0.7);
        }

        .nav-live-card:hover {
          animation: none;
          box-shadow: inset 0 0 0 1.5px rgba(16, 185, 129, 0.6);
        }

        .nav-live-icon {
          animation: nav-icon-pulse 1s ease-in-out infinite;
        }

        .nav-live-card:hover .nav-live-icon {
          animation: none;
        }

        .nav-live-text {
          color: #059669 !important;
        }

        .nav-live-card:hover .nav-live-text {
          color: #03803f !important;
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
            border-color: rgba(16, 185, 129, 0.7);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          25% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0);
          }
          50% {
            border-color: rgba(52, 211, 153, 1);
            box-shadow: 0 0 0 16px rgba(16, 185, 129, 0),
                        0 0 0 28px rgba(16, 185, 129, 0);
          }
          75% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0);
          }
        }

        .nav-events-link {
          color: #059669 !important;
          border: 1px solid rgba(16, 185, 129, 0.7);
          border-radius: 10px;
          padding: 6px 12px !important;
          animation: nav-events-border-vibrate 1s ease-out infinite;
        }

        .nav-events-link:hover {
          color: #047857 !important;
          animation: none;
          border-color: rgba(16, 185, 129, 1);
          background-color: rgba(16, 185, 129, 0.08) !important;
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
          color: #047857 !important;
          background-color: rgba(16, 185, 129, 0.08) !important;
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
          animation: logo-power-on 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: filter 0.3s ease;
        }

        .nav-logo-text {
          animation: text-neon-on 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
          transition: text-shadow 0.3s ease, letter-spacing 0.3s ease, color 0.3s ease;
        }

        .nav-logo-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #083A85;
          margin-left: 3px;
          margin-bottom: -2px;
          opacity: 0;
          transition: opacity 0.3s ease, box-shadow 0.3s ease;
        }

        .nav-logo-group:hover .nav-logo-icon {
          animation: logo-hover-glow 1.2s ease-in-out infinite;
        }

        .nav-logo-group:hover .nav-logo-text {
          animation: neon-glow-pulse 2s ease-in-out infinite;
          letter-spacing: 1px;
        }

        .nav-logo-group:hover .nav-logo-dot {
          opacity: 1;
          animation: dot-blink 1.2s ease-in-out infinite;
        }
      `}</style>
      {/* Main navbar container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', overflow: 'visible', position: 'relative' }}>
        <div className="flex items-center justify-between" style={{ height: '80px', paddingBottom: '8px', overflow: 'visible' }}>
          {/* Left: Logo — icon above text */}
          <Link href="/" onClick={handleLinkClick} className="flex-shrink-0" style={{ zIndex: 1, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, marginLeft: isMobile ? '0' : '-1rem' }}>
            <img src="/logo.png" alt="Connekyt Logo" style={{ width: isMobile ? '42px' : '54px', height: isMobile ? '42px' : '54px', objectFit: 'contain' }} />
            <span className="font-bold" style={{ color: '#083A85', fontSize: isMobile ? '1.1rem' : '1.35rem', letterSpacing: '0.5px', marginTop: '-4px' }}>Connekyt</span>
          </Link>

          {/* Center: Navigation Links (Desktop) — glass pill, absolutely centered */}
          <div ref={navPillRef} className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2" style={{
            overflow: 'visible',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(8, 58, 133, 0.08)',
            borderRadius: '10px',
            padding: '4px 5px',
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
                className={`nav-link-hover ${isPhotographersDropdownOpen ? 'nav-link-active' : ''} flex items-center gap-1 text-gray-700 hover:text-[#083A85] text-sm lg:text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer`}
              >
                <span>{t('photographers')}</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isPhotographersDropdownOpen ? 'rotate-180' : ''}`}></i>
              </Link>

              {isPhotographersDropdownOpen && (
                <>
                  {/* Invisible hover bridge */}
                  <div style={{ position: 'absolute', top: '100%', left: '-20px', right: '-20px', height: '16px', zIndex: 9998 }} />
                  <div
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

                    {/* Categories — compact chips */}
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
                              <span>{t(`photographerCategories.${category.translationKey}`)}</span>
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
                className={`nav-link-hover ${isEventsDropdownOpen ? 'nav-link-active' : ''} ${hasLiveEvents ? 'nav-events-link' : 'text-gray-700 hover:text-[#083A85]'} flex items-center gap-1 text-sm lg:text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer`}
              >
                <span>{t('events')}</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isEventsDropdownOpen ? 'rotate-180' : ''}`}></i>
              </Link>

              {isEventsDropdownOpen && (
                <>
                  {/* Invisible hover bridge */}
                  <div style={{ position: 'absolute', top: '100%', left: '-20px', right: '-20px', height: '16px', zIndex: 9998 }} />
                  <div
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
                        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
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

                    {/* Categories — compact chips */}
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
                              className={`block cursor-pointer ${category.isLive ? 'nav-live-card' : ''}`}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12.5px',
                                fontWeight: category.isLive ? '600' : '500',
                                color: category.isLive ? '#059669' : '#374151',
                                borderRadius: '10px',
                                border: category.isLive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #e5e7eb',
                                transition: 'all 0.15s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                background: category.isLive ? 'rgba(16, 185, 129, 0.06)' : '#ffffff'
                              }}
                              onMouseEnter={(e) => {
                                if (category.isLive) {
                                  e.currentTarget.style.backgroundColor = '#059669';
                                  e.currentTarget.style.color = '#ffffff';
                                  e.currentTarget.style.borderColor = '#059669';
                                } else {
                                  e.currentTarget.style.backgroundColor = '#083A85';
                                  e.currentTarget.style.color = '#ffffff';
                                  e.currentTarget.style.borderColor = '#083A85';
                                }
                                e.currentTarget.style.boxShadow = category.isLive
                                  ? '0 2px 8px rgba(5, 150, 105, 0.3)'
                                  : '0 2px 8px rgba(8, 58, 133, 0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = category.isLive ? 'rgba(16, 185, 129, 0.06)' : '#ffffff';
                                e.currentTarget.style.color = category.isLive ? '#059669' : '#374151';
                                e.currentTarget.style.borderColor = category.isLive ? 'rgba(16, 185, 129, 0.4)' : '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <i className={`bi ${category.icon} ${category.isLive ? 'nav-live-icon' : ''}`} style={{ fontSize: '11px' }}></i>
                              <span>{t(`eventCategories.${category.translationKey}`)}</span>
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

            <Link href={getLocalePath('/user/about')} className="nav-link-hover text-gray-700 hover:text-[#083A85] text-sm lg:text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer">{t('about')}</Link>
            <Link href={getLocalePath('/user/donations')} className="nav-link-hover text-gray-700 hover:text-[#083A85] text-sm lg:text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer">Donate</Link>
            <Link href={getLocalePath('/user/find-my-photos')} className="nav-link-hover text-gray-700 hover:text-[#083A85] text-sm lg:text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer">Find My Photos</Link>
          </div>

          {/* Right: Language and Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0" style={{ zIndex: 1 }}>
            {/* Language Dropdown (Desktop) */}
            <div ref={langMenuRef} className="relative">
              <button
                onClick={toggleLangMenu}
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

          {/* Mobile Menu Button */}
          <button
            ref={mobileMenuButtonRef}
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors cursor-pointer"
            style={{ padding: isMobile ? '0.375rem' : '0.5rem' }}
            aria-label="Toggle menu"
          >
            <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => {
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
            }}
          />
        </>
      )}
      <div
        ref={mobileMenuRef}
        className="md:hidden"
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
                      <span>{t(`photographerCategories.${category.translationKey}`)}</span>
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
                  {eventCategories.map((category) => (
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
                        color: category.isLive ? '#059669' : '#374151',
                        backgroundColor: category.isLive ? 'rgba(240, 253, 244, 0.8)' : 'transparent',
                        transition: 'all 0.2s ease',
                        marginBottom: isMobile ? '2px' : '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '6px' : '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = category.isLive ? 'rgba(220, 252, 231, 0.9)' : 'rgba(8, 58, 133, 0.1)';
                        e.currentTarget.style.color = category.isLive ? '#047857' : '#083A85';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = category.isLive ? 'rgba(240, 253, 244, 0.8)' : 'transparent';
                        e.currentTarget.style.color = category.isLive ? '#059669' : '#374151';
                      }}
                    >
                      <i className={`bi ${category.icon}`} style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: category.isLive ? '#10b981' : 'inherit' }}></i>
                      <span>{category.displayName ?? t(`eventCategories.${category.translationKey}`)}</span>
                      {category.isLive && (
                        <span style={{
                          marginLeft: 'auto',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          animation: 'nav-icon-pulse 1.2s ease-in-out infinite'
                        }}></span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={getLocalePath('/user/about')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>{t('about')}</Link>
            <Link href={getLocalePath('/user/donations')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>Donate</Link>
            <Link href={getLocalePath('/user/find-my-photos')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>Find My Photos</Link>

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

                {/* Dashboard Link — hidden for viewers */}
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
    </nav>
  );
};

export default AmoriaKNavbar;