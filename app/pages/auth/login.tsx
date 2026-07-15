'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGoogleLogin } from '@react-oauth/google';
import { login } from '@/lib/APIs/auth/login/route';
import { signup } from '@/lib/APIs/auth/signup/route';
import { validatePassword as validatePasswordRemote } from '@/lib/APIs/auth/validate-password/route';
import { checkEmail as checkEmailRemote } from '@/lib/APIs/auth/check-email/route';
import { persistPhotographerProfile } from '@/lib/photographer/persist-profile';
import { googleAuth } from '@/lib/APIs/auth/google/route';
import { setAuthToken, getAuthToken, getRefreshToken } from '@/lib/api/client';
import { useToast } from '@/lib/notifications/ToastProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import PostLoginModal from '@/app/components/PostLoginModal';
import UserTypeModal from '@/app/components/UserTypeModal';
import dynamic from 'next/dynamic';

const PhotographerOnboarding = dynamic(() => import('@/app/components/PhotographerOnboarding'), { ssr: false });
import { getDashboardUrlWithToken } from '@/lib/utils/dashboard-url';

// ─── Google Login Button ────────────────────────────────────────────
function GoogleLoginButton({ onSuccess, onError, disabled }: {
  onSuccess: (t: { access_token: string }) => void;
  onError: () => void;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const gl = useGoogleLogin({
    onSuccess: (t) => { setLoading(true); onSuccess(t); },
    onError: () => { setLoading(false); onError(); },
  });
  return (
    <button type="button" onClick={() => gl()} disabled={disabled || loading}
      style={{ flex: '1', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '10px', border: '1.5px solid #6a6a6b', backgroundColor: '#f8fafc', cursor: (disabled || loading) ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: loading ? 0.7 : 1 }}
      onMouseEnter={(e) => { if (!disabled && !loading) { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={(e) => { if (!disabled && !loading) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; } }}
    >
      {loading ? (
        <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="3" fill="none" /><path d="M12 2a10 10 0 0 1 10 10" stroke="#083A85" strokeWidth="3" fill="none" strokeLinecap="round" /></svg><span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Signing in...</span></>
      ) : (
        <><img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} /><span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Login with Google</span></>
      )}
    </button>
  );
}

// ─── Google Signup Button ───────────────────────────────────────────
function GoogleSignupButton({ onSuccess, onError, disabled, isConnected }: {
  onSuccess: (t: { access_token: string }) => void;
  onError: (e: unknown) => void;
  disabled: boolean;
  isConnected: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const gl = useGoogleLogin({
    onSuccess: (t) => { setLoading(true); onSuccess(t); setLoading(false); },
    onError: (e) => { setLoading(false); onError(e); },
  });
  return (
    <button type="button" onClick={() => gl()} disabled={disabled || isConnected}
      style={{ flex: '1', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '10px', border: isConnected ? '1.5px solid #10b981' : '1.5px solid #6a6a6b', backgroundColor: isConnected ? '#ecfdf5' : '#f8fafc', cursor: (disabled || isConnected) ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: loading ? 0.7 : 1 }}
      onMouseEnter={(e) => { if (!disabled && !isConnected) { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={(e) => { if (!disabled && !isConnected) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; } }}
    >
      {loading ? (
        <><div style={{ width: '20px', height: '20px', border: '2px solid #d1d5db', borderTopColor: '#083A85', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Connecting...</span></>
      ) : isConnected ? (
        <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg><span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>Google Connected</span></>
      ) : (
        <><img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} /><span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Sign up with Google</span></>
      )}
    </button>
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// ─── Countries list ─────────────────────────────────────────────────
const countries = [
  { name: 'Rwanda', code: '+250', iso: 'rw' },{ name: 'Afghanistan', code: '+93', iso: 'af' },{ name: 'Albania', code: '+355', iso: 'al' },{ name: 'Algeria', code: '+213', iso: 'dz' },{ name: 'Andorra', code: '+376', iso: 'ad' },{ name: 'Angola', code: '+244', iso: 'ao' },{ name: 'Antigua and Barbuda', code: '+1-268', iso: 'ag' },{ name: 'Argentina', code: '+54', iso: 'ar' },{ name: 'Armenia', code: '+374', iso: 'am' },{ name: 'Australia', code: '+61', iso: 'au' },{ name: 'Austria', code: '+43', iso: 'at' },{ name: 'Azerbaijan', code: '+994', iso: 'az' },{ name: 'Bahamas', code: '+1-242', iso: 'bs' },{ name: 'Bahrain', code: '+973', iso: 'bh' },{ name: 'Bangladesh', code: '+880', iso: 'bd' },{ name: 'Barbados', code: '+1-246', iso: 'bb' },{ name: 'Belarus', code: '+375', iso: 'by' },{ name: 'Belgium', code: '+32', iso: 'be' },{ name: 'Belize', code: '+501', iso: 'bz' },{ name: 'Benin', code: '+229', iso: 'bj' },{ name: 'Bhutan', code: '+975', iso: 'bt' },{ name: 'Bolivia', code: '+591', iso: 'bo' },{ name: 'Bosnia and Herzegovina', code: '+387', iso: 'ba' },{ name: 'Botswana', code: '+267', iso: 'bw' },{ name: 'Brazil', code: '+55', iso: 'br' },{ name: 'Brunei', code: '+673', iso: 'bn' },{ name: 'Bulgaria', code: '+359', iso: 'bg' },{ name: 'Burkina Faso', code: '+226', iso: 'bf' },{ name: 'Burundi', code: '+257', iso: 'bi' },{ name: 'Cambodia', code: '+855', iso: 'kh' },{ name: 'Cameroon', code: '+237', iso: 'cm' },{ name: 'Canada', code: '+1', iso: 'ca' },{ name: 'Cape Verde', code: '+238', iso: 'cv' },{ name: 'Central African Republic', code: '+236', iso: 'cf' },{ name: 'Chad', code: '+235', iso: 'td' },{ name: 'Chile', code: '+56', iso: 'cl' },{ name: 'China', code: '+86', iso: 'cn' },{ name: 'Colombia', code: '+57', iso: 'co' },{ name: 'Comoros', code: '+269', iso: 'km' },{ name: 'Congo DRC', code: '+243', iso: 'cd' },{ name: 'Congo Republic', code: '+242', iso: 'cg' },{ name: 'Costa Rica', code: '+506', iso: 'cr' },{ name: "Cote d'Ivoire", code: '+225', iso: 'ci' },{ name: 'Croatia', code: '+385', iso: 'hr' },{ name: 'Cuba', code: '+53', iso: 'cu' },{ name: 'Cyprus', code: '+357', iso: 'cy' },{ name: 'Czech Republic', code: '+420', iso: 'cz' },{ name: 'Denmark', code: '+45', iso: 'dk' },{ name: 'Djibouti', code: '+253', iso: 'dj' },{ name: 'Dominica', code: '+1-767', iso: 'dm' },{ name: 'Dominican Republic', code: '+1-809', iso: 'do' },{ name: 'Ecuador', code: '+593', iso: 'ec' },{ name: 'Egypt', code: '+20', iso: 'eg' },{ name: 'El Salvador', code: '+503', iso: 'sv' },{ name: 'Equatorial Guinea', code: '+240', iso: 'gq' },{ name: 'Eritrea', code: '+291', iso: 'er' },{ name: 'Estonia', code: '+372', iso: 'ee' },{ name: 'Eswatini', code: '+268', iso: 'sz' },{ name: 'Ethiopia', code: '+251', iso: 'et' },{ name: 'Fiji', code: '+679', iso: 'fj' },{ name: 'Finland', code: '+358', iso: 'fi' },{ name: 'France', code: '+33', iso: 'fr' },{ name: 'Gabon', code: '+241', iso: 'ga' },{ name: 'Gambia', code: '+220', iso: 'gm' },{ name: 'Georgia', code: '+995', iso: 'ge' },{ name: 'Germany', code: '+49', iso: 'de' },{ name: 'Ghana', code: '+233', iso: 'gh' },{ name: 'Greece', code: '+30', iso: 'gr' },{ name: 'Grenada', code: '+1-473', iso: 'gd' },{ name: 'Guatemala', code: '+502', iso: 'gt' },{ name: 'Guinea', code: '+224', iso: 'gn' },{ name: 'Guinea-Bissau', code: '+245', iso: 'gw' },{ name: 'Guyana', code: '+592', iso: 'gy' },{ name: 'Haiti', code: '+509', iso: 'ht' },{ name: 'Honduras', code: '+504', iso: 'hn' },{ name: 'Hungary', code: '+36', iso: 'hu' },{ name: 'Iceland', code: '+354', iso: 'is' },{ name: 'India', code: '+91', iso: 'in' },{ name: 'Indonesia', code: '+62', iso: 'id' },{ name: 'Iran', code: '+98', iso: 'ir' },{ name: 'Iraq', code: '+964', iso: 'iq' },{ name: 'Ireland', code: '+353', iso: 'ie' },{ name: 'Israel', code: '+972', iso: 'il' },{ name: 'Italy', code: '+39', iso: 'it' },{ name: 'Jamaica', code: '+1-876', iso: 'jm' },{ name: 'Japan', code: '+81', iso: 'jp' },{ name: 'Jordan', code: '+962', iso: 'jo' },{ name: 'Kazakhstan', code: '+7', iso: 'kz' },{ name: 'Kenya', code: '+254', iso: 'ke' },{ name: 'Kiribati', code: '+686', iso: 'ki' },{ name: 'Kuwait', code: '+965', iso: 'kw' },{ name: 'Kyrgyzstan', code: '+996', iso: 'kg' },{ name: 'Laos', code: '+856', iso: 'la' },{ name: 'Latvia', code: '+371', iso: 'lv' },{ name: 'Lebanon', code: '+961', iso: 'lb' },{ name: 'Lesotho', code: '+266', iso: 'ls' },{ name: 'Liberia', code: '+231', iso: 'lr' },{ name: 'Libya', code: '+218', iso: 'ly' },{ name: 'Liechtenstein', code: '+423', iso: 'li' },{ name: 'Lithuania', code: '+370', iso: 'lt' },{ name: 'Luxembourg', code: '+352', iso: 'lu' },{ name: 'Madagascar', code: '+261', iso: 'mg' },{ name: 'Malawi', code: '+265', iso: 'mw' },{ name: 'Malaysia', code: '+60', iso: 'my' },{ name: 'Maldives', code: '+960', iso: 'mv' },{ name: 'Mali', code: '+223', iso: 'ml' },{ name: 'Malta', code: '+356', iso: 'mt' },{ name: 'Marshall Islands', code: '+692', iso: 'mh' },{ name: 'Mauritania', code: '+222', iso: 'mr' },{ name: 'Mauritius', code: '+230', iso: 'mu' },{ name: 'Mexico', code: '+52', iso: 'mx' },{ name: 'Micronesia', code: '+691', iso: 'fm' },{ name: 'Moldova', code: '+373', iso: 'md' },{ name: 'Monaco', code: '+377', iso: 'mc' },{ name: 'Mongolia', code: '+976', iso: 'mn' },{ name: 'Montenegro', code: '+382', iso: 'me' },{ name: 'Morocco', code: '+212', iso: 'ma' },{ name: 'Mozambique', code: '+258', iso: 'mz' },{ name: 'Myanmar', code: '+95', iso: 'mm' },{ name: 'Namibia', code: '+264', iso: 'na' },{ name: 'Nauru', code: '+674', iso: 'nr' },{ name: 'Nepal', code: '+977', iso: 'np' },{ name: 'Netherlands', code: '+31', iso: 'nl' },{ name: 'New Zealand', code: '+64', iso: 'nz' },{ name: 'Nicaragua', code: '+505', iso: 'ni' },{ name: 'Niger', code: '+227', iso: 'ne' },{ name: 'Nigeria', code: '+234', iso: 'ng' },{ name: 'North Korea', code: '+850', iso: 'kp' },{ name: 'North Macedonia', code: '+389', iso: 'mk' },{ name: 'Norway', code: '+47', iso: 'no' },{ name: 'Oman', code: '+968', iso: 'om' },{ name: 'Pakistan', code: '+92', iso: 'pk' },{ name: 'Palau', code: '+680', iso: 'pw' },{ name: 'Palestine', code: '+970', iso: 'ps' },{ name: 'Panama', code: '+507', iso: 'pa' },{ name: 'Papua New Guinea', code: '+675', iso: 'pg' },{ name: 'Paraguay', code: '+595', iso: 'py' },{ name: 'Peru', code: '+51', iso: 'pe' },{ name: 'Philippines', code: '+63', iso: 'ph' },{ name: 'Poland', code: '+48', iso: 'pl' },{ name: 'Portugal', code: '+351', iso: 'pt' },{ name: 'Qatar', code: '+974', iso: 'qa' },{ name: 'Romania', code: '+40', iso: 'ro' },{ name: 'Russia', code: '+7', iso: 'ru' },{ name: 'Saint Kitts and Nevis', code: '+1-869', iso: 'kn' },{ name: 'Saint Lucia', code: '+1-758', iso: 'lc' },{ name: 'Saint Vincent', code: '+1-784', iso: 'vc' },{ name: 'Samoa', code: '+685', iso: 'ws' },{ name: 'San Marino', code: '+378', iso: 'sm' },{ name: 'Sao Tome and Principe', code: '+239', iso: 'st' },{ name: 'Saudi Arabia', code: '+966', iso: 'sa' },{ name: 'Senegal', code: '+221', iso: 'sn' },{ name: 'Serbia', code: '+381', iso: 'rs' },{ name: 'Seychelles', code: '+248', iso: 'sc' },{ name: 'Sierra Leone', code: '+232', iso: 'sl' },{ name: 'Singapore', code: '+65', iso: 'sg' },{ name: 'Slovakia', code: '+421', iso: 'sk' },{ name: 'Slovenia', code: '+386', iso: 'si' },{ name: 'Solomon Islands', code: '+677', iso: 'sb' },{ name: 'Somalia', code: '+252', iso: 'so' },{ name: 'South Africa', code: '+27', iso: 'za' },{ name: 'South Korea', code: '+82', iso: 'kr' },{ name: 'South Sudan', code: '+211', iso: 'ss' },{ name: 'Spain', code: '+34', iso: 'es' },{ name: 'Sri Lanka', code: '+94', iso: 'lk' },{ name: 'Sudan', code: '+249', iso: 'sd' },{ name: 'Suriname', code: '+597', iso: 'sr' },{ name: 'Sweden', code: '+46', iso: 'se' },{ name: 'Switzerland', code: '+41', iso: 'ch' },{ name: 'Syria', code: '+963', iso: 'sy' },{ name: 'Taiwan', code: '+886', iso: 'tw' },{ name: 'Tajikistan', code: '+992', iso: 'tj' },{ name: 'Tanzania', code: '+255', iso: 'tz' },{ name: 'Thailand', code: '+66', iso: 'th' },{ name: 'Timor-Leste', code: '+670', iso: 'tl' },{ name: 'Togo', code: '+228', iso: 'tg' },{ name: 'Tonga', code: '+676', iso: 'to' },{ name: 'Trinidad and Tobago', code: '+1-868', iso: 'tt' },{ name: 'Tunisia', code: '+216', iso: 'tn' },{ name: 'Turkey', code: '+90', iso: 'tr' },{ name: 'Turkmenistan', code: '+993', iso: 'tm' },{ name: 'Tuvalu', code: '+688', iso: 'tv' },{ name: 'Uganda', code: '+256', iso: 'ug' },{ name: 'Ukraine', code: '+380', iso: 'ua' },{ name: 'United Arab Emirates', code: '+971', iso: 'ae' },{ name: 'United Kingdom', code: '+44', iso: 'gb' },{ name: 'United States', code: '+1', iso: 'us' },{ name: 'Uruguay', code: '+598', iso: 'uy' },{ name: 'Uzbekistan', code: '+998', iso: 'uz' },{ name: 'Vanuatu', code: '+678', iso: 'vu' },{ name: 'Vatican City', code: '+379', iso: 'va' },{ name: 'Venezuela', code: '+58', iso: 've' },{ name: 'Vietnam', code: '+84', iso: 'vn' },{ name: 'Yemen', code: '+967', iso: 'ye' },{ name: 'Zambia', code: '+260', iso: 'zm' },{ name: 'Zimbabwe', code: '+263', iso: 'zw' },
];

// ─── Overlay Panel (dark side with icons) ───────────────────────────
function OverlayPanel({ isLogin, onToggle, userType }: { isLogin: boolean; onToggle: () => void; userType?: string | null }) {
  const iconBox: React.CSSProperties = { width: '70px', height: '70px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(255,107,107,0.15) 100%)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  // Role-specific content for signup view
  const roleContent: Record<string, { heading: string; subtitle: string; topIcon: React.ReactNode; leftIcon: React.ReactNode; rightIcon: React.ReactNode }> = {
    User: {
      heading: 'Welcome to Connekyt!',
      subtitle: 'Create your account to watch live streams, buy photos, and book photographers',
      topIcon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.9 4.6L19 9l-4 3.3L16.2 18 12 15.3 7.8 18 9 12.3 5 9l5.1-1.4L12 3z" fill="#fff"/></svg>,
      leftIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5z" fill="#fff"/></svg>,
      rightIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fff"/></svg>,
    },
    Photographer: {
      heading: 'Welcome back, creative!',
      subtitle: 'Sign in to manage your portfolio, accept bookings, and showcase your work',
      topIcon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18Z" fill="#fff"/><circle cx="12" cy="13" r="3" fill="#fff"/></svg>,
      leftIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#fff"/></svg>,
      rightIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fff"/></svg>,
    },
    Client: {
      heading: 'Welcome back!',
      subtitle: 'Sign in to find photographers, manage your events, and track your bookings',
      topIcon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#fff"/></svg>,
      leftIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="#fff"/></svg>,
      rightIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fff"/></svg>,
    },
    Coordinator: {
      heading: 'Welcome back, organizer!',
      subtitle: 'Sign in to coordinate events, manage teams, and oversee productions',
      topIcon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="#fff" strokeWidth="2" fill="none"/><path d="M8 21h8M12 17v4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="10" r="2" fill="#fff"/></svg>,
      leftIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#fff"/></svg>,
      rightIcon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="#fff"/></svg>,
    },
  };

  const role = roleContent[userType || ''] || roleContent.Client;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', zIndex: 1 }}>

      {isLogin ? (
        /* ── LOGIN VIEW: invite to Sign Up ── */
        <>
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ position: 'absolute', top: 0, left: '-20px', width: '18px', height: '18px', marginTop: '1.2rem', borderTop: '2px solid rgba(139,92,246,0.35)', borderLeft: '2px solid rgba(139,92,246,0.35)', borderRadius: '6px 0 0 0' }} />
              <div style={{ position: 'absolute', top: 0, right: '-20px', width: '18px', height: '18px', marginTop: '1.2rem', borderTop: '2px solid rgba(139,92,246,0.35)', borderRight: '2px solid rgba(139,92,246,0.35)', borderRadius: '0 6px 0 0' }} />
              <div style={{ ...iconBox, borderRadius: '50%', marginTop: '1.2rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#fff"/></svg>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: '-20px', width: '18px', height: '18px', borderBottom: '2px solid rgba(139,92,246,0.35)', borderLeft: '2px solid rgba(139,92,246,0.35)', borderRadius: '0 0 0 6px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: '-20px', width: '18px', height: '18px', borderBottom: '2px solid rgba(139,92,246,0.35)', borderRight: '2px solid rgba(139,92,246,0.35)', borderRadius: '0 0 6px 0' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '4px' }}>
              <div style={{ ...iconBox, marginTop: '0.5rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18Z" fill="#fff"/><circle cx="12" cy="13" r="3" fill="#fff"/></svg>
              </div>
              <svg width="40" height="14" viewBox="0 0 48 16" fill="none"><path d="M0 8H40M40 8L34 2M40 8L34 14" stroke="rgba(139,92,246,0.5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={{ ...iconBox, marginTop: '0.5rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="#fff"/></svg>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', maxWidth: '260px', lineHeight: 1.3, textAlign: 'center', marginBottom: '6px' }}>
            Start your journey with us
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', textAlign: 'center', maxWidth: '240px', margin: '0 0 24px 0', lineHeight: 1.4 }}>
            Create an account to book photographers, manage events, and grow your portfolio
          </p>
        </>
      ) : (
        /* ── SIGNUP VIEW: role-specific content ── */
        <>
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ position: 'absolute', top: 0, left: '-20px', width: '18px', height: '18px', marginTop: '1.2rem', borderTop: '2px solid rgba(139,92,246,0.35)', borderLeft: '2px solid rgba(139,92,246,0.35)', borderRadius: '6px 0 0 0' }} />
              <div style={{ position: 'absolute', top: 0, right: '-20px', width: '18px', height: '18px', marginTop: '1.2rem', borderTop: '2px solid rgba(139,92,246,0.35)', borderRight: '2px solid rgba(139,92,246,0.35)', borderRadius: '0 6px 0 0' }} />
              <div style={{ ...iconBox, borderRadius: '50%', marginTop: '1.2rem' }}>
                {role.topIcon}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: '-20px', width: '18px', height: '18px', borderBottom: '2px solid rgba(139,92,246,0.35)', borderLeft: '2px solid rgba(139,92,246,0.35)', borderRadius: '0 0 0 6px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: '-20px', width: '18px', height: '18px', borderBottom: '2px solid rgba(139,92,246,0.35)', borderRight: '2px solid rgba(139,92,246,0.35)', borderRadius: '0 0 6px 0' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '4px' }}>
              <div style={{ ...iconBox, marginTop: '0.5rem' }}>
                {role.leftIcon}
              </div>
              <svg width="40" height="14" viewBox="0 0 48 16" fill="none"><path d="M0 8H40M40 8L34 2M40 8L34 14" stroke="rgba(139,92,246,0.5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={{ ...iconBox, marginTop: '0.5rem' }}>
                {role.rightIcon}
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', maxWidth: '260px', lineHeight: 1.3, textAlign: 'center', marginBottom: '6px' }}>
            {role.heading}
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', textAlign: 'center', maxWidth: '240px', margin: '0 0 24px 0', lineHeight: 1.4 }}>
            {role.subtitle}
          </p>
        </>
      )}

      {/* Toggle CTA */}
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
      </p>
      <button onClick={onToggle} style={{
        padding: '10px 36px', borderRadius: '10px', border: '2px solid rgba(255,255,255,0.6)',
        backgroundColor: 'transparent', color: '#fff', fontSize: '15px', fontWeight: '600',
        cursor: 'pointer', transition: 'all 0.3s', letterSpacing: '0.5px'
      }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
      >
        {isLogin ? 'Sign Up' : 'Sign In'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── Combined Auth Page with Sliding Animation ───────────────────
// ═══════════════════════════════════════════════════════════════════
export function AuthPage({ initialView = 'login' }: { initialView?: 'login' | 'signup' }): React.JSX.Element {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.loginPage');
  const tSignup = useTranslations('auth.signupPage');
  const tAuth = useTranslations('auth');
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo, isOnline } = useToast();
  const { login: loginUser, logout: logoutUser } = useAuth();

  // ── User type (needed before toggle handler) ──
  const rawUserType = searchParams.get('userType');
  const allowedSignupTypes = ['Photographer', 'Client', 'Coordinator', 'User'];
  const urlUserType = rawUserType && allowedSignupTypes.includes(rawUserType) ? rawUserType : null;
  const [selectedUserType, setSelectedUserType] = useState<string | null>(urlUserType);
  const [showUserTypeModal, setShowUserTypeModal] = useState(!urlUserType && initialView === 'signup');
  const signupUserType = selectedUserType || 'Client';

  // ── Screen size ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1025);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Toggle handler ──
  const toggleView = () => {
    const next = !isLogin;
    setIsLogin(next);
    if (next) {
      setSelectedUserType(null);
    }
    // Update URL outside of setState to avoid Router update during render
    setTimeout(() => {
      window.history.replaceState(null, '', next ? '/user/auth/login' : '/user/auth/signup');
    }, 0);
  };

  // Show user type modal whenever we switch to signup without a type selected
  useEffect(() => {
    if (!isLogin && !selectedUserType && !urlUserType) {
      setShowUserTypeModal(true);
    }
  }, [isLogin, selectedUserType, urlUserType]);

  // ═══════════════════════════════════════════════════════════════
  // ── LOGIN STATE & HANDLERS ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  const redirectUrl = searchParams.get('redirect');
  // When the mobile app launches signup in the browser it passes a custom-scheme
  // deep link (connekt://auth-callback / exp://…) as `redirect`. Google sign-up
  // mints a session immediately (no OTP), so bounce straight back into the app
  // with the token instead of a web `router.push` (which can't do custom schemes).
  const appRedirect =
    redirectUrl && !/^https?:\/\//i.test(redirectUrl) && !redirectUrl.startsWith('/')
      ? redirectUrl
      : '';
  const returnToAppWithSession = (token: string, data?: {
    refreshToken?: string | null; customerId?: string | null; email?: string | null;
    firstName?: string | null; lastName?: string | null; phone?: string | null;
    customerType?: string | null;
  }) => {
    const sep = appRedirect.includes('?') ? '&' : '?';
    const p = new URLSearchParams();
    p.set('status', 'success');
    if (token) p.set('token', token);
    if (data?.refreshToken) p.set('refreshToken', String(data.refreshToken));
    if (data?.customerId) p.set('customerId', String(data.customerId));
    if (data?.email) p.set('email', String(data.email));
    if (data?.firstName) p.set('firstName', String(data.firstName));
    if (data?.lastName) p.set('lastName', String(data.lastName));
    if (data?.phone) p.set('phone', String(data.phone));
    const ct = data?.customerType || signupUserType;
    if (ct) p.set('customerType', String(ct));
    window.location.href = `${appRedirect}${sep}${p.toString()}`;
  };
  const loggedOut = searchParams.get('loggedOut') === 'true' || searchParams.get('logged_out') === 'true';
  const sessionExpired = searchParams.get('session_expired') === 'true';
  const [showLoggedOutBanner, setShowLoggedOutBanner] = useState(false);
  const [showSessionExpiredBanner, setShowSessionExpiredBanner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPostLoginModal, setShowPostLoginModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [loggedInUserType, setLoggedInUserType] = useState<string | undefined>(undefined);
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);

  useEffect(() => { if (redirectUrl) localStorage.setItem('authRedirectUrl', redirectUrl); }, [redirectUrl]);
  useEffect(() => { if (loggedOut) { logoutUser(); setShowLoggedOutBanner(true); const t = setTimeout(() => setShowLoggedOutBanner(false), 5000); return () => clearTimeout(t); } }, [loggedOut, logoutUser]);
  useEffect(() => { if (sessionExpired) { logoutUser(); setShowSessionExpiredBanner(true); const t = setTimeout(() => setShowSessionExpiredBanner(false), 5000); return () => clearTimeout(t); } }, [sessionExpired, logoutUser]);

  const loginIsDisabled = !loginEmail || !loginPassword;

  // Only accept a `redirect` param that is either
  //   (a) an internal path starting with '/' (no '//' or '/\')
  //   (b) an absolute URL whose host is on an allow-list (dashboard.connekyt.com, connekyt.com)
  // Anything else → fall back to the default internal page. This closes the
  // open-redirect + token-leak vuln where ?redirect=https://evil.example would
  // exfil the JWT as a query param.
  const DASHBOARD_URL_ENV = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com';
  const REDIRECT_HOST_ALLOWLIST = new Set<string>(
    [
      'connekyt.com',
      'www.connekyt.com',
      'dashboard.connekyt.com',
      (() => { try { return new URL(DASHBOARD_URL_ENV).host; } catch { return ''; } })(),
      'localhost:3000',
      'localhost:3001',
    ].filter(Boolean)
  );
  const isSafeRedirect = (raw: string | null): string | null => {
    if (!raw) return null;
    // Internal path
    if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) return raw;
    // Absolute URL - host must be allow-listed
    try {
      const u = new URL(raw, window.location.origin);
      if (u.origin === window.location.origin) return u.pathname + u.search + u.hash;
      if (REDIRECT_HOST_ALLOWLIST.has(u.host)) return u.toString();
    } catch {
      // fall through
    }
    return null;
  };
  const returnTo = isSafeRedirect(redirectUrl) || '/user/photographers';

  // Helper: redirect to dashboard with booking params (for book-now flows).
  // No token in the URL - the amoria_auth HttpOnly cookie scoped to
  // .connekyt.com carries auth across subdomains automatically.
  const redirectToBookingDashboard = (customerType?: string) => {
    const returnToUrl = new URL(returnTo, window.location.origin);
    const photographerId = returnToUrl.searchParams.get('id');
    const packageId = returnToUrl.searchParams.get('packageId');
    const rawType = (customerType || loggedInUserType || 'client').toLowerCase();
    const userType = rawType === 'coordinator' ? 'event-coordinator' : rawType;
    const dashUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com';
    const dest = new URL(`${dashUrl}/user/${userType}/events`);
    if (photographerId) dest.searchParams.set('photographerId', photographerId);
    if (packageId) dest.searchParams.set('packageId', packageId);
    window.location.href = dest.toString();
  };

  const isBookingRedirect = returnTo.includes('book-now');

  const handleKeepExploring = () => {
    setShowPostLoginModal(false);
    if (returnTo.startsWith('http')) { window.location.href = returnTo; }
    else { router.push(returnTo); }
  };

  const handleGoToDashboard = () => {
    setShowPostLoginModal(false);
    if (returnTo.startsWith('http')) { window.location.href = returnTo; }
    else {
      const returnToUrl = new URL(returnTo, window.location.origin);
      const photographerId = returnToUrl.searchParams.get('id');
      const packageId = returnToUrl.searchParams.get('packageId');
      if (returnToUrl.pathname.includes('book-now') && photographerId) {
        redirectToBookingDashboard();
      } else {
        const token = getAuthToken();
        const refreshTokenValue = getRefreshToken();
        const dashboardUrl = getDashboardUrlWithToken(loggedInUserType, token || undefined, refreshTokenValue || undefined);
        if (dashboardUrl && token) window.open(dashboardUrl, '_blank');
        else window.open('/user/photographers', '_blank');
        router.push(returnTo);
      }
    }
  };

  const handleGoogleLoginSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoginLoading(true); setLoginError('');
    try {
      const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } });
      if (!googleResponse.ok) throw new Error('Failed to fetch Google user info');
      const userInfo = await googleResponse.json();
      const response = await googleAuth({ email: userInfo.email, firstName: userInfo.given_name || '', lastName: userInfo.family_name || '', customerType: 'Client' });
      const data = response.data;
      if (response.success && data?.twoFactorRequired && data?.customerId) { showInfo('Please enter your authenticator code.'); router.push(`/user/auth/verify-totp?customerId=${encodeURIComponent(String(data.customerId))}`); return; }
      if (response.success && data?.token) {
        const customerType = data.customerType || '';
        if (customerType === 'Viewer') { setLoginError('Viewer accounts can only sign in from event pages.'); showError('Viewer accounts can only sign in from event pages.'); return; }
        const userData = { id: data.id || data.customerId || '', firstName: data.firstName || userInfo.given_name, lastName: data.lastName || userInfo.family_name, email: data.email || userInfo.email, phone: data.phone || '', customerId: data.customerId || '', customerType };
        loginUser(userData, data.token);
        setLoggedInUserName(userData.firstName || 'User'); setLoggedInUserType(customerType); showSuccess('Welcome back!');
        // Auto-redirect for booking flows - skip the PostLoginModal
        if (isBookingRedirect) { setTimeout(() => redirectToBookingDashboard(customerType), 300); }
        else { setShowPostLoginModal(true); }
      } else { const msg = response.error || data?.message || 'Google login failed.'; setLoginError(msg); showError(msg); }
    } catch (err) { const msg = err instanceof Error ? err.message : 'An error occurred during Google login.'; setLoginError(msg); showError(msg); }
    finally { setGoogleLoginLoading(false); }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError('');
    if (!isOnline) { showWarning('You are offline.'); return; }
    if (!loginIsDisabled) {
      setLoginLoading(true);
      try {
        const response = await login({ email: loginEmail.trim().toLowerCase(), password: loginPassword });
        const data = response.data;
        // Security gates first - a locked / 2FA account is never bypassed.
        if (data?.accountLocked === true || data?.accountLocked === 'true') { setLoginError('Your account has been locked.'); showError('Your account has been locked.'); setLoginLoading(false); return; }
        if (data?.twoFactorRequired && data?.customerId) { showInfo('Please enter your authenticator code.'); setLoginLoading(false); router.push(`/user/auth/verify-totp?customerId=${encodeURIComponent(String(data.customerId))}`); return; }

        // Unverified accounts go to OTP FIRST. The profile-completion modal
        // is shown right AFTER verification (on the verify-otp page), not
        // before - per product: "right after verification should come back
        // and show the modal".
        if (data?.otpVerified === false && data?.customerId) { showWarning(data?.message || 'Please verify your phone number.'); setLoginLoading(false); router.push(`/user/auth/verify-otp?applicantId=${encodeURIComponent(String(data.customerId))}&email=${encodeURIComponent(loginEmail)}`); return; }

        // FORCED FIRST-LOGIN PASSWORD CHANGE.
        // TeamService.inviteTeamMember persists invited members with
        // isPasswordChanged=false; the backend login response sets
        // mustChangePassword=true for those. We route them to the
        // change-password page on knockout itself, BEFORE the
        // photographer-completion wizard or the dashboard hand-off,
        // so they never see a flash of UI they can't fully use until
        // they've picked their own password.
        if (data?.mustChangePassword === true) {
          // Persist the token so the change-password form can attach
          // it as a Bearer header when calling /set-new-password.
          if (data?.token) setAuthToken(data.token);
          setLoginLoading(false);
          const params = new URLSearchParams();
          params.set('email', loginEmail);
          if (data?.customerType) params.set('customerType', String(data.customerType));
          router.push(`/user/auth/change-password?${params.toString()}`);
          return;
        }

        // PROFILE-COMPLETION GATE (verified users) - runs BEFORE the
        // dashboard/keep-exploring modal. A photographer with an incomplete
        // profile (everything except KYC) must finish it here, in the same
        // wizard, and can never slip into the dashboard with gaps.
        // EXCEPTION: a team member invited by a photographer inherits the
        // owner's customerType so dashboard role-routing keeps working,
        // but they don't OWN the profile. the owner does. Bouncing them
        // into the wizard would trap them in a form they can't legitimately
        // fill out. data.isTeamMember (added on the backend login response,
        // computed from Customer.organization_owner_id) lets us skip the
        // gate for those users.
        {
          const ct = (data?.customerType || data?.user?.userType || '');
          const isPhotographer = String(ct).toLowerCase() === 'photographer';
          const isTeamMember = data?.isTeamMember === true;
          const pct = typeof data?.profileCompletionPercentage === 'number'
            ? data.profileCompletionPercentage : 100;
          if (isPhotographer && !isTeamMember && pct < 100 && data?.token) {
            setAuthToken(data.token); // authenticates the wizard's saves
            setCompletionCtx({
              firstName: data.firstName || data.user?.firstName || '',
              lastName: data.lastName || data.user?.lastName || '',
              phone: data.phone || '',
              customerId: String(data.customerId || ''),
              customerType: String(ct),
              email: data.email || loginEmail,
              otpVerified: true, // this branch only runs for verified users
              missingItems: Array.isArray(data.missingItems) ? data.missingItems : [],
            });
            setLoginLoading(false);
            setShowCompletionWizard(true);
            return;
          }
        }

        if (response.success && data) {
          const customerType = data.user?.userType || data.customerType || '';
          if (customerType === 'Viewer') { setLoginError('Viewer accounts can only sign in from event pages.'); showError('Viewer accounts can only sign in from event pages.'); setLoginLoading(false); return; }
          const userData = { id: data.id || data.user?.id || '', firstName: data.firstName || data.user?.firstName || '', lastName: data.lastName || data.user?.lastName || '', email: data.email || data.user?.email || loginEmail, phone: data.phone || '', customerId: data.customerId || '', customerType };
          loginUser(userData, data.token || '');
          setLoggedInUserName(userData.firstName || 'User'); setLoggedInUserType(customerType); showSuccess('Welcome back!');
          // Auto-redirect for booking flows - skip the PostLoginModal
          if (isBookingRedirect) { setTimeout(() => redirectToBookingDashboard(customerType), 300); }
          else { setShowPostLoginModal(true); }
        } else { const msg = response.error || data?.message || 'Login failed.'; setLoginError(msg); showError(msg); }
      } catch (err) { const msg = err instanceof Error ? err.message : 'An error occurred.'; setLoginError(msg); showError(msg); }
      finally { setLoginLoading(false); }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ── SIGNUP STATE & HANDLERS ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+250');
  const [countryIso, setCountryIso] = useState('rw');
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleSignupLoading, setGoogleSignupLoading] = useState(false);
  const [isGooglePreFilled, setIsGooglePreFilled] = useState(false);
  const [signupErrors, setSignupErrors] = useState<{ [key: string]: string }>({});
  // Photographer onboarding state - shown after signup, before OTP
  const [showPhotographerOnboarding, setShowPhotographerOnboarding] = useState(false);
  const [pendingOtpRedirectUrl, setPendingOtpRedirectUrl] = useState('');

  // Post-login profile-completion gate. When a photographer logs in with an
  // incomplete profile (anything except KYC), we open the SAME onboarding
  // wizard as a blocking modal - they cannot reach the dashboard (or even
  // OTP) until it's 100%. completionCtx carries identity + how to resume.
  const [showCompletionWizard, setShowCompletionWizard] = useState(false);
  const [completionCtx, setCompletionCtx] = useState<{
    firstName: string; lastName: string; phone: string;
    customerId: string; customerType: string; email: string;
    otpVerified: boolean; missingItems: string[];
  } | null>(null);

  const filteredCountries = countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch));
  // Strength model. The four "required" checks line up with the backend's
  // PasswordPolicyService rules - we surface each one so the user can see
  // what's still missing as they type. The bonus checks (length tiers,
  // case mixing) only feed the visual strength bar; they don't block
  // submission. The bar climbs through five steps:
  //   0 (none) → 1 weak → 2 fair → 3 good → 4 strong
  // and submission is allowed at level 3+ (i.e. all four required checks
  // pass AND we've earned at least one bonus). This stops obvious garbage
  // like "abcd1234@" while still allowing real-but-not-paranoid passwords.
  const passwordChecks = React.useMemo(() => {
    const pwd = signupPassword || '';
    const lengthOk = pwd.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecial = /[@!#$%^&*=+]/.test(pwd);
    const required = [lengthOk, hasLetter, hasDigit, hasSpecial];
    const requiredScore = required.filter(Boolean).length; // 0..4

    // Bonus signals - these don't block, just push the strength bar higher.
    const longer = pwd.length >= 12;
    const mixedCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
    const bonusScore = (longer ? 1 : 0) + (mixedCase ? 1 : 0);

    // Compose final 0..4 score. Required gates the floor; bonus tops it off.
    let score = 0;
    if (pwd.length === 0) score = 0;
    else if (requiredScore < 4) score = Math.min(2, requiredScore);
    else score = Math.min(4, 2 + bonusScore);

    const allRequiredMet = requiredScore === 4;
    const strongEnough = allRequiredMet && score >= 3;

    return { lengthOk, hasLetter, hasDigit, hasSpecial, longer, mixedCase, score, allRequiredMet, strongEnough };
  }, [signupPassword]);

  const strengthLabel = ['', 'Too weak', 'Fair', 'Good', 'Strong'][passwordChecks.score];
  const strengthColor = ['#e5e7eb', '#dc2626', '#f59e0b', '#3b82f6', '#10b981'][passwordChecks.score];

  // Block submission on the same criteria the strength meter exposes - no
  // point letting the user click "Create account" with a password the
  // backend will reject. Confirm-match is also required (handled here
  // rather than only at submit so the button reflects reality as they type).
  const passwordMatches = signupPassword.length > 0 && signupPassword === confirmPassword;
  const signupIsDisabled = !firstName || !lastName || !signupEmail || phoneNumber.length < 7
    || !signupPassword || !confirmPassword
    || !passwordChecks.strongEnough
    || !passwordMatches;

  useEffect(() => { if (!isCountryOpen) return; const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-country-selector]')) setIsCountryOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [isCountryOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 15) setPhoneNumber(v); };

  const validatePassword = (pwd: string) => /\d/.test(pwd) && /[a-zA-Z]/.test(pwd) && /[@!#$%^&*=+]/.test(pwd) && pwd.length >= 8;

  const handleGoogleSignupSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleSignupLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } });
      if (!response.ok) throw new Error('Failed to fetch Google user info');
      const userInfo = await response.json();
      try {
        const br = await googleAuth({ email: userInfo.email, firstName: userInfo.given_name || '', lastName: userInfo.family_name || '', customerType: signupUserType });
        if (br.success && br.data?.twoFactorRequired && br.data?.customerId) { showInfo('Please enter your authenticator code.'); router.push(`/user/auth/verify-totp?customerId=${encodeURIComponent(String(br.data.customerId))}`); return; }
        if (br.success && br.data?.token) { setAuthToken(br.data.token); showSuccess(appRedirect ? 'Welcome! Returning to the app…' : 'Welcome back! Redirecting...'); if (appRedirect) { setTimeout(() => returnToAppWithSession(br.data!.token as string, br.data), 300); } else if (isBookingRedirect) { setTimeout(() => redirectToBookingDashboard(br.data?.customerType), 300); } else { router.push(redirectUrl || '/user'); } return; }
      } catch { /* continue with form pre-fill */ }
      if (userInfo.given_name) setFirstName(userInfo.given_name);
      if (userInfo.family_name) setLastName(userInfo.family_name);
      if (userInfo.email) setSignupEmail(userInfo.email);
      setIsGooglePreFilled(true);
      showSuccess('Google account connected!');
      showInfo('Enter your phone number and create a password to finish.');
    } catch { showError('Failed to connect Google account.'); }
    finally { setGoogleSignupLoading(false); }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!firstName.trim()) newErrors.firstName = tSignup('firstNameRequired');
    if (!lastName.trim()) newErrors.lastName = tSignup('lastNameRequired');
    if (!phoneNumber.trim()) newErrors.phoneNumber = tSignup('phoneRequired');
    else if (phoneNumber.replace(/\D/g, '').length < 7) newErrors.phoneNumber = 'Phone must be 7-15 digits';
    if (!signupEmail.trim()) newErrors.email = tSignup('emailRequired');
    if (!validatePassword(signupPassword)) newErrors.password = tSignup('passwordInvalid');
    if (signupPassword !== confirmPassword) newErrors.confirmPassword = tSignup('passwordsNotMatch');
    setSignupErrors(newErrors);
    if (!isOnline) { showWarning('You are offline.'); return; }
    if (Object.keys(newErrors).length === 0) {
      // Photographers: validate + CREATE THE ACCOUNT here, on the signup
      // step, then open the wizard. The account must exist up front so the
      // wizard's progressive autosave can persist immediately - and, just
      // as importantly, any email/password problem shows on THIS form
      // instead of failing confusingly at the last wizard step.
      //
      // First pre-check the password against the backend's full policy
      // (including the HaveIBeenPwned breach corpus, which the client-side
      // strength meter can't see) BEFORE opening the wizard. Without this a
      // photographer with a breached password fills out all 6 wizard steps
      // and only then gets rejected at the deferred signup() call, with no
      // way to fix the password from inside the wizard. validate-password
      // creates nothing - it just runs the rules and returns the reason.
      if (signupUserType.toLowerCase() === 'photographer') {
        setSignupLoading(true);
        // Email-availability pre-check BEFORE opening the 6-step wizard.
        // signup() is deferred to the wizard's last step, so without this a
        // duplicate email is only caught after all 6 steps are filled.
        try {
          const emailCheck = await checkEmailRemote(signupEmail.trim());
          if (emailCheck.data && emailCheck.data.action === 0) {
            const msg = emailCheck.data.message || 'This email already exists. Please log in to use your account.';
            setSignupErrors({ email: msg });
            showError(msg);
            setSignupLoading(false);
            return;
          }
          // Network/parse failure shouldn't trap the user - signup() at the
          // end still enforces uniqueness server-side.
        } catch {
          // swallow - proceed; signup() remains the source of truth.
        }
        try {
          const pwCheck = await validatePasswordRemote(signupPassword);
          if (pwCheck.data && pwCheck.data.action === 0) {
            const msg = pwCheck.data.message || 'Please choose a stronger password.';
            setSignupErrors({ password: msg });
            showError(msg);
            setSignupLoading(false);
            return;
          }
          // Network/parse failure on the pre-check shouldn't trap the user
          // out of signing up - the real signup() at the end still enforces
          // the policy server-side, so fall through and open the wizard.
        } catch {
          // swallow - proceed; signup() remains the source of truth.
        }
        // Create the account NOW - a bad password / taken email surfaces
        // on THIS form, never deep inside the 6-step wizard. signup() mints
        // a pre-OTP token so the wizard's autosave + finalize authenticate.
        try {
          const resp = await signup({
            firstName, lastName, email: signupEmail,
            phone: `${countryCode}${phoneNumber}`,
            customerType: signupUserType, password: signupPassword,
          });
          if (!resp.success || !resp.data || !resp.data.customerId || !resp.data.token) {
            const msg = (resp.success ? '' : resp.error)
              || 'Signup did not complete. Please try again.';
            setSignupErrors(/password/i.test(msg) ? { password: msg } : { email: msg });
            showError(msg);
            setSignupLoading(false);
            return;
          }
          setAuthToken(resp.data.token);
          const otpUrl = `/user/auth/verify-otp?applicantId=${encodeURIComponent(String(resp.data.customerId))}&email=${encodeURIComponent(signupEmail)}&customerType=${encodeURIComponent(signupUserType)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&phone=${encodeURIComponent(`${countryCode}${phoneNumber}`)}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`;
          setPendingOtpRedirectUrl(otpUrl);
          // Account already exists → the wizard's ensureSession is a no-op.
          photographerSessionRef.current = Promise.resolve({ success: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.';
          setSignupErrors({ email: msg });
          showError(msg);
          setSignupLoading(false);
          return;
        }
        setSignupLoading(false);
        setShowPhotographerOnboarding(true);
        return;
      }
      setSignupLoading(true);
      try {
        const response = await signup({ firstName, lastName, email: signupEmail, phone: `${countryCode}${phoneNumber}`, customerType: signupUserType, password: signupPassword });
        if (response.success && response.data) {
          const customerId = response.data.customerId;
          if (!customerId) { setSignupErrors({ email: 'Missing customer ID.' }); showError('Missing customer ID.'); setSignupLoading(false); return; }
          showSuccess('Account created!');
          const otpUrl = `/user/auth/verify-otp?applicantId=${encodeURIComponent(String(customerId))}&email=${encodeURIComponent(signupEmail)}&customerType=${encodeURIComponent(signupUserType)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&phone=${encodeURIComponent(`${countryCode}${phoneNumber}`)}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`;
          showInfo('Check your phone for the SMS code.');
          router.push(otpUrl);
        } else { const msg = response.error || 'Signup failed.'; setSignupErrors({ email: msg }); showError(msg); }
      } catch (err) { const msg = err instanceof Error ? err.message : 'An error occurred.'; setSignupErrors({ email: msg }); showError(msg); }
      finally { setSignupLoading(false); }
    }
  };

  // persistPhotographerProfile lives in @/lib/photographer/persist-profile
  // (shared by signup, post-login, and post-OTP completion flows).

  // Session guard for the wizard. In the signup flow the account is already
  // created at the signup step (handleSignupSubmit sets this ref to a
  // resolved success), so this is a no-op. The lazy signup() below is only
  // a fallback for any path that opens the wizard without a session yet.
  // signup() mints a pre-OTP token so the /photographer/* saves authenticate
  // (they resolve the photographer purely from the JWT principal). Memoised
  // via a ref so concurrent callers share one result.
  const photographerSessionRef = React.useRef<Promise<{ success: boolean; error?: string }> | null>(null);
  const ensurePhotographerSession = async (): Promise<{ success: boolean; error?: string }> => {
    if (photographerSessionRef.current) return photographerSessionRef.current;
    const attempt = (async () => {
      const response = await signup({
        firstName, lastName, email: signupEmail,
        phone: `${countryCode}${phoneNumber}`,
        customerType: signupUserType, password: signupPassword,
      });
      if (!response.success || !response.data) {
        return { success: false, error: response.error || 'Signup failed. Please try again.' };
      }
      const customerId = response.data.customerId;
      if (!customerId) return { success: false, error: 'Signup succeeded but no customer ID was returned.' };
      if (!response.data.token) {
        return { success: false, error: 'Signup did not return a session token - profile could not be saved. Please try again.' };
      }
      setAuthToken(response.data.token);
      const otpUrl = `/user/auth/verify-otp?applicantId=${encodeURIComponent(String(customerId))}&email=${encodeURIComponent(signupEmail)}&customerType=${encodeURIComponent(signupUserType)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&phone=${encodeURIComponent(`${countryCode}${phoneNumber}`)}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`;
      setPendingOtpRedirectUrl(otpUrl);
      return { success: true };
    })();
    photographerSessionRef.current = attempt;
    const res = await attempt;
    if (!res.success) photographerSessionRef.current = null; // let the next tick / finalize retry
    return res;
  };

  const handlePhotographerFinalize = async (payload: import('@/app/components/PhotographerOnboarding').OnboardingPayload) => {
    const sess = await ensurePhotographerSession();
    if (!sess.success) throw new Error(sess.error || 'Could not start your session. Please try again.');
    // Idempotent: the wizard passed `existing` so persist skips whatever the
    // autosave already stored - it just fills any gaps and submits.
    await persistPhotographerProfile(payload, {
      firstName, lastName, phone: `${countryCode}${phoneNumber}`,
    });
  };

  // Post-login completion: the account already exists and the login response
  // set the auth token (incl. pre-OTP), so we ONLY persist the profile here -
  // no signup(). After it lands the user is at 100% and we resume the
  // original routing (OTP if still unverified, else the dashboard modal).
  const handleCompletionFinalize = async (payload: import('@/app/components/PhotographerOnboarding').OnboardingPayload) => {
    if (!completionCtx) throw new Error('Missing login context. Please log in again.');
    await persistPhotographerProfile(payload, {
      firstName: completionCtx.firstName,
      lastName: completionCtx.lastName,
      phone: completionCtx.phone,
    });
  };

  const handleUserTypeSelect = (type: string) => { setSelectedUserType(type); setShowUserTypeModal(false); };

  // ── Shared styles ──
  const inputStyle: React.CSSProperties = { width: '100%', padding: isMobile ? '13px 14px' : '12px 14px', fontSize: isMobile ? '16px' : '15px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', transition: 'all 0.2s', backgroundColor: '#eef2f9', minHeight: isMobile ? '48px' : '44px', boxSizing: 'border-box', color: '#1e293b' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' };
  const errorStyle: React.CSSProperties = { fontSize: '12px', color: '#dc2626', marginTop: '4px' };

  // ═══════════════════════════════════════════════════════════════
  // ─── RENDER ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      <UserTypeModal isOpen={showUserTypeModal} onSelect={handleUserTypeSelect} onClose={() => { setShowUserTypeModal(false); setIsLogin(true); window.history.replaceState(null, '', '/user/auth/login'); }} />

      <style>{`
        .auth-input:focus { border-color: #083A85 !important; box-shadow: 0 0 0 3px rgba(8,58,133,0.1) !important; background-color: #fff !important; }
        .auth-input:hover:not(:focus) { border-color: #cbd5e1 !important; }
        .auth-input::placeholder { color: #94a3b8; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseHighlight { 0%,100% { border-color: #e2e8f0; } 50% { border-color: #083A85; } }
        @keyframes fadeInDown { from { opacity:0; transform: translateX(-50%) translateY(-1rem); } to { opacity:1; transform: translateX(-50%) translateY(0); } }

        /* Auth overlay panel ambient effects */
        @keyframes authOrbDriftA {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(20px,-14px) scale(1.05); }
        }
        @keyframes authOrbDriftB {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-18px,12px) scale(1.04); }
        }
        @keyframes authStarTwinkle {
          0%,100% { opacity: 0.35; }
          50%     { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="authOrbDriftA"], [style*="authOrbDriftB"], [style*="authStarTwinkle"] {
            animation: none !important;
          }
        }

        @supports (padding: env(safe-area-inset-top)) {
          .auth-mobile-safe { padding-top: max(1.5rem, env(safe-area-inset-top)) !important; padding-bottom: max(1.5rem, env(safe-area-inset-bottom)) !important; }
        }
        @media screen and (max-width: 1024px) {
          input[type="text"], input[type="email"], input[type="tel"], input[type="password"], select { font-size: 16px !important; }
        }
      `}</style>

      {/* Banners */}
      {showSessionExpiredBanner && (
        <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: '#D97706', color: 'white', padding: '0.4rem 1rem', borderRadius: '0.375rem', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: '500', animation: 'fadeInDown 0.3s ease-out' }}>
          Your session has expired. Please log in again.
          <button onClick={() => setShowSessionExpiredBanner(false)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
        </div>
      )}
      {showLoggedOutBanner && (
        <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: '#DC2626', color: 'white', padding: '0.4rem 1rem', borderRadius: '0.375rem', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: '500', animation: 'fadeInDown 0.3s ease-out' }}>
          You have been logged out successfully
          <button onClick={() => setShowLoggedOutBanner(false)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
        </div>
      )}

      {/* ── MOBILE: simple toggle, no sliding panel ── */}
      {isMobile ? (
        <div className="auth-mobile-safe" style={{ minHeight: '100dvh', overflow: 'auto', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', backgroundColor: '#fff', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '420px', paddingTop: '0.25rem', paddingBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex' }}><img src="/logo.png" alt="Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} /></Link>
            </div>
            {/* Tab toggle */}
            <div style={{ display: 'flex', marginBottom: '14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
              <button onClick={() => { setIsLogin(true); window.history.replaceState(null, '', '/user/auth/login'); }} style={{ flex: 1, padding: '11px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', background: isLogin ? 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)' : 'transparent', color: isLogin ? '#fff' : '#94a3b8', transition: 'all 0.3s', borderRadius: '11px', margin: '2px' }}>Sign In</button>
              <button onClick={() => { setIsLogin(false); window.history.replaceState(null, '', '/user/auth/signup'); }} style={{ flex: 1, padding: '11px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', background: !isLogin ? 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)' : 'transparent', color: !isLogin ? '#fff' : '#94a3b8', transition: 'all 0.3s', borderRadius: '11px', margin: '2px' }}>Sign Up</button>
            </div>
            {isLogin ? renderLoginForm() : renderSignupForm()}
          </div>
        </div>
      ) : (
        /* ── DESKTOP: sliding panel ── */
        <div style={{ position: 'relative', overflow: 'hidden', height: '100vh', width: '100vw', backgroundColor: '#fff' }}>
          {/* Forms layer */}
          <div style={{ display: 'flex', height: '100%', width: '100%' }}>
            {/* Signup form - left half */}
            <div style={{ width: '50%', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', opacity: isLogin ? 0 : 1, pointerEvents: isLogin ? 'none' : 'auto', transition: 'opacity 0.4s ease 0.2s' }}>
              <div style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 3rem', margin: 'auto 0' }}>
                {renderSignupForm()}
              </div>
            </div>
            {/* Login form - right half */}
            <div style={{ width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: isLogin ? 1 : 0, pointerEvents: isLogin ? 'auto' : 'none', transition: 'opacity 0.4s ease 0.2s' }}>
              <div style={{ width: '100%', maxWidth: '420px', padding: '0 3rem' }}>
                {renderLoginForm()}
              </div>
            </div>
          </div>

          {/* Sliding overlay panel */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '50%', height: '100%',
            background: 'linear-gradient(160deg, #03152F 0%, #052047 30%, #083A85 60%, #0F4FB6 100%)',
            borderRadius: isLogin ? '0 20px 20px 0' : '20px 0 0 20px',
            transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.6s cubic-bezier(0.65, 0, 0.35, 1), border-radius 0.6s ease',
            zIndex: 10, overflow: 'hidden'
          }}>
            {/* Top brand stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(125,211,252,0) 8%, rgba(125,211,252,0.65) 38%, rgba(255,255,255,0.95) 50%, rgba(184,58,182,0.85) 62%, rgba(125,211,252,0) 92%, transparent 100%)', opacity: 0.85, zIndex: 5, pointerEvents: 'none' }} />

            {/* Dot pattern */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5, pointerEvents: 'none' }} />

            {/* Soft brand orbs */}
            <div style={{ position: 'absolute', top: '8%', left: '8%', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(96,165,250,0.28) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(48px)', pointerEvents: 'none', animation: 'authOrbDriftA 14s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '8%', right: '8%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(184,58,182,0.22) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none', animation: 'authOrbDriftB 16s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', top: '40%', right: '20%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(236,72,153,0.16) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(36px)', pointerEvents: 'none', animation: 'authOrbDriftA 18s ease-in-out infinite', animationDelay: '-4s' }} />

            {/* Ambient stars */}
            {[
              { t: '12%', l: '24%', d: 0,   big: false },
              { t: '18%', l: '62%', d: 1.4, big: true  },
              { t: '32%', l: '14%', d: 2.6, big: false },
              { t: '46%', l: '78%', d: 0.8, big: false },
              { t: '60%', l: '32%', d: 3.1, big: true  },
              { t: '70%', l: '64%', d: 1.7, big: false },
              { t: '82%', l: '18%', d: 2.3, big: false },
              { t: '88%', l: '50%', d: 0.4, big: false },
            ].map((s, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: s.t,
                  left: s.l,
                  width: s.big ? 3 : 2,
                  height: s.big ? 3 : 2,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: s.big ? '0 0 8px rgba(255,255,255,0.95)' : '0 0 4px rgba(255,255,255,0.85)',
                  opacity: 0.6,
                  pointerEvents: 'none',
                  animation: `authStarTwinkle 4.5s ease-in-out ${s.d}s infinite`,
                  zIndex: 1,
                }}
              />
            ))}

            <OverlayPanel isLogin={isLogin} onToggle={toggleView} userType={selectedUserType} />
          </div>

        </div>
      )}

      <PostLoginModal isOpen={showPostLoginModal} userName={loggedInUserName} customerType={loggedInUserType} onKeepExploring={handleKeepExploring} onGoToDashboard={handleGoToDashboard} />

      {/* Photographer onboarding wizard - after signup, before OTP */}
      <PhotographerOnboarding
        isOpen={showPhotographerOnboarding}
        onClose={() => {
          // Dismiss without finalising - nothing has been written to the
          // backend yet, so the user is free to retry signup with the
          // same email/phone.
          setShowPhotographerOnboarding(false);
        }}
        onFinalize={handlePhotographerFinalize}
        onComplete={() => {
          setShowPhotographerOnboarding(false);
          if (pendingOtpRedirectUrl) router.push(pendingOtpRedirectUrl);
        }}
        firstName={firstName}
        lastName={lastName}
        phone={`${countryCode}${phoneNumber}`}
        serverSync
        ensureSession={ensurePhotographerSession}
      />

      {/* Post-login profile-completion wizard - same component, but the
          account already exists so onFinalize only persists the profile.
          Blocking: closing it just leaves the user on the login page (no
          dashboard, no OTP) until they finish. */}
      {completionCtx && (
        <PhotographerOnboarding
          isOpen={showCompletionWizard}
          onClose={() => {
            // Hard gate: dismissing does NOT let them through. Profile is
            // saved incrementally server-side; they re-login to resume.
            setShowCompletionWizard(false);
          }}
          onFinalize={handleCompletionFinalize}
          onComplete={() => {
            setShowCompletionWizard(false);
            const ctx = completionCtx;
            if (!ctx) { router.push('/user/auth/login'); return; }
            if (!ctx.otpVerified) {
              // Profile is now 100%; the account still needs OTP.
              router.push(`/user/auth/verify-otp?applicantId=${encodeURIComponent(ctx.customerId)}&email=${encodeURIComponent(ctx.email)}`);
              return;
            }
            // Verified + complete → proceed to the normal post-login modal.
            const userData = { id: ctx.customerId, firstName: ctx.firstName, lastName: ctx.lastName, email: ctx.email, phone: ctx.phone, customerId: ctx.customerId, customerType: ctx.customerType };
            loginUser(userData, getAuthToken() || '');
            setLoggedInUserName(ctx.firstName || 'User');
            setLoggedInUserType(ctx.customerType);
            showSuccess('Profile complete! Welcome back.');
            if (isBookingRedirect) { setTimeout(() => redirectToBookingDashboard(ctx.customerType), 300); }
            else { setShowPostLoginModal(true); }
          }}
          firstName={completionCtx.firstName}
          lastName={completionCtx.lastName}
          phone={completionCtx.phone}
          prefillFromServer
          serverSync
        />
      )}
    </>
  );

  // ═══════════════════════════════════════════════════════════════
  // ─── LOGIN FORM RENDER ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  function renderLoginForm() {
    return (
      <>
        {!isMobile && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex' }}><img src="/logo.png" alt="Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} /></Link>
          </div>
        )}
        <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '700', textAlign: 'center', marginBottom: '2px', background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('title')}</h1>
        <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#64748b', textAlign: 'center', marginBottom: isMobile ? '14px' : '16px', marginTop: 0 }}>Sign in to your account</p>

        <form onSubmit={handleLoginSubmit}>
          {loginError && <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px' }}><p style={{ fontSize: '12px', color: '#991b1b', margin: 0 }}>{loginError}</p></div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
            <div>
              <label htmlFor="loginEmail" style={labelStyle}>{t('yourEmail')}</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/></svg>
                </div>
                <input className="auth-input" type="email" id="loginEmail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder={t('emailPlaceholder')} style={{ ...inputStyle, paddingLeft: '42px' }} />
              </div>
            </div>
            <div>
              <label htmlFor="loginPassword" style={labelStyle}>{tAuth('password')}</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" fill="currentColor"/></svg>
                </div>
                <input className="auth-input" type={showPassword ? 'text' : 'password'} id="loginPassword" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder={t('passwordPlaceholder')} style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', cursor: 'pointer', border: 'none', background: 'transparent', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: isMobile ? '8px' : '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
              <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#083A85', cursor: 'pointer' }} />Keep me logged in
            </label>
            <Link href="/user/auth/forgotpswd" style={{ fontSize: '13px', color: '#083A85', textDecoration: 'none', fontWeight: '600' }}>{t('forgotPasswordLink')}</Link>
          </div>

          <div style={{ marginTop: isMobile ? '12px' : '16px' }}>
            <button type="submit" disabled={loginIsDisabled || loginLoading} style={{ width: '100%', padding: isMobile ? '14px' : '12px', fontSize: '16px', borderRadius: '10px', fontWeight: '600', transition: 'all 0.3s', cursor: (loginIsDisabled || loginLoading) ? 'not-allowed' : 'pointer', background: (loginIsDisabled || loginLoading) ? '#94a3b8' : 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)', color: '#fff', border: 'none', letterSpacing: '0.5px', minHeight: isMobile ? '50px' : undefined, boxShadow: (loginIsDisabled || loginLoading) ? 'none' : '0 4px 12px rgba(8,58,133,0.25)' }}
              onMouseEnter={e => { if (!loginIsDisabled && !loginLoading) { e.currentTarget.style.background = 'linear-gradient(90deg, #052559 0%, #083A85 100%)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!loginIsDisabled && !loginLoading) { e.currentTarget.style.background = 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
              {loginLoading ? 'Signing in...' : t('loginButton')}
            </button>
          </div>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: isMobile ? '8px 0' : '12px 0' }}>
              <hr style={{ flex: '1', border: 'none', borderTop: '1.5px solid #d1d5db' }} />
              <span style={{ padding: '0 12px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{t('orContinueWith')}</span>
              <hr style={{ flex: '1', border: 'none', borderTop: '1.5px solid #d1d5db' }} />
            </div>
            <div style={{ display: 'flex' }}>
              <GoogleLoginButton onSuccess={handleGoogleLoginSuccess} onError={() => { showError('Google sign-in failed.'); setGoogleLoginLoading(false); }} disabled={googleLoginLoading || loginLoading} />
            </div>
          </>
        )}

        {/* Mobile only: show signup link */}
        {isMobile && (
          <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginTop: '10px', marginBottom: 0 }}>
            {t('notRegistered')}{' '}
            <button onClick={toggleView} style={{ color: '#083A85', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', padding: 0 }}>{t('createAccount')}</button>
          </p>
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── SIGNUP FORM RENDER ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  function renderSignupForm() {
    return (
      <>
        {!isMobile && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex' }}><img src="/logo.png" alt="Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} /></Link>
          </div>
        )}
        <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '700', textAlign: 'center', marginBottom: '2px', background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{tSignup('title')}</h1>
        <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#64748b', textAlign: 'center', marginBottom: isMobile ? '14px' : '16px', marginTop: 0 }}>Create your account to get started</p>

        {isGooglePreFilled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', marginBottom: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>Complete phone and password below.</span>
          </div>
        )}

        <form onSubmit={handleSignupSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
            {/* First + Last name row */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="firstName" style={labelStyle}>{tSignup('firstName')} {isGooglePreFilled && <span style={{ fontSize: '12px', color: '#10b981' }}>(from Google)</span>}</label>
                <input className="auth-input" type="text" id="firstName" value={firstName} onChange={e => !isGooglePreFilled && setFirstName(e.target.value)} placeholder={tSignup('firstNamePlaceholder')} readOnly={isGooglePreFilled} style={{ ...inputStyle, backgroundColor: isGooglePreFilled ? '#f1f5f9' : '#eef2f9', cursor: isGooglePreFilled ? 'not-allowed' : 'text' }} />
                {signupErrors.firstName && <p style={errorStyle}>{signupErrors.firstName}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="lastName" style={labelStyle}>{tSignup('lastName')} {isGooglePreFilled && <span style={{ fontSize: '12px', color: '#10b981' }}>(from Google)</span>}</label>
                <input className="auth-input" type="text" id="lastName" value={lastName} onChange={e => !isGooglePreFilled && setLastName(e.target.value)} placeholder={tSignup('lastNamePlaceholder')} readOnly={isGooglePreFilled} style={{ ...inputStyle, backgroundColor: isGooglePreFilled ? '#f1f5f9' : '#eef2f9', cursor: isGooglePreFilled ? 'not-allowed' : 'text' }} />
                {signupErrors.lastName && <p style={errorStyle}>{signupErrors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signupEmail" style={labelStyle}>{tSignup('yourEmail')} {isGooglePreFilled && <span style={{ fontSize: '12px', color: '#10b981' }}>(from Google)</span>}</label>
              <input className="auth-input" type="email" id="signupEmail" value={signupEmail} onChange={e => !isGooglePreFilled && setSignupEmail(e.target.value)} placeholder={tSignup('emailPlaceholder')} readOnly={isGooglePreFilled} style={{ ...inputStyle, backgroundColor: isGooglePreFilled ? '#f1f5f9' : '#eef2f9', cursor: isGooglePreFilled ? 'not-allowed' : 'text' }} />
              {signupErrors.email && <p style={errorStyle}>{signupErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phoneNumber" style={labelStyle}>{tSignup('phone')} {isGooglePreFilled && !phoneNumber && <span style={{ fontSize: '12px', color: '#2563eb' }}>(required)</span>}</label>
              <div style={{ display: 'flex', alignItems: 'center', border: isGooglePreFilled && !phoneNumber ? '1px solid #083A85' : '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#eef2f9', minHeight: isMobile ? '48px' : '44px', animation: isGooglePreFilled && !phoneNumber ? 'pulseHighlight 2s ease-in-out 3' : 'none' }}>
                <div data-country-selector style={{ position: 'relative' }}>
                  <button type="button" onClick={() => { setIsCountryOpen(o => !o); setCountrySearch(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '0', borderRight: '1px solid #e2e8f0', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: isMobile ? '13px 10px' : '12px 10px', fontSize: isMobile ? '16px' : '15px', minHeight: isMobile ? '48px' : '44px', whiteSpace: 'nowrap', borderRadius: '10px 0 0 10px' }}>
                    <img src={`https://flagcdn.com/w40/${countryIso}.png`} alt={countryIso} style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />
                    {countryCode}
                  </button>
                  {isCountryOpen && (
                    <div data-country-selector style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', width: '260px', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        <input autoFocus type="text" placeholder="Search country or code..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', backgroundColor: '#f9fafb' }} />
                      </div>
                      <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                        {filteredCountries.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '16px' }}>No results</p>
                        ) : filteredCountries.map(c => (
                          <button key={c.iso} type="button" onClick={() => { setCountryCode(c.code); setCountryIso(c.iso); setIsCountryOpen(false); setCountrySearch(''); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: '0', backgroundColor: c.iso === countryIso ? '#f0f4ff' : '#fff', cursor: 'pointer', fontSize: '13px', textAlign: 'left', borderBottom: '1px solid #f3f4f6' }}>
                            <img src={`https://flagcdn.com/w40/${c.iso}.png`} alt={c.iso} style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>{c.name}</span>
                            <span style={{ color: '#6b7280', flexShrink: 0 }}>{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input className="auth-input" type="tel" id="phoneNumber" value={phoneNumber} onChange={handlePhoneChange} placeholder="786875878" maxLength={15} inputMode="numeric" pattern="[0-9]*" style={{ flex: '1', border: '0', outline: 'none', padding: isMobile ? '13px 14px' : '12px 14px', fontSize: isMobile ? '16px' : '15px', minHeight: isMobile ? '48px' : '44px', backgroundColor: 'transparent', color: '#1e293b' }} />
              </div>
              {signupErrors.phoneNumber && <p style={errorStyle}>{signupErrors.phoneNumber}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signupPassword" style={labelStyle}>{tAuth('password')} {isGooglePreFilled && !signupPassword && <span style={{ fontSize: '12px', color: '#2563eb' }}>(required)</span>}</label>
              <div style={{ position: 'relative' }}>
                <input className="auth-input" type={showSignupPassword ? 'text' : 'password'} id="signupPassword" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder={tSignup('passwordPlaceholder')} style={{ ...inputStyle, paddingRight: '44px', borderColor: isGooglePreFilled && !signupPassword ? '#083A85' : undefined, animation: isGooglePreFilled && !signupPassword ? 'pulseHighlight 2s ease-in-out 3' : 'none' }} />
                <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', cursor: 'pointer', border: 'none', background: 'transparent', padding: '4px' }}>
                  <i className={`bi ${showSignupPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }} />
                </button>
              </div>
              {/*
                Strength meter - replaces the static "Must contain at least 8
                characters..." paragraph. The 4-segment bar fills with the
                password's score (red→amber→blue→green), and each required
                criterion lights up with a ✓ as it's met. The submit button is
                gated on score >= 3 so the user can't click Create account
                with a password the backend will reject anyway.
              */}
              {signupPassword.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4].map(seg => (
                      <span
                        key={seg}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: passwordChecks.score >= seg ? strengthColor : '#e5e7eb',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600, marginBottom: 6 }}>
                    {strengthLabel}
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 3 }}>
                    {[
                      { ok: passwordChecks.lengthOk, label: 'At least 8 characters' },
                      { ok: passwordChecks.hasLetter, label: 'Contains a letter' },
                      { ok: passwordChecks.hasDigit, label: 'Contains a number' },
                      { ok: passwordChecks.hasSpecial, label: 'Contains a special character (@!#$%^&*=+)' },
                      { ok: passwordChecks.longer || passwordChecks.mixedCase, label: '12+ characters or mixed case (recommended)', bonus: true },
                    ].map((c, idx) => (
                      <li key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        color: c.ok ? '#10b981' : (c.bonus ? '#9ca3af' : '#6b7280'),
                        opacity: c.bonus && !c.ok ? 0.75 : 1,
                      }}>
                        <i className={`bi ${c.ok ? 'bi-check-circle-fill' : 'bi-circle'}`} style={{ fontSize: 12 }} />
                        <span>{c.label}{c.bonus && !c.ok ? '' : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {signupPassword.length === 0 && (
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px', lineHeight: '1.4' }}>{tSignup('passwordHelper')}</p>
              )}
              {signupErrors.password && <p style={errorStyle}>{signupErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" style={labelStyle}>{tSignup('confirmPasswordLabel')} {isGooglePreFilled && !confirmPassword && <span style={{ fontSize: '12px', color: '#2563eb' }}>(required)</span>}</label>
              <div style={{ position: 'relative' }}>
                <input className="auth-input" type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={tSignup('confirmPasswordPlaceholder')} style={{ ...inputStyle, paddingRight: '44px', borderColor: isGooglePreFilled && !confirmPassword ? '#083A85' : undefined, animation: isGooglePreFilled && !confirmPassword ? 'pulseHighlight 2s ease-in-out 3' : 'none' }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', cursor: 'pointer', border: 'none', background: 'transparent', padding: '4px' }}>
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }} />
                </button>
              </div>
              {/* Live mismatch - surfaces as the user types so they don't have
                  to wait for the submit-time validator to catch it. */}
              {confirmPassword.length > 0 && !passwordMatches && (
                <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 12 }} />
                  Passwords don&apos;t match yet
                </p>
              )}
              {confirmPassword.length > 0 && passwordMatches && passwordChecks.strongEnough && (
                <p style={{ fontSize: 11, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: 12 }} />
                  Passwords match
                </p>
              )}
              {signupErrors.confirmPassword && <p style={errorStyle}>{signupErrors.confirmPassword}</p>}
            </div>
          </div>

          {/* Terms */}
          <div style={{ marginTop: isMobile ? '8px' : '12px', fontSize: '12px', color: '#6b7280', textAlign: 'left', lineHeight: '1.5' }}>
            {tSignup('termsText')}{' '}
            <a href="/user/terms-of-service" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '700' }}>{tSignup('termsOfService')}</a>
            {' '}{tSignup('and')}{' '}
            <a href="/user/privacy-policy" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '700' }}>{tSignup('privacyPolicy')}</a>.
          </div>

          {/* Submit */}
          <div style={{ marginTop: isMobile ? '10px' : '14px' }}>
            <button type="submit" disabled={signupIsDisabled || signupLoading} style={{ width: '100%', padding: isMobile ? '14px' : '12px', fontSize: '16px', borderRadius: '10px', fontWeight: '600', transition: 'all 0.3s', cursor: (signupIsDisabled || signupLoading) ? 'not-allowed' : 'pointer', background: (signupIsDisabled || signupLoading) ? '#94a3b8' : 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)', color: '#fff', border: 'none', letterSpacing: '0.5px', minHeight: isMobile ? '50px' : undefined, boxShadow: (signupIsDisabled || signupLoading) ? 'none' : '0 4px 12px rgba(8,58,133,0.25)' }}
              onMouseEnter={e => { if (!signupIsDisabled && !signupLoading) { e.currentTarget.style.background = 'linear-gradient(90deg, #052559 0%, #083A85 100%)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!signupIsDisabled && !signupLoading) { e.currentTarget.style.background = 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
              {signupLoading ? 'Creating Account...' : tSignup('createAccountButton')}
            </button>
          </div>
        </form>

        {GOOGLE_CLIENT_ID && signupUserType !== 'Photographer' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: isMobile ? '8px 0' : '12px 0' }}>
              <hr style={{ flex: '1', border: 'none', borderTop: '1.5px solid #d1d5db' }} />
              <span style={{ padding: '0 12px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{tSignup('orSignUpWith')}</span>
              <hr style={{ flex: '1', border: 'none', borderTop: '1.5px solid #d1d5db' }} />
            </div>
            <div style={{ display: 'flex' }}>
              <GoogleSignupButton onSuccess={handleGoogleSignupSuccess} onError={() => { showError('Google sign-in failed.'); setGoogleSignupLoading(false); }} disabled={googleSignupLoading} isConnected={isGooglePreFilled} />
            </div>
          </>
        )}

        {/* Mobile only: show login link */}
        {isMobile && (
          <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginTop: '14px', marginBottom: 0 }}>
            {tSignup('alreadyHaveAccountText')}{' '}
            <button onClick={toggleView} style={{ color: '#083A85', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', padding: 0 }}>{tSignup('loginLink')}</button>
          </p>
        )}
      </>
    );
  }
}

// ── Default export for backward compatibility ──
export default function LoginPage(): React.JSX.Element {
  return <AuthPage initialView="login" />;
}
