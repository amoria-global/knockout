'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';
import { getAuthToken } from '@/lib/api/client';
import { getDashboardUrlWithToken } from '@/lib/utils/dashboard-url';
import { locales, languageNames, type Locale } from '../../i18n';
import { getCategories, type PhotographerCategory } from '@/lib/APIs/public';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Map category names to icons
const categoryIcons: Record<string, string> = {
  'wedding': 'bi-heart-fill',
  'weeding': 'bi-heart-fill', // typo in backend
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
  const [photographerCategories, setPhotographerCategories] = useState<{ value: string; label: string; icon: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const photographersDropdownRef = useRef<HTMLDivElement>(null);
  const eventsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const languages = locales.map((code) => ({
    code,
    name: languageNames[code],
  }));

  // Helper function - no locale prefix needed now
  const getLocalePath = (path: string) => {
    return path;
  };

  // Fetch photographer categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          const categories = response.data
            .filter((cat: PhotographerCategory) => cat.isActive)
            .map((cat: PhotographerCategory) => ({
              value: cat.name.toLowerCase(),
              label: cat.name,
              icon: getIconForCategory(cat.name),
            }));
          setPhotographerCategories(categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const eventCategories = [
    { value: 'wedding', label: t('eventCategories.weddings'), icon: 'bi-heart-fill' },
    { value: 'concert', label: t('eventCategories.concerts'), icon: 'bi-music-note-beamed' },
    { value: 'corporate', label: t('eventCategories.corporate'), icon: 'bi-briefcase-fill' },
    { value: 'sports', label: t('eventCategories.sports'), icon: 'bi-trophy-fill' },
    { value: 'cultural', label: t('eventCategories.cultural'), icon: 'bi-globe' },
    { value: 'conference', label: t('eventCategories.conferences'), icon: 'bi-people-fill' },
  ];

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
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
  };

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const getDashboardUrl = () => {
    const token = getAuthToken();
    // Use type-based URL with user's customerType (token-only, no email needed)
    return getDashboardUrlWithToken(user?.customerType, token || undefined) || '/user/dashboard';
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-transparent' : ''}`}
      style={{
        fontFamily: "'Pragati Narrow', sans-serif",
        marginLeft: '0',
        marginRight: '0',
        backgroundColor: isScrolled ? 'transparent/1' : '#DBDBDB'
      }}
    >
      {/* Increased horizontal padding for more space */}
      <div className="max-w-7xl mx-4 sm:mx-6 lg:mx-8" style={{ paddingLeft: isMobile ? '0.5rem' : '1rem', paddingRight: isMobile ? '0.5rem' : '1rem' }}>
        <div className="flex items-center justify-between h-16">
          <Link href="/" onClick={handleLinkClick} className="flex items-center flex-shrink-0">
          <span className="font-bold text-gray-900 hover:text-[#083A85]" style={{ marginLeft: isMobile ? '0' : '38px', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Amoria</span>
            <img src="/logo.png" alt="AmoriaK Logo" className="rounded-full" style={{ marginLeft: '-7px', width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px' }} />
          </Link>

          {/* Center: Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-12 absolute left-1/3 transform -translate-x-1/2">
            {/* Photographers Dropdown */}
            <div
              ref={photographersDropdownRef}
              className="relative"
              onMouseEnter={() => setIsPhotographersDropdownOpen(true)}
              onMouseLeave={() => setIsPhotographersDropdownOpen(false)}
            >
              <Link
                href={getLocalePath('/user/photographers')}
                className="flex items-center gap-1 text-gray-700 hover:text-[#083A85] text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer"
              >
                <span>{t('photographers')}</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isPhotographersDropdownOpen ? 'rotate-180' : ''}`}></i>
              </Link>

              {isPhotographersDropdownOpen && (
                <>
                  {/* Invisible hover bridge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '-50px',
                      right: '-50px',
                      height: '40px',
                      zIndex: 9998
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      top: 'calc(100% + 20px)',
                      left: '0',
                      width: '55vw',
                      height: '555px',
                      background: 'rgba(255, 255, 255, 0.70)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      boxShadow: '0 15px 50px rgba(0, 0, 0, 0.12)',
                      borderBottom: '2px solid rgba(8, 58, 133, 0.15)',
                      zIndex: 9999,
                      overflow: 'hidden',
                      marginLeft: 'calc(-50vw + 50%)',
                      transform: 'translateX(calc(-50% + 50vw))'
                    }}
                  >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    padding: '4rem 5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '1400px',
                    margin: '0 auto'
                  }}>
                    <div style={{ marginBottom: '0.5rem', flexShrink: 0 }}>
                      <h3 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#083A85',
                        letterSpacing: '0.5px',
                        marginBottom: '0.75rem',
                        lineHeight: '1.2'
                      }}>
                        {t('photographerCategories.browseTitle')}
                      </h3>
                      <p style={{
                        fontSize: '17px',
                        color: '#6b7280',
                        fontWeight: '600',
                        marginBottom: '2.75rem',
                        lineHeight: '1.5'
                      }}>
                        {t('photographerCategories.browseSubtitle')}
                      </p>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '1.75rem',
                      flex: 1,
                      alignContent: 'start'
                    }}>
                      {photographerCategories.map((category) => (
                        <Link
                          key={category.value}
                          href={getLocalePath(`/user/photographers?category=${category.value}`)}
                          onClick={() => setIsPhotographersDropdownOpen(false)}
                          className="block cursor-pointer group"
                          style={{
                            padding: '1rem 1.5rem',
                            fontSize: '17px',
                            fontWeight: '600',
                            color: '#1f2937',
                            backgroundColor: 'rgba(255, 255, 255, 0.90)',
                            borderRadius: '20px',
                            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '1rem',
                            border: '1px solid rgba(8, 58, 133, 0.12)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            height: 'fit-content',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                            e.currentTarget.style.color = '#083A85';
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 58, 133, 0.18)';
                            e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.90)';
                            e.currentTarget.style.color = '#1f2937';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.12)';
                          }}
                        >
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #083A85 0%, #0d4ea8 50%, #1059bd 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 6px 16px rgba(8, 58, 133, 0.25)',
                            transition: 'transform 0.3s ease'
                          }}>
                            <i className={`bi ${category.icon}`} style={{ fontSize: '22px', color: 'white' }}></i>
                          </div>
                          <span style={{ lineHeight: '1.4' }}>{category.label}</span>
                        </Link>
                      ))}
                    </div>
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
                className="flex items-center gap-1 text-gray-700 hover:text-[#083A85] text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer"
              >
                <span>{t('events')}</span>
                <i className={`bi bi-chevron-down transition-transform duration-200 ${isEventsDropdownOpen ? 'rotate-180' : ''}`}></i>
              </Link>

              {isEventsDropdownOpen && (
                <>
                  {/* Invisible hover bridge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '-50px',
                      right: '-50px',
                      height: '40px',
                      zIndex: 9998
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      top: 'calc(100% + 20px)',
                      left: '-350%',
                      width: '75vw',
                      height: '555px',
                      background: 'rgba(255, 255, 255, 0.70)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      boxShadow: '0 15px 50px rgba(0, 0, 0, 0.12)',
                      borderBottom: '2px solid rgba(8, 58, 133, 0.15)',
                      zIndex: 9999,
                      overflow: 'hidden',
                      marginLeft: 'calc(-50vw + 50%)',
                      transform: 'translateX(calc(-50% + 50vw))'
                    }}
                  >
                  <div style={{
                    width: '55vw',
                    height: '100%',
                    padding: '4rem 5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '1400px',
                    marginLeft: 'auto',
                    marginRight: '0'
                  }}>
                    <div style={{ marginBottom: '0.5rem', flexShrink: 0 }}>
                      <h3 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#083A85',
                        letterSpacing: '0.5px',
                        marginBottom: '0.75rem',
                        lineHeight: '1.2'
                      }}>
                        {t('eventCategories.browseTitle')}
                      </h3>
                      <p style={{
                        fontSize: '17px',
                        color: '#6b7280',
                        fontWeight: '600',
                        marginBottom: '2.75rem',
                        lineHeight: '1.5'
                      }}>
                        {t('eventCategories.browseSubtitle')}
                      </p>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '1.75rem',
                      flex: 1,
                      alignContent: 'start'
                    }}>
                      {eventCategories.map((category) => (
                        <Link
                          key={category.value}
                          href={getLocalePath(`/user/events?category=${category.value}`)}
                          onClick={() => setIsEventsDropdownOpen(false)}
                          className="block cursor-pointer group"
                          style={{
                            padding: '1rem 1.5rem',
                            fontSize: '17px',
                            fontWeight: '600',
                            color: '#1f2937',
                            backgroundColor: 'rgba(255, 255, 255, 0.90)',
                            borderRadius: '20px',
                            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '1rem',
                            border: '1px solid rgba(8, 58, 133, 0.12)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            height: 'fit-content',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                            e.currentTarget.style.color = '#083A85';
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 58, 133, 0.18)';
                            e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.90)';
                            e.currentTarget.style.color = '#1f2937';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.12)';
                          }}
                        >
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #083A85 0%, #0d4ea8 50%, #1059bd 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 6px 16px rgba(8, 58, 133, 0.25)',
                            transition: 'transform 0.3s ease'
                          }}>
                            <i className={`bi ${category.icon}`} style={{ fontSize: '22px', color: 'white' }}></i>
                          </div>
                          <span style={{ lineHeight: '1.4' }}>{category.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>

            <Link href={getLocalePath('/user/about')} className="text-gray-700 hover:text-[#083A85] text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer">{t('about')}</Link>
            <Link href={getLocalePath('/user/donations')} className="text-gray-700 hover:text-[#083A85] text-base font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer">Donate</Link>
          </div>

          {/* Right: Language and Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            {/* Location Dropdown (Desktop) - Hidden but location detection still active */}

            {/* Language Dropdown (Desktop) */}
            <div ref={langMenuRef} className="relative">
              <button
                onClick={toggleLangMenu}
                className="flex items-center gap-2 text-gray-700 hover:text-[#083A85] text-base font-medium transition-colors duration-200 cursor-pointer"
              >
                 <i className="bi bi-globe text-lg"></i>
                <span>{selectedLang}</span>
              </button>
              {isLangMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44"
                  style={{
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
                      className="block cursor-pointer"
                      style={{
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: lang.name === selectedLang ? '#083A85' : '#374151',
                        backgroundColor: lang.name === selectedLang ? 'rgba(8, 58, 133, 0.08)' : 'transparent',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        marginBottom: '2px'
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
                    className="w-9 h-9 rounded-full bg-[#083A85] flex items-center justify-center"
                    style={{ boxShadow: '0 2px 8px rgba(8, 58, 133, 0.25)' }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                    </span>
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
                <Link href={getLocalePath('/user/auth/login')} className="text-gray-900 text-base font-semibold hover:text-[#083A85] transition-colors duration-200 whitespace-nowrap cursor-pointer">{t('login')}</Link>
                <Link href={getLocalePath('/user/auth/signup-type')} className="bg-[#083A85] text-white text-base font-medium rounded-full hover:bg-[#001f4d] transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.375rem', paddingBottom: '0.375rem' }}>{t('signup')}</Link>
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
        <div ref={mobileMenuRef} className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100/20 shadow-lg">
          <div style={{ paddingLeft: isMobile ? '0.75rem' : '1rem', paddingRight: isMobile ? '0.75rem' : '1rem', paddingTop: '0.5rem', paddingBottom: isMobile ? '0.75rem' : '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                      <span>{category.label}</span>
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
                      <span>{category.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={getLocalePath('/user/about')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>{t('about')}</Link>
            <Link href={getLocalePath('/user/donations')} onClick={handleLinkClick} className="block rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>Donate</Link>

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
                            className="block cursor-pointer"
                            style={{
                              padding: isMobile ? '8px 10px' : '8px 12px',
                              borderRadius: isMobile ? '6px' : '8px',
                              fontSize: isMobile ? '0.8125rem' : '0.875rem',
                              fontWeight: '500',
                              color: lang.name === selectedLang ? '#083A85' : '#374151',
                              backgroundColor: lang.name === selectedLang ? 'rgba(8, 58, 133, 0.1)' : 'transparent',
                              transition: 'all 0.2s ease',
                              marginBottom: '2px'
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
                      }}
                    >
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: isMobile ? '12px' : '14px' }}>
                        {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                      </span>
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

                {/* Dashboard Link */}
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
                    borderRadius: '9999px',
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
                <Link href={getLocalePath('/user/auth/login')} onClick={handleLinkClick} className="block text-center rounded-md text-gray-900 hover:bg-gray-50 font-medium transition-colors cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>{t('login')}</Link>
                <Link href={getLocalePath('/user/auth/signup-type')} onClick={handleLinkClick} className="block text-center bg-[#002D72] text-white rounded-full hover:bg-[#001f4d] font-semibold transition-all duration-300 shadow-sm cursor-pointer" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.75rem', fontSize: isMobile ? '0.9375rem' : '1rem' }}>{t('signup')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default AmoriaKNavbar;