'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { resendOtp } from '@/lib/APIs/auth/resend-otp/route';
import { useToast } from '@/lib/notifications/ToastProvider';
import { getAuthToken, getRefreshToken, setAuthToken } from '@/lib/api/client';
import { getDashboardUrlWithToken } from '@/lib/utils/dashboard-url';
import { goToPostAuthDestination } from '@/lib/utils/post-auth-destination';
import { readOtpHandoff, scrubOtpUrl } from '@/lib/utils/otp-handoff';
import { persistPhotographerProfile } from '@/lib/photographer/persist-profile';

const PhotographerOnboarding = dynamic(() => import('@/app/components/PhotographerOnboarding'), { ssr: false });

// Component that uses useSearchParams - needs to be wrapped in Suspense
function VerifyOtpContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();

  const applicantIdFromQuery = searchParams.get('applicantId');
  // The identity record now arrives out of band (sessionStorage keyed by
  // applicantId) rather than in the query string. The query is still read as
  // a fallback so links minted before that change keep working, and any
  // personal params that do arrive are scrubbed from the address bar below.
  const handoffRef = useRef(
    readOtpHandoff(applicantIdFromQuery || '', {
      email: searchParams.get('email') || undefined,
      customerType: searchParams.get('customerType') || undefined,
      firstName: searchParams.get('firstName') || undefined,
      lastName: searchParams.get('lastName') || undefined,
      phone: searchParams.get('phone') || undefined,
    }),
  );
  const emailFromQuery = handoffRef.current.email || null;
  const [applicantId, setApplicantId] = useState(applicantIdFromQuery || '');
  const [email, setEmail] = useState(emailFromQuery || '');

  useEffect(() => {
    scrubOtpUrl();
  }, []);

  // If the signup was launched FROM the mobile app, it passes a custom-scheme
  // deep link (e.g. connekt://auth-callback or exp://…) as `redirect`. After
  // verification we bounce back into the app via that link — carrying the
  // freshly minted session so the app can log the user straight in — instead
  // of redirecting to the web dashboard.
  const redirectParam = searchParams.get('redirect') || '';
  // Loopback HTTP redirects (http://127.0.0.1:<port>/…, RFC 8252 §7.3) are
  // also app hand-backs: Connekt Studio listens locally because Chrome on
  // Windows silently drops custom-scheme navigations. Only literal loopback
  // hosts pass the http exception, so this stays closed to open redirects.
  const isLoopbackRedirect =
    !!redirectParam && /^http:\/\/(127\.0\.0\.1|\[::1\]|localhost)(:\d+)?\//i.test(redirectParam);
  const appRedirect =
    redirectParam && (isLoopbackRedirect || (!/^https?:\/\//i.test(redirectParam) && !redirectParam.startsWith('/')))
      ? redirectParam
      : '';
  const verifiedDataRef = useRef<{
    token?: string; refreshToken?: string; customerId?: string; email?: string;
    firstName?: string; lastName?: string; phone?: string; customerType?: string;
  } | null>(null);

  const returnToApp = (token: string | undefined, status: 'success' | 'registered') => {
    const d = verifiedDataRef.current || {};
    const sep = appRedirect.includes('?') ? '&' : '?';
    const p = new URLSearchParams();
    p.set('status', status);
    if (token) p.set('token', token);
    const rt = d.refreshToken || getRefreshToken();
    if (rt) p.set('refreshToken', rt);
    if (d.customerId || applicantId) p.set('customerId', String(d.customerId || applicantId));
    const em = d.email || email;
    if (em) p.set('email', String(em));
    // The OTP response doesn't always echo profile fields, so fall back to the
    // values signup threaded through the URL. customerType is critical: without
    // it the app's useRole defaults to 'Client', so a photographer or
    // coordinator would land on the wrong dashboard.
    const firstName = d.firstName || handoffRef.current.firstName || '';
    const lastName = d.lastName || handoffRef.current.lastName || '';
    const phone = d.phone || handoffRef.current.phone || '';
    const customerType = d.customerType || handoffRef.current.customerType || '';
    if (firstName) p.set('firstName', firstName);
    if (lastName) p.set('lastName', lastName);
    if (phone) p.set('phone', phone);
    if (customerType) p.set('customerType', customerType);
    const url = `${appRedirect}${sep}${p.toString()}`;
    setAppHandbackUrl(url); // keep the manual fallback visible if the auto-launch is blocked
    window.location.href = url;
  };
  // Set when a verified session is ready to hand back to a desktop/mobile app.
  // Renders the return-to-app overlay: the button re-fires the redirect with a
  // fresh user gesture, mirroring the login page's fallback.
  const [appHandbackUrl, setAppHandbackUrl] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Post-OTP profile-completion gate. After a photographer verifies, if
  // their profile isn't 100% (everything except KYC) the SAME onboarding
  // wizard opens here as a blocking modal before any dashboard redirect.
  const [showCompletionWizard, setShowCompletionWizard] = useState(false);
  const [completionCtx, setCompletionCtx] = useState<{
    firstName: string; lastName: string; phone: string;
  } | null>(null);
  const [dashboardUrl, setDashboardUrl] = useState('');

  /**
   * Hand off to the cross-app dashboard.
   *
   * This used to navigate to `${base}/?token=<JWT>&refreshToken=<JWT>`. A
   * token in a query string lands in browser history, in the Referer of
   * anything the next page requests, and in access logs, and a refresh
   * token in particular is an account-takeover primitive rather than merely
   * personal data.
   *
   * It is also unnecessary: the backend issues the JWT as an HttpOnly
   * cookie scoped to `.connekyt.com`, which travels on its own to
   * dashboard.connekyt.com. `getDashboardUrlWithToken` documents exactly
   * that and drops any token handed to it; the `user` role below and the
   * change-password screen already go through it.
   */
  const goToDashboard = () => {
    // A shared link (e.g. a collaboration invite) the visitor was sent here to unlock.
    if (goToPostAuthDestination()) return;
    const d = verifiedDataRef.current || {};
    const ct = d.customerType || handoffRef.current.customerType || '';
    window.location.href = getDashboardUrlWithToken(ct) || '/user/photographers';
  };

  // Create refs for each input box
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update state when query params change
  useEffect(() => {
    if (applicantIdFromQuery) setApplicantId(applicantIdFromQuery);
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [applicantIdFromQuery, emailFromQuery]);

  // Show error if no applicantId
  useEffect(() => {
    if (!applicantId) {
      setError('Invalid verification link. Please sign up again.');
    }
  }, [applicantId]);

  const isDisabled = otp.some(digit => digit === '') || !applicantId;

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, move to previous box
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
    // Handle left arrow
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle right arrow
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData) {
      const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(newOtp);

      // Focus on the next empty box or last box
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    if (!isDisabled) {
      setLoading(true);
      const otpCode = otp.join('');

      try {
        // Use customerId as expected by backend
        const response = await verifyOtp({ customerId: applicantId, otp: parseInt(otpCode, 10) });

        if (response.success) {
          const d = response.data;
          const token = d?.token || getAuthToken() || undefined;
          verifiedDataRef.current = { ...(d || {}), token };

          // PROFILE-COMPLETION GATE - right after verification. A photographer
          // whose profile isn't 100% (everything except KYC) must finish it
          // in the wizard before reaching the dashboard. The backend returned
          // a token so the wizard's /photographer/* saves authenticate.
          const ct = String(d?.customerType || '');
          const isPhotographer = ct.toLowerCase() === 'photographer';
          const pct = typeof d?.profileCompletionPercentage === 'number'
            ? d.profileCompletionPercentage : 100;
          if (isPhotographer && pct < 100 && token) {
            setAuthToken(token);
            setDashboardUrl(token);
            setCompletionCtx({
              firstName: d?.firstName || '',
              lastName: d?.lastName || '',
              phone: d?.phone || '',
            });
            showSuccess('Account verified! Finish your profile to continue.');
            setShowCompletionWizard(true);
            setLoading(false);
            return;
          }

          setSuccess(true);
          // Launched from the mobile app → hand the session back to it.
          if (appRedirect) {
            showSuccess(
              token
                ? 'Account verified! Returning to the app…'
                : 'Account verified! Open the app to sign in.',
            );
            setTimeout(() => returnToApp(token, token ? 'success' : 'registered'), 1500);
            return;
          }
          if (token) {
            showSuccess('Account verified! Redirecting to dashboard...');
            setTimeout(() => goToDashboard(), 2000);
          } else {
            // No token - redirect to login so user can authenticate
            showSuccess('Account verified! Please log in to continue.');
            setTimeout(() => {
              window.location.href = '/user/auth/login';
            }, 2000);
          }
        } else {
          const errorMessage = response.error || 'Invalid OTP. Please try again.';
          setError(errorMessage);
          showError(errorMessage);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtp(['', '', '', '', '', '']);

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    try {
      const response = await resendOtp({ customerId: applicantId });

      if (response.success) {
        showSuccess('Verification code sent successfully!');
      } else {
        const errorMessage = response.error || 'Failed to resend code. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    }

    // Focus on first input box
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  if (success) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
        <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
          <div style={{width: '100%', maxWidth: '420px', padding: window.innerWidth < 640 ? '24px 20px' : '32px 36px'}}>
            {/* Success Icon */}
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: window.innerWidth < 640 ? '16px' : '16px'}}>
              <div style={{ width: window.innerWidth < 640 ? '50px' : '56px', height: window.innerWidth < 640 ? '50px' : '56px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-check-circle" style={{ fontSize: window.innerWidth < 640 ? '24px' : '26px', color: '#ffffff' }}></i>
              </div>
            </div>

            <h1 style={{ fontSize: window.innerWidth < 640 ? '20px' : '22px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: '6px', letterSpacing: '0.3px' }}>Account Verified Successfully!</h1>
            <p style={{ fontSize: window.innerWidth < 640 ? '14px' : '14px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: window.innerWidth < 640 ? '20px' : '20px', lineHeight: '1.4', opacity: '0.7' }}>
              Your account has been successfully verified. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Post-verification completion gate - blocking. Closing it does NOT
  // bypass (no dashboard); the profile is saved server-side incrementally.
  if (showCompletionWizard && completionCtx) {
    return (
      <PhotographerOnboarding
        isOpen={true}
        onClose={() => { setShowCompletionWizard(false); }}
        onFinalize={async (payload) => {
          await persistPhotographerProfile(payload, completionCtx);
        }}
        onComplete={() => {
          setShowCompletionWizard(false);
          setSuccess(true);
          if (appRedirect) {
            showSuccess('Profile complete! Returning to the app…');
            setTimeout(() => returnToApp(dashboardUrl, 'success'), 1500);
            return;
          }
          showSuccess('Profile complete! Redirecting to dashboard...');
          setTimeout(() => {
            // dashboardUrl holds the session token, not a URL: here it is
            // simply the "do we have a session" flag. Without one, log in.
            if (dashboardUrl) goToDashboard();
            else window.location.href = '/user/auth/login';
          }, 1500);
        }}
        firstName={completionCtx.firstName}
        lastName={completionCtx.lastName}
        phone={completionCtx.phone}
        prefillFromServer
        serverSync
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        <div style={{width: '100%', maxWidth: '420px', padding: window.innerWidth < 640 ? '12px 18px 24px 18px' : '40px 36px', margin: '0 auto'}}>
          {/* Envelope Icon */}
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: window.innerWidth < 640 ? '12px' : '20px'}}>
            <div style={{ width: window.innerWidth < 640 ? '48px' : '60px', height: window.innerWidth < 640 ? '48px' : '60px', borderRadius: '50%', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-envelope" style={{ fontSize: window.innerWidth < 640 ? '22px' : '28px', color: '#ffffff' }}></i>
            </div>
          </div>

          {/* Title and Description */}
          <h1 style={{ fontSize: window.innerWidth < 640 ? '18px' : '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: window.innerWidth < 640 ? '5px' : '8px', letterSpacing: '0.3px' }}>
            Verify Your Email
          </h1>

          <p style={{ fontSize: window.innerWidth < 640 ? '12px' : '15px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: window.innerWidth < 640 ? '16px' : '24px', lineHeight: '1.4', opacity: '0.7' }}>
            We've sent a 6-digit verification code via email . Please enter it below.
          </p>

          {/* Error Message */}
          {error && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: window.innerWidth < 640 ? '8px' : '12px', marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Show email (read-only) */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <label style={{ display: 'block', fontSize: window.innerWidth < 640 ? '12px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px' }}>Account Email</label>
              <div style={{
                width: '100%',
                padding: window.innerWidth < 640 ? '10px 12px' : '10px 14px',
                fontSize: window.innerWidth < 640 ? '14px' : '15px',
                fontWeight: '700',
                border: '1.5px solid #d1d5db',
                borderRadius: window.innerWidth < 640 ? '10px' : '12px',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{email}</span>
              </div>
            </div>

            {/* OTP Input - Individual Boxes */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <label style={{ display: 'block', fontSize: window.innerWidth < 640 ? '12px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px' }}>
                Verification Code
              </label>
              <div style={{
                display: 'flex',
                gap: window.innerWidth < 640 ? '4px' : '6px',
                justifyContent: 'center',
                marginTop: window.innerWidth < 640 ? '8px' : '10px'
              }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${index + 1}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    style={{
                      width: window.innerWidth < 640 ? '40px' : '45px',
                      height: window.innerWidth < 640 ? '40px' : '45px',
                      fontSize: window.innerWidth < 640 ? '16px' : '18px',
                      fontWeight: '500',
                      textAlign: 'center',
                      border: '1.5px solid #d1d5db',
                      borderRadius: window.innerWidth < 640 ? '8px' : '10px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#083A85';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isDisabled || loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: window.innerWidth < 640 ? '15px' : '14px',
                borderRadius: window.innerWidth < 640 ? '10px' : '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
                cursor: (isDisabled || loading) ? 'not-allowed' : 'pointer',
                backgroundColor: (isDisabled || loading) ? '#d1d5db' : '#083A85',
                color: (isDisabled || loading) ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: window.innerWidth < 640 ? '10px' : '16px'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            {/* Resend Code Link */}
            <div style={{ textAlign: 'center', marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || !applicantId}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: window.innerWidth < 640 ? '11px' : '13px',
                  fontWeight: '600',
                  color: '#000000',
                  opacity: (loading || !applicantId) ? '0.4' : '0.7',
                  cursor: (loading || !applicantId) ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Didn't receive the code? Resend
              </button>
            </div>

            {/* Divider */}
            <div style={{borderTop: window.innerWidth < 640 ? '1.5px solid #9a9a9cff' : '2px solid #9a9a9cff', marginBottom: window.innerWidth < 640 ? '10px' : '14px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px', opacity: '0.7' }}>
                Already verified?
              </p>
              <Link href="/user/auth/login" style={{fontSize: window.innerWidth < 640 ? '12px' : '14px', color: '#083A85', textDecoration: 'none', fontWeight: '510'}}>
                Sign in to your account
              </Link>
            </div>
          </form>
        </div>
      </div>

      {appHandbackUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(255,255,255,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <img src="/logo.png" alt="" style={{ width: '52px', height: '52px', objectFit: 'contain', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>You&apos;re verified</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              Returning you to the app. If nothing happens, use the button below.
            </p>
            <button type="button" onClick={() => { window.location.href = appHandbackUrl; }}
              style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)', color: '#fff', border: 'none', letterSpacing: '0.5px', boxShadow: '0 4px 12px rgba(8,58,133,0.25)' }}>
              Open {/^(connektstudio:|http:\/\/(127\.0\.0\.1|localhost))/i.test(appHandbackUrl) ? 'Connekt Studio' : 'the Connekt app'}
            </button>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '16px 0 0' }}>You can close this tab once the app opens.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Main page component with Suspense boundary
export default function VerifyOtpPage(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
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
          }}>Loading...</p>
        </div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}

export { VerifyOtpPage };
