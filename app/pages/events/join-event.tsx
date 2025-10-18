'use client';

import { useState } from 'react';
import Navbar from '../../components/navbar';

export default function JoinEvent() {
  const [eventLink, setEventLink] = useState('');

  const handleJoin = () => {
    // Handle join event logic here
    console.log('Joining event:', eventLink);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
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
            padding: '48px 16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '576px',
              textAlign: 'center',
            }}
          >
            {/* Main heading */}
            <h1
              style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '24px',
                lineHeight: '1.2',
              }}
            >
              Live Moments, Shared Instantly
            </h1>

            {/* Description */}
            <div
              style={{
                color: 'white',
                fontSize: '1rem',
                marginBottom: '48px',
              }}
            >
              <p style={{ marginBottom: '4px' }}>
                Stream Your Event In Real-Time And Let Remote Guests Celebrate With You
              </p>
              <p>Through Reactions, Wishes, And Gifts — No Matter Where They Are.</p>
            </div>

            {/* Join section */}
            <div style={{ marginTop: '16px' }}>
              <h2
                style={{
                  fontSize: '1.875rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '24px',
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
                  padding: '12px 20px',
                  borderRadius: '16px',
                  color: '#000000',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  marginBottom: '16px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                }}
              />

              {/* Terms text */}
              <p
                style={{
                  color: 'white',
                  fontSize: '0.9rem',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  marginBottom: '16px',
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
                  maxWidth: '384px',
                  margin: '0 auto',
                  display: 'block',
                  backgroundColor: eventLink ? '#039130' : 'white',
                  color: eventLink ? '#FFFFFF' : '#374151',
                  fontWeight: '600',
                  padding: '12px 32px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
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
