'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';

export default function JoinEvent() {
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
      {/* Background image only */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/arms.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.2)',
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

        {/* Main content - centered */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '24px 16px' : '48px 16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : '576px',
              textAlign: 'center',
              padding: isMobile ? '0 8px' : '0',
            }}
          >
            {/* Main heading */}
            <h1
              style={{
                fontSize: isMobile ? 'clamp(1.75rem, 8vw, 2.5rem)' : '3rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: isMobile ? '16px' : '24px',
                lineHeight: '1.2',
                fontFamily: "'Pragati Narrow', sans-serif",
              }}
            >
              Live Moments, Shared Instantly
            </h1>

            {/* Description */}
            <div
              style={{
                color: 'white',
                fontSize: isMobile ? '0.875rem' : '1rem',
                marginBottom: isMobile ? '32px' : '48px',
                fontFamily: "'Pragati Narrow', sans-serif",
              }}
            >
              <p style={{ marginBottom: '4px' }}>
                Stream Your Event In Real-Time And Let Remote Guests Celebrate With You
              </p>
              <p>Through Reactions, Wishes, And Gifts — No Matter Where They Are.</p>
            </div>

            {/* Join section */}
            <div style={{ marginTop: isMobile ? '8px' : '16px' }}>
              <h2
                style={{
                  fontSize: isMobile ? 'clamp(1.375rem, 6vw, 1.875rem)' : '1.875rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: isMobile ? '16px' : '24px',
                  fontFamily: "'Pragati Narrow', sans-serif",
                }}
              >
                Join Live Now
              </h2>

              {/* Input field */}
              <input
                type="text"
                placeholder="Enter Event Link or Host ID from your event host"
                value={eventLink}
                onChange={(e) => setEventLink(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  borderRadius: isMobile ? '12px' : '16px',
                  color: '#000000',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  textAlign: 'center',
                  fontSize: isMobile ? '0.875rem' : '1.1rem',
                  marginBottom: isMobile ? '12px' : '16px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                  fontFamily: "'Pragati Narrow', sans-serif",
                  boxSizing: 'border-box',
                }}
              />

              {/* Terms text */}
              <p
                style={{
                  color: 'white',
                  fontSize: isMobile ? '0.75rem' : '0.9rem',
                  paddingTop: isMobile ? '6px' : '8px',
                  paddingBottom: isMobile ? '6px' : '8px',
                  marginBottom: isMobile ? '12px' : '16px',
                  fontFamily: "'Pragati Narrow', sans-serif",
                  lineHeight: '1.4',
                }}
              >
                By clicking "Join", you agree to our{' '}
                <a
                  href="/user/terms-of-service"
                  style={{
                    textDecoration: 'underline',
                    color: 'white',
                  }}
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a
                  href="/user/privacy-policy"
                  style={{
                    textDecoration: 'underline',
                    color: 'white',
                  }}
                >
                  Privacy Statement
                </a>
              </p>

              {/* Join button */}
              <button
                onClick={handleJoin}
                style={{
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '384px',
                  margin: '0 auto',
                  display: 'block',
                  backgroundColor: eventLink ? '#039130' : 'white',
                  color: eventLink ? '#FFFFFF' : '#374151',
                  fontWeight: '600',
                  padding: isMobile ? '10px 24px' : '12px 32px',
                  borderRadius: isMobile ? '12px' : '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Pragati Narrow', sans-serif",
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (eventLink) {
                    e.currentTarget.style.backgroundColor = '#039130';
                  } else {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (eventLink) {
                    e.currentTarget.style.backgroundColor = '#039130';
                  } else {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
