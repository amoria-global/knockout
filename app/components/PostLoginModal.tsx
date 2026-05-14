'use client';

import React, { useEffect } from 'react';

interface PostLoginModalProps {
  isOpen: boolean;
  userName: string;
  customerType?: string; // 'photographer' | 'client' | 'event-coordinator'
  onKeepExploring: () => void;
  onGoToDashboard: () => void;
}

/**
 * PostLoginModal - Shows options after successful login.
 *
 * Brand-aligned dialog: gradient ring icon tile, brand top stripe, pink
 * uppercase eyebrow, weight-800 title, brand gradient primary CTA with a
 * role-specific icon, soft outlined secondary CTA.
 */
export default function PostLoginModal({
  isOpen,
  userName,
  customerType,
  onKeepExploring,
  onGoToDashboard,
}: PostLoginModalProps): React.JSX.Element | null {
  // Determine dashboard label + icon based on user type (case-insensitive)
  const type = customerType?.toLowerCase();
  const userTypeLabel = type === 'photographer'
    ? 'Photographer'
    : type === 'client'
      ? 'Client'
      : (type === 'event-coordinator' || type === 'coordinator')
        ? 'Event Coordinator'
        : '';
  const dashboardLabel = userTypeLabel
    ? `Continue to ${userTypeLabel} Dashboard`
    : 'Continue to Dashboard';
  const dashboardIcon = type === 'photographer'
    ? 'bi-camera-reels-fill'
    : (type === 'event-coordinator' || type === 'coordinator')
      ? 'bi-megaphone-fill'
      : type === 'client'
        ? 'bi-calendar-event-fill'
        : 'bi-speedometer2';

  // Esc-to-close (sends user to "Keep Exploring")
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKeepExploring();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onKeepExploring]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes ck-postlogin-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ck-postlogin-card-in {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Overlay with Backdrop Blur */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="post-login-title"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'ck-postlogin-backdrop-in 0.25s ease-out',
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            backgroundColor: '#fff',
            borderRadius: 18,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 25px 60px -12px rgba(8,58,133,0.32), 0 12px 28px -8px rgba(242,12,143,0.18)',
            overflow: 'hidden',
            border: '1px solid rgba(8,58,133,0.10)',
            animation: 'ck-postlogin-card-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Brand top stripe */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              zIndex: 2,
            }}
          />

          {/* Soft brand wash behind the icon */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              background: 'radial-gradient(circle at center top, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.06) 35%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Header with Welcome Icon */}
          <div
            style={{
              position: 'relative',
              padding: '34px 24px 18px',
              textAlign: 'center',
            }}
          >
            {/* Gradient-ring icon tile */}
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                padding: 2.5,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                margin: '0 auto 16px',
                boxShadow: '0 12px 28px -6px rgba(242,12,143,0.35)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 17,
                  background: 'linear-gradient(135deg, #083A85 0%, #1e4fb8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="bi bi-check-lg" style={{ fontSize: 30, color: '#fff' }} />
              </div>
            </div>

            {/* Pink uppercase eyebrow */}
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#F20C8F',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              You&apos;re signed in
            </div>

            <h2
              id="post-login-title"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 8px',
                letterSpacing: '-0.015em',
                lineHeight: 1.25,
              }}
            >
              Welcome back, {userName}!
            </h2>
            <p
              style={{
                fontSize: '0.92rem',
                color: '#6b7280',
                lineHeight: 1.55,
                margin: '0 auto',
                maxWidth: 340,
              }}
            >
              You&rsquo;ve successfully logged in. Where would you like to go next?
            </p>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              position: 'relative',
              padding: '8px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Dashboard Button - Primary (brand gradient) */}
            <button
              onClick={onGoToDashboard}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 10px 24px -6px rgba(242,12,143,0.42)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 14px 30px -6px rgba(242,12,143,0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 24px -6px rgba(242,12,143,0.42)';
              }}
            >
              <i className={`bi ${dashboardIcon}`} style={{ fontSize: 17 }} />
              {dashboardLabel}
              <i className="bi bi-arrow-right" style={{ fontSize: 15, marginLeft: 2 }} />
            </button>

            {/* Keep Exploring Button - Secondary (outlined) */}
            <button
              onClick={onKeepExploring}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#fff',
                color: '#374151',
                border: '1.5px solid #e5e7eb',
                borderRadius: 12,
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(242,12,143,0.04)';
                e.currentTarget.style.borderColor = 'rgba(242,12,143,0.40)';
                e.currentTarget.style.color = '#083A85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <i className="bi bi-compass-fill" style={{ fontSize: 15, color: '#F20C8F' }} />
              Keep exploring photographers &amp; events
            </button>

            {/* Helper hint */}
            <div
              style={{
                marginTop: 6,
                textAlign: 'center',
                fontSize: '0.72rem',
                color: '#9ca3af',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <i className="bi bi-keyboard" style={{ fontSize: 11 }} />
              Press <kbd style={{
                fontFamily: 'inherit',
                fontSize: '0.7rem',
                padding: '1px 6px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                color: '#374151',
                fontWeight: 700,
              }}>Esc</kbd> to keep exploring
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
