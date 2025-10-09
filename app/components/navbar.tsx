'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AmoriaKNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Español' },
    {code: 'Kiny', name: 'Kinyarwanda'},
  ];

  // Effect to handle clicks outside of the mobile menu and language dropdown
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
  
  const handleLangSelect = (langName: string) => {
    setSelectedLang(langName);
    setIsLangMenuOpen(false);
    // You can add language-switching logic here (e.g., using i18next)
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className="bg-[#DBDBDB] sticky top-0 z-50"
      style={{ fontFamily: "'Pragati Narrow', sans-serif", marginLeft: '5px', marginRight: '2px' }}
    >
      {/* Increased horizontal padding for more space */}
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-4 sm:mx-6 lg:mx-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" onClick={handleLinkClick} className="flex items-center space-x-2 flex-shrink-0">
            <img src="/logo.jpg" alt="AmoriaK Logo" className="h-8 w-8 rounded-full" />
            <span className="text-xl font-bold text-gray-900 hover:text-[#083A85]">AmoriaK</span>
          </Link>

          {/* Center: Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-12 absolute left-1/3 transform -translate-x-1/2">
            <Link href="" className="text-gray-700 hover:text-[#083A85] text-base font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer">Photographers</Link>

            <button className="flex items-center gap-1 text-gray-700 hover:text-[#083A85] text-base font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer">
              <span>Events</span>
              <i className="bi bi-chevron-down"></i>
            </button>

            <Link href="" className="text-gray-700 hover:text-[#083A85] text-base font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer">About</Link>
          </div>

          {/* Right: Language and Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-9 flex-shrink-0">
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
                        handleLangSelect(lang.name);
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

            <Link href="/all/login" className="text-gray-900 text-base font-semibold hover:text-[#083A85] transition-colors duration-200 whitespace-nowrap cursor-pointer">Log In</Link>
            <Link href="/all/signup" className="bg-[#083A85] text-white text-base font-medium rounded-full hover:bg-[#001f4d] transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.375rem', paddingBottom: '0.375rem' }}>Sign Up</Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={mobileMenuButtonRef}
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'} text-2xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100/20 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link href="" onClick={handleLinkClick} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-base font-medium transition-colors cursor-pointer">Photographers</Link>
            <button onClick={handleLinkClick} className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-base font-medium transition-colors flex items-center justify-between cursor-pointer">
              <span>Events</span>
              <i className="bi bi-chevron-down"></i>
            </button>
            <Link href="" onClick={handleLinkClick} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-base font-medium transition-colors cursor-pointer">About</Link>
            
            {/* Language Dropdown (Mobile) */}
            <div className="border-t border-gray-200 !my-3"></div>
             <div ref={langMenuRef} className="relative">
              <button
                onClick={toggleLangMenu}
                className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 text-base font-medium flex items-center justify-between cursor-pointer"
              >
                <span>Language: {selectedLang}</span>
                 <i className={`bi bi-chevron-down transform transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {isLangMenuOpen && (
                 <div
                   className="mt-2 pl-6"
                   style={{
                     padding: '6px',
                     background: 'rgba(255, 255, 255, 0.5)',
                     backdropFilter: 'blur(8px)',
                     WebkitBackdropFilter: 'blur(8px)',
                     borderRadius: '10px',
                     border: '1px solid rgba(8, 58, 133, 0.1)',
                     marginLeft: '12px'
                   }}
                 >
                    {languages.map((lang) => (
                        <a
                            key={lang.code}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLangSelect(lang.name);
                            }}
                            className="block cursor-pointer"
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '14px',
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

            <div className="border-t border-gray-200 !my-3"></div>

            <Link href="/all/login" onClick={handleLinkClick} className="block px-3 py-2.5 text-center rounded-md text-gray-900 hover:bg-gray-50 text-base font-medium transition-colors cursor-pointer">Log In</Link>
            <Link href="/all/signup" onClick={handleLinkClick} className="block px-3 py-2.5 text-center bg-[#002D72] text-white rounded-full hover:bg-[#001f4d] text-base font-semibold transition-all duration-300 shadow-sm cursor-pointer">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AmoriaKNavbar;