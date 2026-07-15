'use client';

import React, { useState, useEffect } from 'react';

interface UserTypeModalProps {
  isOpen: boolean;
  onSelect: (userType: string) => void;
  onClose?: () => void;
}

/**
 * UserTypeModal - premium account-type selection modal for signup.
 * Each persona option has its own color identity, gradient icon, and hover effect.
 * Auto-selects on click; supports an optional close callback.
 */
export default function UserTypeModal({
  isOpen,
  onSelect,
  onClose,
}: UserTypeModalProps): React.JSX.Element | null {
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) setSelected(null);
  }, [isOpen]);

  const userOptions = [
    {
      id: 'User',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.9 4.6L19 9l-4 3.3L16.2 18 12 15.3 7.8 18 9 12.3 5 9l5.1-1.4L12 3z" />
        </svg>
      ),
      title: 'User',
      description: 'Watch live streams, buy photos & book photographers',
      tagline: 'For fans & guests',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0EA5E9 50%, #3B82F6 100%)',
      glow: 'rgba(14, 165, 233, 0.45)',
      tag: '#0EA5E9',
    },
    {
      id: 'Photographer',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      ),
      title: 'Photographer',
      description: 'Join as a verified pro · build your portfolio',
      tagline: 'For creators',
      gradient: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 50%, #3B82F6 100%)',
      glow: 'rgba(59, 130, 246, 0.45)',
      tag: '#3B82F6',
    },
    {
      id: 'Client',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: 'Client',
      description: 'Find and book trusted creative talent',
      tagline: 'For memory keepers',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #B83AB6 50%, #EC4899 100%)',
      glow: 'rgba(184, 58, 182, 0.45)',
      tag: '#B83AB6',
    },
    {
      id: 'Coordinator',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M16 2v4" /><path d="M8 2v4" />
          <path d="M3 10h18" />
          <circle cx="12" cy="15" r="1.6" fill="currentColor" />
        </svg>
      ),
      title: 'Event Coordinator',
      description: 'Organize, manage, and broadcast events',
      tagline: 'For organizers',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #B83AB6 100%)',
      glow: 'rgba(239, 68, 68, 0.45)',
      tag: '#EF4444',
    },
  ];

  if (!isOpen) return null;

  const handlePick = (id: string) => {
    setSelected(id);
    // Brief delay so the user sees the selected state before the modal transitions away
    window.setTimeout(() => onSelect(id), 220);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes utmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes utmScaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes utmFloat {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(8px,-6px); }
        }
        @keyframes utmDot {
          0%,100% { opacity: 0.45; transform: scale(1); }
          50%     { opacity: 1; transform: scale(1.18); }
        }
        @media (prefers-reduced-motion: reduce) {
          .utm-overlay, .utm-modal, .utm-orb, .utm-header-dot {
            animation: none !important;
          }
        }
      ` }} />
      <div
        className="utm-overlay"
        onClick={(e) => { e.stopPropagation(); onClose?.(); }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(8, 12, 28, 0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '16px' : '20px',
          animation: 'utmFadeIn 0.25s ease-out',
        }}
      >
        {/* Modal */}
        <div
          className="utm-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            backgroundColor: '#fff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: isMobile ? '100%' : '460px',
            boxShadow: '0 30px 80px -20px rgba(8,12,28,0.55), 0 8px 24px -8px rgba(8,58,133,0.30)',
            overflow: 'hidden',
            animation: 'utmScaleIn 0.36s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Decorative orbs (header background) */}
          <div
            className="utm-orb"
            aria-hidden="true"
            style={{
              position: 'absolute', top: -60, left: -40,
              width: 220, height: 220, borderRadius: '50%',
              background: 'radial-gradient(closest-side, rgba(8,58,133,0.18), transparent 65%)',
              filter: 'blur(20px)', pointerEvents: 'none',
              animation: 'utmFloat 8s ease-in-out infinite',
            }}
          />
          <div
            className="utm-orb"
            aria-hidden="true"
            style={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180, borderRadius: '50%',
              background: 'radial-gradient(closest-side, rgba(184,58,182,0.16), transparent 65%)',
              filter: 'blur(22px)', pointerEvents: 'none',
              animation: 'utmFloat 10s ease-in-out infinite',
              animationDelay: '-3s',
            }}
          />

          {/* Top brand stripe */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, transparent, #083A85 20%, #B83AB6 50%, #EC4899 80%, transparent)',
              opacity: 0.85,
            }}
          />

          {/* Header */}
          <div
            style={{
              padding: isMobile ? '24px 18px 14px' : '30px 28px 18px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: isMobile ? '12px' : '14px',
                  right: isMobile ? '12px' : '14px',
                  width: '34px', height: '34px',
                  borderRadius: '50%',
                  border: '1px solid rgba(8,12,28,0.08)',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  zIndex: 5,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0F172A';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.85)';
                  e.currentTarget.style.color = '#475569';
                  e.currentTarget.style.borderColor = 'rgba(8,12,28,0.08)';
                  e.currentTarget.style.transform = 'rotate(0)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Eyebrow pill */}
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 12px',
                background: 'rgba(8,58,133,0.06)',
                border: '1px solid rgba(8,58,133,0.18)',
                borderRadius: 999,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#083A85',
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              <span
                className="utm-header-dot"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #083A85, #B83AB6)',
                  boxShadow: '0 0 8px rgba(184,58,182,0.6)',
                  animation: 'utmDot 1.6s ease-in-out infinite',
                }}
              />
              Step 1 of 2
            </div>

            <h2
              style={{
                fontFamily: "'Pragati Narrow', system-ui, sans-serif",
                fontSize: isMobile ? '22px' : '26px',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 6,
                letterSpacing: '-0.005em',
                lineHeight: 1.2,
              }}
            >
              How will you use{' '}
              <span style={{
                fontStyle: 'italic',
                background: 'linear-gradient(90deg, #083A85, #B83AB6, #EC4899)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                paddingRight: '0.1em',
              }}>Connekyt</span>?
            </h2>
            <p
              style={{
                fontSize: 13,
                color: '#64748B',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Pick the one that fits you best. You can change it later.
            </p>
          </div>

          {/* Selection Cards */}
          <div
            style={{
              padding: isMobile ? '4px 16px 22px' : '6px 24px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {userOptions.map((option) => {
              const isHovered = hovered === option.id;
              const isPicked = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handlePick(option.id)}
                  onMouseEnter={() => setHovered(option.id)}
                  onMouseLeave={() => setHovered(null)}
                  disabled={!!selected && !isPicked}
                  style={{
                    position: 'relative',
                    padding: '14px',
                    backgroundColor: isPicked ? '#FAFBFE' : '#fff',
                    border: '1.5px solid',
                    borderColor: isHovered || isPicked ? 'transparent' : '#E5E7EB',
                    borderRadius: '14px',
                    cursor: selected ? 'default' : 'pointer',
                    transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'left',
                    width: '100%',
                    transform: isHovered ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
                    boxShadow: isHovered || isPicked
                      ? `0 14px 28px -12px ${option.glow}, 0 4px 10px -4px rgba(15,23,42,0.06), 0 0 0 1.5px ${option.tag}`
                      : '0 1px 2px rgba(15,23,42,0.04)',
                    opacity: !!selected && !isPicked ? 0.55 : 1,
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 46, height: 46,
                      borderRadius: '12px',
                      background: option.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                      transform: isHovered ? 'rotate(-4deg) scale(1.06)' : 'rotate(0) scale(1)',
                      boxShadow: isHovered || isPicked ? `0 8px 18px -6px ${option.glow}` : 'none',
                    }}
                  >
                    {option.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: option.tag,
                        marginBottom: 4,
                      }}
                    >
                      {option.tagline}
                    </div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#0F172A',
                        marginBottom: 2,
                        margin: 0,
                        lineHeight: 1.25,
                      }}
                    >
                      {option.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: '#64748B',
                        margin: 0,
                        lineHeight: 1.45,
                      }}
                    >
                      {option.description}
                    </p>
                  </div>

                  {/* Trailing - checkmark when picked, arrow otherwise */}
                  <div
                    style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: isHovered || isPicked ? option.gradient : '#F3F4F6',
                      color: isHovered || isPicked ? '#fff' : '#94A3B8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                      transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                    }}
                  >
                    {isPicked ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer trust strip */}
          <div
            style={{
              padding: isMobile ? '12px 16px 18px' : '14px 24px 22px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 11,
              color: '#94A3B8',
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Verified creators
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
              </svg>
              Secure & private
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B83AB6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              47+ cities
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
