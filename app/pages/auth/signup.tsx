'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGoogleLogin } from '@react-oauth/google';
import { signup } from '@/lib/APIs/auth/signup/route';
import { useToast } from '@/lib/notifications/ToastProvider';
import UserTypeModal from '@/app/components/UserTypeModal';

interface GoogleUserInfo {
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
  name?: string;
}

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUserType = searchParams.get('userType');
  const [selectedUserType, setSelectedUserType] = useState<string | null>(urlUserType);
  const [showUserTypeModal, setShowUserTypeModal] = useState(!urlUserType);
  const userType = selectedUserType || 'Client';
  const t = useTranslations('auth.signupPage');
  const tAuth = useTranslations('auth');
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo, isOnline } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+250');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGooglePreFilled, setIsGooglePreFilled] = useState(false);

  // Google OAuth login handler
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        // Fetch user info from Google using the access token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch Google user info');
        }

        const userInfo: GoogleUserInfo = await response.json();

        // Pre-fill form fields with Google data
        if (userInfo.given_name) setFirstName(userInfo.given_name);
        if (userInfo.family_name) setLastName(userInfo.family_name);
        if (userInfo.email) setEmail(userInfo.email);

        setIsGooglePreFilled(true);
        showSuccess('Google account connected! Please complete your registration.');
        showInfo('Enter your phone number and create a password to finish signing up.');
      } catch (error) {
        console.error('Google login error:', error);
        showError('Failed to connect Google account. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      showError('Google sign-in was cancelled or failed. Please try again.');
      setGoogleLoading(false);
    },
  });

  // Auto-scroll to phone field after Google pre-fill
  useEffect(() => {
    if (isGooglePreFilled) {
      setTimeout(() => {
        document.getElementById('phoneNumber')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('phoneNumber')?.focus();
      }, 300);
    }
  }, [isGooglePreFilled]);

  // Screen size detection for responsive design
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'large' | 'xlarge'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1025) setScreenSize('tablet');
      else if (width < 1441) setScreenSize('desktop');
      else if (width < 1921) setScreenSize('large');
      else setScreenSize('xlarge');
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const countries = [
    { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
    { name: 'Kenya', code: '+254', flag: '🇰🇪' },
    { name: 'Uganda', code: '+256', flag: '🇺🇬' },
    { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
    { name: 'Burundi', code: '+257', flag: '🇧🇮' },
    { name: 'Democratic Republic of the Congo', code: '+243', flag: '🇨🇩' },
    { name: 'South Sudan', code: '+211', flag: '🇸🇸' },
    { name: 'Mozambique', code: '+258', flag: '🇲🇿' },
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'South Africa', code: '+27', flag: '🇿🇦' },
    { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
    { name: 'Ghana', code: '+233', flag: '🇬🇭' },
    { name: 'Ethiopia', code: '+251', flag: '🇪🇹' },
    { name: 'Egypt', code: '+20', flag: '🇪🇬' },
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'China', code: '+86', flag: '🇨🇳' },
    { name: 'Japan', code: '+81', flag: '🇯🇵' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Germany', code: '+49', flag: '🇩🇪' },
    { name: 'France', code: '+33', flag: '🇫🇷' },
  ];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isDisabled = !firstName || !lastName || !email || phoneNumber.length !== 9 || !password || !confirmPassword;

  const validatePassword = (pwd: string): boolean => {
    const hasNumber = /\d/.test(pwd);
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasSpecialChar = /[@!#$%^&*=+]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    return hasNumber && hasLetter && hasSpecialChar && isLongEnough;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Must be exactly 9 digits
    return digitsOnly.length === 9;
  };

  // Handle phone number input - only allow digits, max 9
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 9) {
      setPhoneNumber(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Validation
    if (!firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('phoneRequired');
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 9 digits';
    }
    if (!email.trim()) newErrors.email = t('emailRequired');
    if (!validatePassword(password)) {
      newErrors.password = t('passwordInvalid');
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwordsNotMatch');
    }

    setErrors(newErrors);

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);

      try {
        const response = await signup({
          firstName,
          lastName,
          email,
          phone: `${countryCode}${phoneNumber}`,
          customerType: userType,
          password,
        });

        // Debug: Log full response in development
        console.log('[Signup] Full API response:', JSON.stringify(response, null, 2));

        if (response.success && response.data) {
          // Extract applicant/customer ID - handle various field names from backend
          const { applicant_id, applicantId: appId, customerId, customer_id } = response.data;
          const applicantId = applicant_id || appId || customerId || customer_id;

          if (!applicantId) {
            const errorMsg = 'Signup succeeded but missing applicant ID. Please contact support.';
            newErrors.email = errorMsg;
            setErrors(newErrors);
            showError(errorMsg);
            setLoading(false);
            return;
          }

          // Show success and redirect to OTP verification
          showSuccess('Account created! Please verify your email.');
          showInfo('Check your email for the verification code.');
          router.push(`/user/auth/verify-otp?applicantId=${encodeURIComponent(String(applicantId))}&email=${encodeURIComponent(email)}`);
        } else {
          // Display the actual error message from the backend
          const errorMessage = response.error || 'Signup failed. Please try again.';
          newErrors.email = errorMessage;
          setErrors(newErrors);
          showError(errorMessage);
        }
      } catch (err) {
        // Handle unexpected errors - show actual error message if available
        const errorMessage = err instanceof Error ? err.message : 'An error occurred during signup. Please try again.';
        newErrors.email = errorMessage;
        setErrors(newErrors);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const isMobile = screenSize === 'mobile';

  // Responsive styles for form inputs (mobile-only responsiveness, desktop keeps original)
  const inputStyle = {
    width: '100%',
    padding: isMobile ? '14px 16px' : '12px 14px',
    fontSize: isMobile ? '16px' : '15px', // 16px on mobile prevents iOS zoom
    border: '2px solid #d1d5db',
    borderRadius: isMobile ? '16px' : '20px',
    outline: 'none',
    transition: 'all 0.3s',
    backgroundColor: '#ffffff',
    minHeight: isMobile ? '50px' : 'auto', // Minimum touch target on mobile only
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    fontSize: isMobile ? '15px' : '15px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: isMobile ? '8px' : '6px'
  };

  const errorStyle = {
    fontSize: isMobile ? '12px' : '13px',
    color: '#dc2626',
    marginTop: isMobile ? '4px' : '4px'
  };

  const handleUserTypeSelect = (type: string) => {
    setSelectedUserType(type);
    setShowUserTypeModal(false);
  };

  return (
    <>
      {/* User Type Selection Modal - appears when no userType in URL */}
      <UserTypeModal
        isOpen={showUserTypeModal}
        onSelect={handleUserTypeSelect}
        onClose={() => router.back()}
      />

      <style>{`
        /* Safe area insets for mobile devices with notches */
        @supports (padding: env(safe-area-inset-top)) {
          .mobile-safe-area {
            padding-top: max(1rem, env(safe-area-inset-top)) !important;
            padding-bottom: max(2rem, env(safe-area-inset-bottom)) !important;
          }
        }

        /* Prevent zoom on iOS input focus */
        @media screen and (max-width: 767px) {
          input[type="text"],
          input[type="email"],
          input[type="tel"],
          input[type="password"],
          select {
            font-size: 16px !important;
          }
        }

        /* Smooth scrolling on mobile */
        @media screen and (max-width: 767px) {
          * {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

      <div
        className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center"
        style={{
          padding: isMobile ? '0' : '4rem 1rem 1rem 1rem',
          paddingTop: isMobile ? '3.5rem' : '4rem',
          position: 'relative'
        }}
      >
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          left: isMobile ? '0.5rem' : '15px',
          top: isMobile ? '0.5rem' : '6px',
          textDecoration: 'none',
          flexShrink: 0,
          zIndex: 1000
        }}>
          <img src="/logo.png" alt="Connekyt Logo" style={{ width: isMobile ? '36px' : '50px', height: isMobile ? '36px' : '50px', objectFit: 'contain', position: 'relative', top: isMobile ? '0px' : '-9px', left: isMobile ? '0px' : '-13px' }} />
          <span className="font-bold" style={{ color: '#083A85', fontSize: isMobile ? '1.25rem' : '1.4rem', marginLeft: isMobile ? '-6px' : '-26px', marginTop: isMobile ? '0px' : '-2px', letterSpacing: '0.5px' }}>onnekyt</span>
        </Link>

      <div
        className="w-full bg-white shadow-2xl overflow-hidden flex flex-col lg:flex-row"
        style={{
          maxWidth: isMobile ? '100%' : '80rem',
          height: isMobile ? 'calc(100vh - 3.5rem)' : '90vh',
          maxHeight: isMobile ? 'none' : '800px',
          borderRadius: isMobile ? '0' : '1.5rem',
          marginTop: isMobile ? '3.5rem' : '0'
        }}
      >

        {/* Left Side - Gradient Card (Hidden on mobile) */}
        <div
          className="hidden lg:flex lg:w-1/2 p-8 lg:p-12 flex-col items-center justify-between h-full"
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0.6) 40%, rgba(217, 217, 217, 1) 55%, rgba(217, 217, 217, 0.8) 70%, rgba(227, 54, 41, 1) 100%)',
            overflow: 'hidden'
          }}
        >
          {/* Overlay gradients */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(63deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0) 100%)',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 90% 0%, rgba(137, 89, 0, 1) 0%, rgba(255, 166, 0, 1) 0%, rgba(255, 166, 0, 0) 90%)',
            pointerEvents: 'none'
          }}></div>

          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex flex-col items-center" style={{ width: '100%' }}>
              {/* Video/Image Frame */}
              <div style={{
                width: '400px',
                height: '180px',
                borderRadius: '20px 0 0 20px',
                overflow: 'hidden',
                marginBottom: '13rem',
                backgroundColor: '#000'
              }}>
                <img src="/signup.png" alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              </div>

              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#000000',
                marginTop: '-10rem',
                maxWidth: '280px',
                lineHeight: '1.3',
                textAlign: 'center'
              }}>
                {t('launchEvent')}
              </h2>
            </div>
          </div>

          {/* Pagination Dots */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '180px', position: 'relative', zIndex: 1, marginBottom: '1rem' }}>
            <div style={{ width: '28px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}></div>
            <div style={{ width: '28px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
            <div style={{ width: '28px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}></div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div
          className={`w-full lg:w-1/2 flex flex-col items-center h-full overflow-y-auto ${isMobile ? 'mobile-safe-area' : ''}`}
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            padding: isMobile ? '1.5rem 1.25rem 2rem 1.25rem' : '30px 40px 30px 50px',
            paddingTop: isMobile ? '1.5rem' : '3rem',
            position: 'relative'
          }}
        >
          {/* Back to Home Button */}
          <Link href="/" style={{
            position: 'absolute',
            top: isMobile ? '1.5rem' : '1.5rem',
            left: isMobile ? '1rem' : '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#083A85',
            textDecoration: 'none',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            transition: 'all 0.3s',
            cursor: 'pointer',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#052559';
            e.currentTarget.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#083A85';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
          >
            <i className="bi bi-house-door-fill" style={{ fontSize: isMobile ? '18px' : '20px' }}></i>
            <span>{isMobile ? 'Back' : 'Back'}</span>
          </Link>

          <div
            className="w-full max-w-md px-6 sm:px-8 md:px-12 py-4 sm:py-6"
            style={{
              padding: isMobile ? '0' : undefined,
              width: '100%',
              maxWidth: isMobile ? '100%' : undefined,
              marginTop: isMobile ? '2.5rem' : '3rem'
            }}
          >
            <h1 style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: '700',
              textAlign: 'left',
              color: '#000000',
              marginBottom: isMobile ? '16px' : '24px',
              letterSpacing: '0.5px',
              marginLeft: isMobile ? '0' : '55px'
            }}>
              {t('title')}
            </h1>

            {/* Social Login Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: isMobile ? '14px' : '16px',
              width: '100%'
            }}>
              {/* Google Button */}
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={googleLoading || isGooglePreFilled}
                style={{
                  flex: '1',
                  padding: isMobile ? '14px 20px' : '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  borderRadius: isMobile ? '16px' : '20px',
                  border: isGooglePreFilled ? '2px solid #10b981' : '2px solid #d1d5db',
                  backgroundColor: isGooglePreFilled ? '#ecfdf5' : '#ffffff',
                  cursor: (googleLoading || isGooglePreFilled) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  minHeight: isMobile ? '50px' : 'auto',
                  opacity: googleLoading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!googleLoading && !isGooglePreFilled) {
                    e.currentTarget.style.borderColor = '#083A85';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!googleLoading && !isGooglePreFilled) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {googleLoading ? (
                  <>
                    <div style={{
                      width: isMobile ? '22px' : '20px',
                      height: isMobile ? '22px' : '20px',
                      border: '2px solid #d1d5db',
                      borderTopColor: '#083A85',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: isMobile ? '15px' : '14px', fontWeight: '600', color: '#374151' }}>Connecting...</span>
                  </>
                ) : isGooglePreFilled ? (
                  <>
                    <svg width={isMobile ? '22' : '20'} height={isMobile ? '22' : '20'} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span style={{ fontSize: isMobile ? '15px' : '14px', fontWeight: '600', color: '#10b981' }}>Google Connected</span>
                  </>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" style={{ width: isMobile ? '22px' : '20px', height: isMobile ? '22px' : '20px' }} />
                    <span style={{ fontSize: isMobile ? '15px' : '14px', fontWeight: '600', color: '#374151' }}>Sign up with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* CSS for spinner animation */}
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              @keyframes pulseHighlight {
                0%, 100% { border-color: #d1d5db; }
                50% { border-color: #083A85; }
              }
            `}</style>

            {/* Helper message after Google pre-fill */}
            {isGooglePreFilled && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: '#eff6ff',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
                marginTop: '4px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '500' }}>
                  Complete your phone number and password below to create your account.
                </span>
              </div>
            )}

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: isMobile ? '16px' : '16px',
              marginTop: isMobile ? '14px' : '16px',
              width: '100%'
            }}>
              <hr style={{ flex: '1', border: 'none', borderTop: '2px solid #d1d5db' }} />
              <span style={{ padding: '0 12px', fontSize: isMobile ? '14px' : '16px', color: '#6b7280', fontWeight: '600' }}>{t('orSignUpWith')}</span>
              <hr style={{ flex: '1', border: 'none', borderTop: '2px solid #d1d5db' }} />
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '14px' : '16px',
                width: '100%'
              }}>
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" style={labelStyle}>
                    {t('firstName')} {isGooglePreFilled && <span style={{ fontSize: '12px', color: '#10b981' }}>(from Google)</span>}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => !isGooglePreFilled && setFirstName(e.target.value)}
                    placeholder={t('firstNamePlaceholder')}
                    readOnly={isGooglePreFilled}
                    style={{
                      ...inputStyle,
                      backgroundColor: isGooglePreFilled ? '#f9fafb' : '#ffffff',
                      cursor: isGooglePreFilled ? 'not-allowed' : 'text'
                    }}
                  />
                  {errors.firstName && <p style={errorStyle}>{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" style={labelStyle}>
                    {t('lastName')} {isGooglePreFilled && <span style={{ fontSize: '12px', color: '#10b981' }}>(from Google)</span>}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => !isGooglePreFilled && setLastName(e.target.value)}
                    placeholder={t('lastNamePlaceholder')}
                    readOnly={isGooglePreFilled}
                    style={{
                      ...inputStyle,
                      backgroundColor: isGooglePreFilled ? '#f9fafb' : '#ffffff',
                      cursor: isGooglePreFilled ? 'not-allowed' : 'text'
                    }}
                  />
                  {errors.lastName && <p style={errorStyle}>{errors.lastName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" style={labelStyle}>
                    {t('yourEmail')} {isGooglePreFilled && <span style={{ fontSize: '12px', color: '#10b981' }}>(from Google)</span>}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => !isGooglePreFilled && setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    readOnly={isGooglePreFilled}
                    style={{
                      ...inputStyle,
                      backgroundColor: isGooglePreFilled ? '#f9fafb' : '#ffffff',
                      cursor: isGooglePreFilled ? 'not-allowed' : 'text'
                    }}
                  />
                  {errors.email && <p style={errorStyle}>{errors.email}</p>}
                </div>

                {/* Phone Number */}
                <div style={{ width: '100%' }}>
                  <label htmlFor="phoneNumber" style={labelStyle}>
                    {t('phone')} {isGooglePreFilled && !phoneNumber && <span style={{ fontSize: '12px', color: '#2563eb' }}>(required)</span>}
                  </label>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    border: isGooglePreFilled && !phoneNumber ? '2px solid #083A85' : '2px solid #d1d5db',
                    borderRadius: isMobile ? '16px' : '20px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    minHeight: isMobile ? '50px' : 'auto',
                    width: '100%',
                    animation: isGooglePreFilled && !phoneNumber ? 'pulseHighlight 2s ease-in-out 3' : 'none',
                  }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        border: '0',
                        borderRight: '2px solid #d1d5db',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        padding: isMobile ? '14px 10px' : '12px 10px',
                        fontSize: isMobile ? '16px' : '15px',
                        minHeight: isMobile ? '50px' : 'auto'
                      }}
                    >
                      {countries.map((country) => (
                        <option key={country.code + country.name} value={country.code}>
                          {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="786875878"
                      maxLength={9}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      style={{
                        flex: '1',
                        border: '0',
                        outline: 'none',
                        padding: isMobile ? '14px 16px' : '12px 14px',
                        fontSize: isMobile ? '16px' : '15px',
                        minHeight: isMobile ? '50px' : 'auto'
                      }}
                    />
                  </div>
                  {errors.phoneNumber && <p style={errorStyle}>{errors.phoneNumber}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" style={labelStyle}>
                    {tAuth('password')} {isGooglePreFilled && !password && <span style={{ fontSize: '12px', color: '#2563eb' }}>(required)</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      style={{
                        ...inputStyle,
                        paddingRight: '44px',
                        borderColor: isGooglePreFilled && !password ? '#083A85' : undefined,
                        animation: isGooglePreFilled && !password ? 'pulseHighlight 2s ease-in-out 3' : 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        padding: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                    </button>
                  </div>
                  <p style={{ fontSize: isMobile ? '14px' : '14px', color: '#6b7280', marginTop: isMobile ? '6px' : '4px', lineHeight: '1.5' }}>
                    {t('passwordHelper')}
                  </p>
                  {errors.password && <p style={errorStyle}>{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" style={labelStyle}>
                    {t('confirmPasswordLabel')} {isGooglePreFilled && !confirmPassword && <span style={{ fontSize: '12px', color: '#2563eb' }}>(required)</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('confirmPasswordPlaceholder')}
                      style={{
                        ...inputStyle,
                        paddingRight: '44px',
                        borderColor: isGooglePreFilled && !confirmPassword ? '#083A85' : undefined,
                        animation: isGooglePreFilled && !confirmPassword ? 'pulseHighlight 2s ease-in-out 3' : 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        padding: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div style={{
                marginTop: isMobile ? '14px' : '16px',
                fontSize: isMobile ? '14px' : '15px',
                color: '#6b7280',
                textAlign: 'left',
                lineHeight: '1.6',
                width: '100%'
              }}>
                {t('termsText')}{' '}
                <a href="/user/terms-of-service" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '800' }}>{t('termsOfService')}</a>
                {' '}{t('and')}{' '}
                <a href="/user/privacy-policy" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '800' }}>{t('privacyPolicy')}</a>.
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: isMobile ? '16px' : '20px', width: '100%' }}>
                <button
                  type="submit"
                  disabled={isDisabled || loading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '15px' : '12px',
                    fontSize: '16px',
                    borderRadius: '30px',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                    cursor: (isDisabled || loading) ? 'not-allowed' : 'pointer',
                    backgroundColor: (isDisabled || loading) ? '#d1d5db' : '#083A85',
                    color: (isDisabled || loading) ? '#9ca3af' : '#ffffff',
                    border: 'none',
                    minHeight: isMobile ? '52px' : 'auto'
                  }}
                  onMouseEnter={(e) => { if (!isDisabled && !loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? 'Creating Account...' : t('createAccountButton')}
                </button>
              </div>
            </form>

            {/* Links */}
            <div style={{
              marginTop: isMobile ? '16px' : '20px',
              marginBottom: isMobile ? '2rem' : '0',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '6px' : '6px',
              paddingBottom: isMobile ? '2rem' : '0',
              width: '100%'
            }}>
              <p style={{ fontSize: isMobile ? '15px' : '15px', color: '#6b7280', margin: 0 }}>
                {t('alreadyHaveAccountText')}{' '}
                <Link href="/user/auth/login" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '800' }}>
                  {t('loginLink')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
