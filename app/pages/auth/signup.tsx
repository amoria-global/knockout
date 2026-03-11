'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGoogleLogin } from '@react-oauth/google';
import { signup } from '@/lib/APIs/auth/signup/route';
import { googleAuth } from '@/lib/APIs/auth/google/route';
import { setAuthToken } from '@/lib/api/client';
import { useToast } from '@/lib/notifications/ToastProvider';
import UserTypeModal from '@/app/components/UserTypeModal';

interface GoogleUserInfo {
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
  name?: string;
}

/**
 * Google Signup Button — isolated so useGoogleLogin only runs inside GoogleOAuthProvider context.
 */
function GoogleSignupButton({ onSuccess, onError, disabled, isConnected, isMobile }: {
  onSuccess: (tokenResponse: { access_token: string }) => void;
  onError: (error: unknown) => void;
  disabled: boolean;
  isConnected: boolean;
  isMobile: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setLoading(true);
      onSuccess(tokenResponse);
      setLoading(false);
    },
    onError: (error) => {
      setLoading(false);
      onError(error);
    },
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={disabled || isConnected}
      style={{
        flex: '1',
        padding: isMobile ? '14px 20px' : '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        borderRadius: isMobile ? '16px' : '20px',
        border: isConnected ? '2px solid #10b981' : '2px solid #d1d5db',
        backgroundColor: isConnected ? '#ecfdf5' : '#ffffff',
        cursor: (disabled || isConnected) ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s',
        minHeight: isMobile ? '50px' : 'auto',
        opacity: loading ? 0.7 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isConnected) {
          e.currentTarget.style.borderColor = '#083A85';
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isConnected) {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {loading ? (
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
      ) : isConnected ? (
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
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUserType = searchParams.get('userType');
  const redirectUrl = searchParams.get('redirect');
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
  const [countryIso, setCountryIso] = useState('rw');
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGooglePreFilled, setIsGooglePreFilled] = useState(false);

  // Google OAuth success handler
  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Google user info');
      }

      const userInfo: GoogleUserInfo = await response.json();

      // Try backend Google auth — if user already exists, they get a token and we redirect
      try {
        const backendResponse = await googleAuth({
          email: userInfo.email,
          firstName: userInfo.given_name || '',
          lastName: userInfo.family_name || '',
          customerType: userType,
        });

        if (backendResponse.success && backendResponse.data?.token) {
          // Existing user — store token and redirect
          setAuthToken(backendResponse.data.token);
          showSuccess('Welcome back! Redirecting...');
          router.push(redirectUrl || '/user');
          return;
        }
      } catch {
        // Backend call failed — continue with form pre-fill
      }

      // New user — pre-fill the form
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
  };

  const handleGoogleError = (error: unknown) => {
    console.error('Google OAuth error:', error);
    showError('Google sign-in was cancelled or failed. Please try again.');
    setGoogleLoading(false);
  };

  // Close country dropdown on outside click
  useEffect(() => {
    if (!isCountryOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-country-selector]')) setIsCountryOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isCountryOpen]);

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
    { name: 'Rwanda', code: '+250', iso: 'rw' },
    { name: 'Afghanistan', code: '+93', iso: 'af' },
    { name: 'Albania', code: '+355', iso: 'al' },
    { name: 'Algeria', code: '+213', iso: 'dz' },
    { name: 'Andorra', code: '+376', iso: 'ad' },
    { name: 'Angola', code: '+244', iso: 'ao' },
    { name: 'Antigua and Barbuda', code: '+1-268', iso: 'ag' },
    { name: 'Argentina', code: '+54', iso: 'ar' },
    { name: 'Armenia', code: '+374', iso: 'am' },
    { name: 'Australia', code: '+61', iso: 'au' },
    { name: 'Austria', code: '+43', iso: 'at' },
    { name: 'Azerbaijan', code: '+994', iso: 'az' },
    { name: 'Bahamas', code: '+1-242', iso: 'bs' },
    { name: 'Bahrain', code: '+973', iso: 'bh' },
    { name: 'Bangladesh', code: '+880', iso: 'bd' },
    { name: 'Barbados', code: '+1-246', iso: 'bb' },
    { name: 'Belarus', code: '+375', iso: 'by' },
    { name: 'Belgium', code: '+32', iso: 'be' },
    { name: 'Belize', code: '+501', iso: 'bz' },
    { name: 'Benin', code: '+229', iso: 'bj' },
    { name: 'Bhutan', code: '+975', iso: 'bt' },
    { name: 'Bolivia', code: '+591', iso: 'bo' },
    { name: 'Bosnia and Herzegovina', code: '+387', iso: 'ba' },
    { name: 'Botswana', code: '+267', iso: 'bw' },
    { name: 'Brazil', code: '+55', iso: 'br' },
    { name: 'Brunei', code: '+673', iso: 'bn' },
    { name: 'Bulgaria', code: '+359', iso: 'bg' },
    { name: 'Burkina Faso', code: '+226', iso: 'bf' },
    { name: 'Burundi', code: '+257', iso: 'bi' },
    { name: 'Cambodia', code: '+855', iso: 'kh' },
    { name: 'Cameroon', code: '+237', iso: 'cm' },
    { name: 'Canada', code: '+1', iso: 'ca' },
    { name: 'Cape Verde', code: '+238', iso: 'cv' },
    { name: 'Central African Republic', code: '+236', iso: 'cf' },
    { name: 'Chad', code: '+235', iso: 'td' },
    { name: 'Chile', code: '+56', iso: 'cl' },
    { name: 'China', code: '+86', iso: 'cn' },
    { name: 'Colombia', code: '+57', iso: 'co' },
    { name: 'Comoros', code: '+269', iso: 'km' },
    { name: 'Congo DRC', code: '+243', iso: 'cd' },
    { name: 'Congo Republic', code: '+242', iso: 'cg' },
    { name: 'Costa Rica', code: '+506', iso: 'cr' },
    { name: "Cote d'Ivoire", code: '+225', iso: 'ci' },
    { name: 'Croatia', code: '+385', iso: 'hr' },
    { name: 'Cuba', code: '+53', iso: 'cu' },
    { name: 'Cyprus', code: '+357', iso: 'cy' },
    { name: 'Czech Republic', code: '+420', iso: 'cz' },
    { name: 'Denmark', code: '+45', iso: 'dk' },
    { name: 'Djibouti', code: '+253', iso: 'dj' },
    { name: 'Dominica', code: '+1-767', iso: 'dm' },
    { name: 'Dominican Republic', code: '+1-809', iso: 'do' },
    { name: 'Ecuador', code: '+593', iso: 'ec' },
    { name: 'Egypt', code: '+20', iso: 'eg' },
    { name: 'El Salvador', code: '+503', iso: 'sv' },
    { name: 'Equatorial Guinea', code: '+240', iso: 'gq' },
    { name: 'Eritrea', code: '+291', iso: 'er' },
    { name: 'Estonia', code: '+372', iso: 'ee' },
    { name: 'Eswatini', code: '+268', iso: 'sz' },
    { name: 'Ethiopia', code: '+251', iso: 'et' },
    { name: 'Fiji', code: '+679', iso: 'fj' },
    { name: 'Finland', code: '+358', iso: 'fi' },
    { name: 'France', code: '+33', iso: 'fr' },
    { name: 'Gabon', code: '+241', iso: 'ga' },
    { name: 'Gambia', code: '+220', iso: 'gm' },
    { name: 'Georgia', code: '+995', iso: 'ge' },
    { name: 'Germany', code: '+49', iso: 'de' },
    { name: 'Ghana', code: '+233', iso: 'gh' },
    { name: 'Greece', code: '+30', iso: 'gr' },
    { name: 'Grenada', code: '+1-473', iso: 'gd' },
    { name: 'Guatemala', code: '+502', iso: 'gt' },
    { name: 'Guinea', code: '+224', iso: 'gn' },
    { name: 'Guinea-Bissau', code: '+245', iso: 'gw' },
    { name: 'Guyana', code: '+592', iso: 'gy' },
    { name: 'Haiti', code: '+509', iso: 'ht' },
    { name: 'Honduras', code: '+504', iso: 'hn' },
    { name: 'Hungary', code: '+36', iso: 'hu' },
    { name: 'Iceland', code: '+354', iso: 'is' },
    { name: 'India', code: '+91', iso: 'in' },
    { name: 'Indonesia', code: '+62', iso: 'id' },
    { name: 'Iran', code: '+98', iso: 'ir' },
    { name: 'Iraq', code: '+964', iso: 'iq' },
    { name: 'Ireland', code: '+353', iso: 'ie' },
    { name: 'Israel', code: '+972', iso: 'il' },
    { name: 'Italy', code: '+39', iso: 'it' },
    { name: 'Jamaica', code: '+1-876', iso: 'jm' },
    { name: 'Japan', code: '+81', iso: 'jp' },
    { name: 'Jordan', code: '+962', iso: 'jo' },
    { name: 'Kazakhstan', code: '+7', iso: 'kz' },
    { name: 'Kenya', code: '+254', iso: 'ke' },
    { name: 'Kiribati', code: '+686', iso: 'ki' },
    { name: 'Kuwait', code: '+965', iso: 'kw' },
    { name: 'Kyrgyzstan', code: '+996', iso: 'kg' },
    { name: 'Laos', code: '+856', iso: 'la' },
    { name: 'Latvia', code: '+371', iso: 'lv' },
    { name: 'Lebanon', code: '+961', iso: 'lb' },
    { name: 'Lesotho', code: '+266', iso: 'ls' },
    { name: 'Liberia', code: '+231', iso: 'lr' },
    { name: 'Libya', code: '+218', iso: 'ly' },
    { name: 'Liechtenstein', code: '+423', iso: 'li' },
    { name: 'Lithuania', code: '+370', iso: 'lt' },
    { name: 'Luxembourg', code: '+352', iso: 'lu' },
    { name: 'Madagascar', code: '+261', iso: 'mg' },
    { name: 'Malawi', code: '+265', iso: 'mw' },
    { name: 'Malaysia', code: '+60', iso: 'my' },
    { name: 'Maldives', code: '+960', iso: 'mv' },
    { name: 'Mali', code: '+223', iso: 'ml' },
    { name: 'Malta', code: '+356', iso: 'mt' },
    { name: 'Marshall Islands', code: '+692', iso: 'mh' },
    { name: 'Mauritania', code: '+222', iso: 'mr' },
    { name: 'Mauritius', code: '+230', iso: 'mu' },
    { name: 'Mexico', code: '+52', iso: 'mx' },
    { name: 'Micronesia', code: '+691', iso: 'fm' },
    { name: 'Moldova', code: '+373', iso: 'md' },
    { name: 'Monaco', code: '+377', iso: 'mc' },
    { name: 'Mongolia', code: '+976', iso: 'mn' },
    { name: 'Montenegro', code: '+382', iso: 'me' },
    { name: 'Morocco', code: '+212', iso: 'ma' },
    { name: 'Mozambique', code: '+258', iso: 'mz' },
    { name: 'Myanmar', code: '+95', iso: 'mm' },
    { name: 'Namibia', code: '+264', iso: 'na' },
    { name: 'Nauru', code: '+674', iso: 'nr' },
    { name: 'Nepal', code: '+977', iso: 'np' },
    { name: 'Netherlands', code: '+31', iso: 'nl' },
    { name: 'New Zealand', code: '+64', iso: 'nz' },
    { name: 'Nicaragua', code: '+505', iso: 'ni' },
    { name: 'Niger', code: '+227', iso: 'ne' },
    { name: 'Nigeria', code: '+234', iso: 'ng' },
    { name: 'North Korea', code: '+850', iso: 'kp' },
    { name: 'North Macedonia', code: '+389', iso: 'mk' },
    { name: 'Norway', code: '+47', iso: 'no' },
    { name: 'Oman', code: '+968', iso: 'om' },
    { name: 'Pakistan', code: '+92', iso: 'pk' },
    { name: 'Palau', code: '+680', iso: 'pw' },
    { name: 'Palestine', code: '+970', iso: 'ps' },
    { name: 'Panama', code: '+507', iso: 'pa' },
    { name: 'Papua New Guinea', code: '+675', iso: 'pg' },
    { name: 'Paraguay', code: '+595', iso: 'py' },
    { name: 'Peru', code: '+51', iso: 'pe' },
    { name: 'Philippines', code: '+63', iso: 'ph' },
    { name: 'Poland', code: '+48', iso: 'pl' },
    { name: 'Portugal', code: '+351', iso: 'pt' },
    { name: 'Qatar', code: '+974', iso: 'qa' },
    { name: 'Romania', code: '+40', iso: 'ro' },
    { name: 'Russia', code: '+7', iso: 'ru' },
    { name: 'Saint Kitts and Nevis', code: '+1-869', iso: 'kn' },
    { name: 'Saint Lucia', code: '+1-758', iso: 'lc' },
    { name: 'Saint Vincent', code: '+1-784', iso: 'vc' },
    { name: 'Samoa', code: '+685', iso: 'ws' },
    { name: 'San Marino', code: '+378', iso: 'sm' },
    { name: 'Sao Tome and Principe', code: '+239', iso: 'st' },
    { name: 'Saudi Arabia', code: '+966', iso: 'sa' },
    { name: 'Senegal', code: '+221', iso: 'sn' },
    { name: 'Serbia', code: '+381', iso: 'rs' },
    { name: 'Seychelles', code: '+248', iso: 'sc' },
    { name: 'Sierra Leone', code: '+232', iso: 'sl' },
    { name: 'Singapore', code: '+65', iso: 'sg' },
    { name: 'Slovakia', code: '+421', iso: 'sk' },
    { name: 'Slovenia', code: '+386', iso: 'si' },
    { name: 'Solomon Islands', code: '+677', iso: 'sb' },
    { name: 'Somalia', code: '+252', iso: 'so' },
    { name: 'South Africa', code: '+27', iso: 'za' },
    { name: 'South Korea', code: '+82', iso: 'kr' },
    { name: 'South Sudan', code: '+211', iso: 'ss' },
    { name: 'Spain', code: '+34', iso: 'es' },
    { name: 'Sri Lanka', code: '+94', iso: 'lk' },
    { name: 'Sudan', code: '+249', iso: 'sd' },
    { name: 'Suriname', code: '+597', iso: 'sr' },
    { name: 'Sweden', code: '+46', iso: 'se' },
    { name: 'Switzerland', code: '+41', iso: 'ch' },
    { name: 'Syria', code: '+963', iso: 'sy' },
    { name: 'Taiwan', code: '+886', iso: 'tw' },
    { name: 'Tajikistan', code: '+992', iso: 'tj' },
    { name: 'Tanzania', code: '+255', iso: 'tz' },
    { name: 'Thailand', code: '+66', iso: 'th' },
    { name: 'Timor-Leste', code: '+670', iso: 'tl' },
    { name: 'Togo', code: '+228', iso: 'tg' },
    { name: 'Tonga', code: '+676', iso: 'to' },
    { name: 'Trinidad and Tobago', code: '+1-868', iso: 'tt' },
    { name: 'Tunisia', code: '+216', iso: 'tn' },
    { name: 'Turkey', code: '+90', iso: 'tr' },
    { name: 'Turkmenistan', code: '+993', iso: 'tm' },
    { name: 'Tuvalu', code: '+688', iso: 'tv' },
    { name: 'Uganda', code: '+256', iso: 'ug' },
    { name: 'Ukraine', code: '+380', iso: 'ua' },
    { name: 'United Arab Emirates', code: '+971', iso: 'ae' },
    { name: 'United Kingdom', code: '+44', iso: 'gb' },
    { name: 'United States', code: '+1', iso: 'us' },
    { name: 'Uruguay', code: '+598', iso: 'uy' },
    { name: 'Uzbekistan', code: '+998', iso: 'uz' },
    { name: 'Vanuatu', code: '+678', iso: 'vu' },
    { name: 'Vatican City', code: '+379', iso: 'va' },
    { name: 'Venezuela', code: '+58', iso: 've' },
    { name: 'Vietnam', code: '+84', iso: 'vn' },
    { name: 'Yemen', code: '+967', iso: 'ye' },
    { name: 'Zambia', code: '+260', iso: 'zm' },
    { name: 'Zimbabwe', code: '+263', iso: 'zw' },
  ];
  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isDisabled = !firstName || !lastName || !email || phoneNumber.length < 7 || !password || !confirmPassword;

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
    // Must be between 7 and 15 digits (ITU-T E.164 standard)
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  // Handle phone number input - only allow digits, max 15
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 15) {
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
      newErrors.phoneNumber = 'Phone number must be between 7 and 15 digits';
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
          showSuccess('Account created! Please verify your phone number.');
          showInfo('Check your phone for the SMS verification code.');
          router.push(`/user/auth/verify-otp?applicantId=${encodeURIComponent(String(applicantId))}&email=${encodeURIComponent(email)}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`);
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
          <img src="/logo.png" alt="Connekyt Logo" style={{ width: isMobile ? '36px' : '50px', height: isMobile ? '36px' : '50px', objectFit: 'contain', position: 'relative', top: isMobile ? '-6px' : '-9px', left: isMobile ? '-1px' : '-13px' }} />
          <span className="font-bold" style={{ color: '#083A85', fontSize: isMobile ? '1.25rem' : '1.4rem', marginLeft: isMobile ? '-10px' : '-26px', marginTop: isMobile ? '-1px' : '-2px', letterSpacing: '0.5px' }}>onnekyt</span>
        </Link>

      <div
        className="w-full bg-white shadow-2xl overflow-hidden flex flex-col lg:flex-row"
        style={{
          maxWidth: isMobile ? '100%' : '80rem',
          height: isMobile ? 'calc(100vh - 3.5rem)' : '90vh',
          maxHeight: isMobile ? 'none' : '800px',
          borderRadius: isMobile ? '0' : '1.5rem',
          marginTop: isMobile ? '0' : '0'
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
              {/* Google Button — only rendered when Google OAuth is configured */}
              {GOOGLE_CLIENT_ID ? (
                <GoogleSignupButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  disabled={googleLoading}
                  isConnected={isGooglePreFilled}
                  isMobile={isMobile}
                />
              ) : null}
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
                    backgroundColor: '#ffffff',
                    minHeight: isMobile ? '50px' : 'auto',
                    width: '100%',
                    animation: isGooglePreFilled && !phoneNumber ? 'pulseHighlight 2s ease-in-out 3' : 'none',
                  }}>
                    {/* Country code selector */}
                    <div data-country-selector style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => { setIsCountryOpen(o => !o); setCountrySearch(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          border: '0', borderRight: '2px solid #d1d5db',
                          outline: 'none', backgroundColor: '#ffffff', cursor: 'pointer',
                          padding: isMobile ? '14px 10px' : '12px 10px',
                          fontSize: isMobile ? '16px' : '15px',
                          minHeight: isMobile ? '50px' : 'auto', whiteSpace: 'nowrap',
                        }}
                      >
                        <img
                          src={`https://flagcdn.com/w40/${countryIso}.png`}
                          alt={countryIso}
                          style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }}
                        />
                        {countryCode}
                      </button>
                      {isCountryOpen && (
                        <div
                          data-country-selector
                          style={{
                            position: 'absolute', top: '100%', left: 0, zIndex: 1000,
                            backgroundColor: '#fff', border: '1px solid #d1d5db',
                            borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                            width: '260px', display: 'flex', flexDirection: 'column',
                            overflow: 'hidden', marginTop: '4px',
                          }}
                        >
                          <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search country or code..."
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                border: '1px solid #d1d5db', borderRadius: '6px',
                                padding: '7px 10px', fontSize: '13px', outline: 'none',
                                backgroundColor: '#f9fafb',
                              }}
                            />
                          </div>
                          <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                            {filteredCountries.length === 0 ? (
                              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '16px' }}>No results</p>
                            ) : filteredCountries.map(c => (
                              <button
                                key={c.iso}
                                type="button"
                                onClick={() => {
                                  setCountryCode(c.code);
                                  setCountryIso(c.iso);
                                  setIsCountryOpen(false);
                                  setCountrySearch('');
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  width: '100%', padding: '8px 12px', border: '0',
                                  backgroundColor: c.iso === countryIso ? '#f0f4ff' : '#fff',
                                  cursor: 'pointer', fontSize: '13px', textAlign: 'left',
                                  borderBottom: '1px solid #f3f4f6',
                                }}
                              >
                                <img
                                  src={`https://flagcdn.com/w40/${c.iso}.png`}
                                  alt={c.iso}
                                  style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
                                />
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>{c.name}</span>
                                <span style={{ color: '#6b7280', flexShrink: 0 }}>{c.code}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="786875878"
                      maxLength={15}
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
