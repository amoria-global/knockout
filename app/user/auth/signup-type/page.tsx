'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SignupTypeContent() {
  const t = useTranslations('auth.signupType');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('');
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Check if user came from photographer-specific link
  const isPhotographerFlow = searchParams.get('type') === 'photographer';

  // Screen size detection for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1025) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';

  // Define user type options
  const allOptions = [
    {
      id: 'client',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: t('clientTitle'),
      description: t('clientDescription')
    },
    {
      id: 'hired-photographer',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
          <path d="M18 8h.01" />
        </svg>
      ),
      title: t('hiredPhotographerTitle'),
      description: t('hiredPhotographerDescription')
    },
    {
      id: 'freelancer',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M22 8.5V14" />
          <path d="M22 11h-4" />
        </svg>
      ),
      title: t('freelancerTitle'),
      description: t('freelancerDescription')
    }
  ];

  // Filter options based on flow
  const displayOptions = isPhotographerFlow
    ? allOptions.filter(opt => opt.id !== 'client')
    : allOptions;

  const handleContinue = () => {
    if (!selectedType) return;

    // Redirect to signup form with selected type
    router.push(`/user/auth/signup?userType=${selectedType}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DBDBDB',
      padding: isMobile ? '80px 20px 40px 20px' : '20px',
      fontFamily: "'Pragati Narrow', sans-serif"
    }}>
      <div style={{
        maxWidth: isMobile ? '100%' : (isTablet ? '700px' : '900px'),
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          left: '-15px',
          top: '10px',
          textDecoration: 'none',
          flexShrink: 0
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#000',
            marginLeft: '38px',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#083A85'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#000'}
          >
            Amoria
          </span>
          <img
            src="/logo.png"
            alt="Amoria Logo"
            style={{
              height: '40px',
              width: '40px',
              borderRadius: '50%',
              marginLeft: '-8px'
            }}
          />
        </Link>

        {/* Title */}
        <h1 style={{
          fontSize: isMobile ? '28px' : (isTablet ? '36px' : '42px'),
          fontWeight: 700,
          color: '#000',
          marginBottom: isMobile ? '12px' : '16px',
          letterSpacing: '-0.02em',
          lineHeight: '1.2',
          padding: isMobile ? '0 10px' : '0'
        }}>
          {t('title')} {isPhotographerFlow ? t('titlePhotographer') : t('titleClient')}
        </h1>

        {/* Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'
            : (isTablet
              ? (isPhotographerFlow ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)')
              : (isPhotographerFlow ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)')),
          gap: isMobile ? '16px' : '20px',
          marginTop: isMobile ? '32px' : '48px',
          marginBottom: isMobile ? '24px' : '32px'
        }}>
          {displayOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedType(option.id)}
              style={{
                position: 'relative',
                padding: isMobile ? '24px 20px' : '32px 24px',
                backgroundColor: '#fff',
                border: selectedType === option.id ? '3px solid #083A85' : '2px solid #D1D5DB',
                borderRadius: isMobile ? '12px' : '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                minHeight: isMobile ? '180px' : '240px',
                boxShadow: selectedType === option.id
                  ? '0 8px 24px rgba(8, 58, 133, 0.2)'
                  : '0 2px 8px rgba(0, 0, 0, 0.08)',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (selectedType !== option.id && !isMobile) {
                  e.currentTarget.style.borderColor = '#083A85';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(8, 58, 133, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== option.id && !isMobile) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                }
              }}
            >
              {/* Radio Button Indicator */}
              <div style={{
                position: 'absolute',
                top: isMobile ? '16px' : '20px',
                right: isMobile ? '16px' : '20px',
                width: isMobile ? '20px' : '24px',
                height: isMobile ? '20px' : '24px',
                borderRadius: '50%',
                border: selectedType === option.id ? (isMobile ? '6px solid #083A85' : '7px solid #083A85') : '2px solid #D1D5DB',
                backgroundColor: '#fff',
                transition: 'all 0.3s ease'
              }} />

              {/* Icon */}
              <div style={{
                width: isMobile ? '60px' : '80px',
                height: isMobile ? '60px' : '80px',
                marginBottom: isMobile ? '16px' : '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedType === option.id ? '#083A85' : '#6B7280',
                transition: 'color 0.3s ease'
              }}>
                <div style={{ transform: isMobile ? 'scale(0.75)' : 'scale(1)' }}>
                  {option.icon}
                </div>
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: 700,
                color: '#000',
                marginBottom: isMobile ? '8px' : '12px',
                lineHeight: '1.3'
              }}>
                {option.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: isMobile ? '14px' : '15px',
                color: '#6B7280',
                lineHeight: '1.5',
                fontWeight: 500
              }}>
                {option.description}
              </p>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          style={{
            width: isMobile ? '100%' : '50%',
            maxWidth: isMobile ? '100%' : '300px',
            padding: isMobile ? '16px 24px' : '14px 12px',
            backgroundColor: selectedType ? '#083A85' : '#D1D5DB',
            color: '#fff',
            fontSize: isMobile ? '17px' : '18px',
            fontWeight: 700,
            borderRadius: '50px',
            border: 'none',
            cursor: selectedType ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selectedType ? '0 4px 12px rgba(255, 255, 255, 0.3)' : 'none',
            marginBottom: isMobile ? '20px' : '24px',
            minHeight: isMobile ? '52px' : 'auto'
          }}
          onMouseEnter={(e) => {
            if (selectedType && !isMobile) {
              e.currentTarget.style.backgroundColor = '#083A85';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedType && !isMobile) {
              e.currentTarget.style.backgroundColor = '#083A85';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.3)';
            }
          }}
        >
          {selectedType
            ? (displayOptions.find(opt => opt.id === selectedType)?.id === 'client' ? t('continueAsClient') : t('continueAsPhotographer'))
            : t('selectOption')
          }
        </button>

        {/* Already have account link */}
        <p style={{
          fontSize: isMobile ? '15px' : '16px',
          color: '#3d3d3d',
          fontWeight: 600,
          padding: isMobile ? '0 10px' : '0'
        }}>
          {t('alreadyHaveAccount')}{' '}
          <Link
            href="/user/auth/login"
            style={{
              color: '#083A85',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#083A85'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'blue'}
          >
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading component with translations
function LoadingFallback() {
  const t = useTranslations('auth.signupType');
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DBDBDB'
    }}>
      <div style={{
        textAlign: 'center',
        color: '#083A85'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          <i className="bi bi-hourglass-split"></i>
        </div>
        <p style={{
          fontSize: '18px',
          fontWeight: '600'
        }}>{t('loading')}</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SignupTypePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupTypeContent />
    </Suspense>
  );
}
