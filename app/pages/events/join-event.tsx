'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import { useTranslations } from 'next-intl';

export default function JoinEvent() {
  const t = useTranslations('events.joinEventPage');
  const tAuth = useTranslations('auth.signupPage');
  const [eventLink, setEventLink] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Detect screen size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJoin = () => {
    // Only redirect if event link is filled in
    if (eventLink.trim()) {
      router.push('/user/events/live-stream');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Enhanced CSS for premium animations and effects */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .join-button-active {
          animation: pulse-glow 2s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .join-button-active::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 3s infinite;
        }

        .fade-in {
          animation: fadeInUp 0.8s ease-out;
        }

        .scale-in {
          animation: fadeInScale 0.6s ease-out;
        }


        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .icon-bounce {
          display: inline-block;
        }

        /* Focus styles for accessibility */
        input:focus {
          outline: 2px solid rgba(148, 163, 184, 0.6);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.1),
                      0 4px 12px rgba(0, 0, 0, 0.2) !important;
        }

        button:focus {
          outline: 2px solid rgba(148, 163, 184, 0.6);
          outline-offset: 2px;
        }

        /* Smooth scrolling for better UX */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }

        /* Input placeholder animation */
        @keyframes placeholder-shimmer {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }

        input::placeholder {
          animation: placeholder-shimmer 2s ease-in-out infinite;
        }
      `}</style>

      {/* Enhanced background with gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/arms.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.25)',
          willChange: 'transform',
        }}
      ></div>

      {/* Gradient overlay for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(31, 41, 55, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
          pointerEvents: 'none',
        }}
      ></div>

      {/* Animated particles/dots effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      ></div>

      {/* Content container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Navbar */}
        <Navbar />

        {/* Main content - centered with responsive padding */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile
              ? '1.5rem 1rem 2rem 1rem'
              : '1rem 1.5rem',
            minHeight: '0',
          }}
        >
          <div
            className="fade-in glass-card"
            style={{
              width: '100%',
              maxWidth: isMobile ? '95%' : '800px',
              textAlign: 'center',
              padding: isMobile ? '1.75rem 1.25rem 1.75rem 1.25rem' : '1.5rem 3rem 1.5rem 3rem',
              borderRadius: isMobile ? '20px' : '24px',
              position: 'relative',
            }}
          >
            {/* Main heading with enhanced styling */}
            <h1
              className="scale-in"
              style={{
                fontSize: isMobile ? '1.75rem' : '2.25rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: isMobile ? '0.625rem' : '0.875rem',
                marginTop: isMobile ? '0' : '0',
                lineHeight: '1.2',
                fontFamily: "'Pragati Narrow', sans-serif",
                wordBreak: 'break-word',
                textShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
              }}
            >
              {t('mainTitle')}
            </h1>

            {/* Description with responsive spacing */}
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                marginBottom: isMobile ? '1rem' : '1.25rem',
                lineHeight: '1.5',
                padding: isMobile ? '0 0.25rem' : '0 0.5rem',
              }}
            >
              <p style={{
                marginBottom: isMobile ? '0.3125rem' : '0.375rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              }}>
                {t('subtitle1')}
              </p>
              <p style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              }}>
                {t('subtitle2')}
              </p>
            </div>

            {/* Join section with enhanced responsiveness */}
            <div style={{ marginTop: isMobile ? '0.875rem' : '1rem' }}>
              {/* Title without icon */}
              <h2
                style={{
                  fontSize: isMobile ? '1.375rem' : '1.625rem',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  marginBottom: isMobile ? '0.875rem' : '1rem',
                  fontFamily: "'Pragati Narrow', sans-serif",
                  textShadow: '0 3px 12px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '0.5px',
                }}
              >
                {t('title')}
              </h2>

              {/* Input field with premium design */}
              <div style={{ position: 'relative', marginBottom: isMobile ? '0.875rem' : '1rem' }}>
                <input
                  type="text"
                  placeholder={t('codePlaceholder')}
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.8125rem 1rem 0.8125rem 2.75rem' : '0.875rem 1rem 0.875rem 2.75rem',
                    borderRadius: isMobile ? '12px' : '14px',
                    color: '#000000',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid rgba(148, 163, 184, 0.3)',
                    textAlign: 'center',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    fontFamily: "'Pragati Narrow', sans-serif",
                    letterSpacing: '0.5px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.6)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                />
                {/* Input icon */}
                <div
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    opacity: 0.4,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
              </div>

              {/* Terms text with responsive sizing */}
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: isMobile ? '0.75rem' : '0.8125rem',
                  paddingTop: isMobile ? '0.25rem' : '0.375rem',
                  paddingBottom: isMobile ? '0.25rem' : '0.375rem',
                  marginBottom: isMobile ? '0.875rem' : '1rem',
                  lineHeight: '1.4',
                  padding: '0 0.125rem',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
              >
                {tAuth('termsText')}{' '}
                <a
                  href="/user/terms-of-service"
                  style={{
                    textDecoration: 'underline',
                    color: 'white',
                    fontWeight: '500',
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {tAuth('termsOfService')}
                </a>
                {' '}{tAuth('and')}{' '}
                <a
                  href="/user/privacy-policy"
                  style={{
                    textDecoration: 'underline',
                    color: 'white',
                    fontWeight: '500',
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {tAuth('privacyPolicy')}
                </a>
              </p>

              {/* Premium join button with icon */}
              <button
                onClick={handleJoin}
                disabled={!eventLink.trim()}
                style={{
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '100%',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '0.5rem' : '0.5rem',
                  background: eventLink.trim()
                    ? 'linear-gradient(135deg, #1f2937 0%, #374151 100%)'
                    : 'rgba(255, 255, 255, 0.15)',
                  color: eventLink.trim() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '700',
                  padding: isMobile ? '0.8125rem 1.25rem' : '0.875rem 1.5rem',
                  borderRadius: isMobile ? '12px' : '14px',
                  border: eventLink.trim() ? '2px solid #475569' : '2px solid rgba(255, 255, 255, 0.1)',
                  cursor: eventLink.trim() ? 'pointer' : 'not-allowed',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  boxShadow: eventLink.trim()
                    ? '0 6px 20px rgba(0, 0, 0, 0.3)'
                    : '0 3px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxSizing: 'border-box',
                  fontFamily: "'Pragati Narrow', sans-serif",
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (eventLink.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (eventLink.trim()) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                  }
                }}
                onTouchStart={(e) => {
                  if (eventLink.trim()) {
                    e.currentTarget.style.transform = 'scale(0.97)';
                  }
                }}
                onTouchEnd={(e) => {
                  if (eventLink.trim()) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {eventLink.trim() && (
                  <svg
                    width="clamp(20px, 5vw, 24px)"
                    height="clamp(20px, 5vw, 24px)"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{t('join')}</span>
                {eventLink.trim() && (
                  <svg
                    width="clamp(20px, 5vw, 24px)"
                    height="clamp(20px, 5vw, 24px)"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
