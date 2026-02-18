'use client';

import React, { useState, useEffect } from 'react';

interface UserTypeModalProps {
  isOpen: boolean;
  onSelect: (userType: string) => void;
  onClose?: () => void;
}

/**
 * UserTypeModal - Mandatory user type selection modal for signup
 * Appears when no userType URL parameter is provided
 * Auto-selects on card click (no Continue button)
 */
export default function UserTypeModal({
  isOpen,
  onSelect,
  onClose,
}: UserTypeModalProps): React.JSX.Element | null {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userOptions = [
    {
      id: 'Photographer',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
          <path d="M18 8h.01" />
        </svg>
      ),
      title: 'Photographer',
      description: 'Join as a professional photographer'
    },
    {
      id: 'Client',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: 'Client',
      description: 'Looking to hire photographers'
    },
    {
      id: 'Event-coordinator',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <circle cx="12" cy="10" r="2" />
          <path d="M7 10h.01" />
          <path d="M17 10h.01" />
        </svg>
      ),
      title: 'Event Coordinator',
      description: 'Organize and manage events'
    }
  ];

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '16px' : '20px',
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isMobile ? '20px 16px 12px' : '24px 24px 16px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{
                position: 'absolute',
                top: isMobile ? '12px' : '16px',
                right: isMobile ? '12px' : '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.color = '#1f2937';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          )}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #083A85 0%, #0d4ea8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 4px 14px rgba(8, 58, 133, 0.3)',
            }}
          >
            <i className="bi bi-person-badge" style={{ fontSize: '22px', color: '#fff' }}></i>
          </div>

          <h2
            style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '4px',
            }}
          >
            How will you use Connekyt?
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#6b7280',
            }}
          >
            Select your account type to get started
          </p>
        </div>

        {/* Selection Cards */}
        <div
          style={{
            padding: isMobile ? '0 16px 20px' : '0 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {userOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              style={{
                position: 'relative',
                padding: '12px',
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#083A85';
                e.currentTarget.style.backgroundColor = '#f0f7ff';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(8, 58, 133, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {option.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '2px',
                  }}
                >
                  {option.title}
                </h3>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0,
                  }}
                >
                  {option.description}
                </p>
              </div>

              {/* Arrow Indicator */}
              <div
                style={{
                  color: '#9ca3af',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
