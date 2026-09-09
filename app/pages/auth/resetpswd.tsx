'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { setNewPassword as setNewPasswordAPI } from '@/lib/APIs/auth/set-new-password/route';
import { validateResetToken } from '@/lib/APIs/auth/validate-token/route';
import { useToast } from '@/lib/notifications/ToastProvider';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ResetPasswordContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();
  const emailFromQuery = searchParams.get('email') || '';
  // set-new-password endpoint uses 'code' (from forgot-password email)
  const codeFromQuery = searchParams.get('code') || searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * The page used to render the form — and claim "Your identity has been
   * verified" — unconditionally, with no token check at all. A visitor with an
   * expired link, or none, composed a whole new password before finding out on
   * submit. Nothing may be claimed or rendered until the backend confirms.
   */
  const [tokenState, setTokenState] = useState<'checking' | 'valid' | 'invalid'>('checking');

  useEffect(() => {
    let cancelled = false;
    if (!codeFromQuery) {
      setTokenState('invalid');
      return;
    }
    (async () => {
      try {
        const res = await validateResetToken(codeFromQuery);
        if (!cancelled) setTokenState(res.success ? 'valid' : 'invalid');
      } catch {
        // Treat an unreachable backend as unverified: claiming verification we
        // could not obtain is the bug being fixed.
        if (!cancelled) setTokenState('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [codeFromQuery]);

  const isDisabled = !newPassword || !confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    if (!isDisabled) {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        const errMsg = 'Passwords do not match';
        setError(errMsg);
        showError(errMsg);
        return;
      }

      // Mirror the server's policy so nobody is rejected by a rule this
      // screen never mentioned: 8+ characters, a letter, a digit and one
      // symbol. Signup already states and enforces the same thing.
      if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@!#$%^&*=+]).{8,}$/.test(newPassword)) {
        const errMsg =
          'Use at least 8 characters, including a letter, a number and one of @!#$%^&*=+';
        setError(errMsg);
        showError(errMsg);
        return;
      }

      setLoading(true);

      try {
        const passwordData = {
          email: emailFromQuery,
          code: codeFromQuery, // Backend expects 'code'
          password: newPassword, // Backend requires 'password'
          newPassword: newPassword, // Backend also requires 'newPassword'
          confirmPassword: confirmPassword, // Backend requires confirmPassword
        };
        const response = await setNewPasswordAPI(passwordData);

        if (response.success) {
          // Show success message
          setSuccess(true);
          showSuccess('Password reset successful!');

          /**
           * Desktop users want the redirect. A user who arrived here by tapping
           * the reset link in the Connekyt mobile app does NOT: dropping them on
           * the web login is a dead end when their session lives in the app. For
           * them we hold on the success screen and offer a way back instead.
           */
          const onMobileBrowser =
            typeof navigator !== 'undefined' &&
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (!onMobileBrowser) {
            setTimeout(() => {
              router.push('/user/auth/login');
            }, 2000);
          }
        } else {
          const errorMessage = response.error || 'Password reset failed. Please try again.';
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

  const shellOuter = "h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4";
  const shellInner = "w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center";

  // Validation in flight — claim nothing yet.
  if (tokenState === 'checking') {
    return (
      <div className={shellOuter}>
        <div className={shellInner}>
          <div style={{ textAlign: 'center', padding: '32px 24px' }} role="status" aria-live="polite">
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#083A85', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: '#000', opacity: 0.7 }}>Checking your reset link…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // No token, expired, or unknown: say so plainly and offer a new link. The
  // password form is NOT rendered — there is nothing valid to submit it with.
  if (tokenState === 'invalid') {
    return (
      <div className={shellOuter}>
        <div className={shellInner}>
          <div style={{ width: '100%', maxWidth: 420, padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: 26, color: '#dc2626' }} />
              </div>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#000', marginBottom: 8, letterSpacing: '0.3px' }}>
              This reset link is no longer valid
            </h1>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#000', opacity: 0.7, lineHeight: 1.5, marginBottom: 24 }}>
              Reset links expire for your security, and each one can only be used once.
              Request a new link and we&apos;ll email it to you.
            </p>
            <Link
              href="/user/auth/forgotpswd"
              style={{ display: 'inline-block', width: '100%', padding: '12px 18px', borderRadius: 9999, backgroundColor: '#083A85', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
            >
              Request a new link
            </Link>
            <Link
              href="/user/auth/login"
              style={{ display: 'inline-block', marginTop: 14, fontSize: 14, color: '#083A85', fontWeight: 500 }}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
        <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
          <div style={{width: '100%',maxWidth: '420px',padding: window.innerWidth < 640 ? '24px 20px' : '32px 36px'}}>
            {/* Success Icon */}
            <div style={{display: 'flex',justifyContent: 'center',marginBottom: window.innerWidth < 640 ? '16px' : '16px'}}>
              <div style={{ width: window.innerWidth < 640 ? '50px' : '56px', height: window.innerWidth < 640 ? '50px' : '56px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-check-circle" style={{ fontSize: window.innerWidth < 640 ? '24px' : '26px', color: '#ffffff' }}></i>
              </div>
            </div>

            <h1 style={{ fontSize: window.innerWidth < 640 ? '20px' : '22px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: '6px', letterSpacing: '0.3px' }}>Password Reset Successful!</h1>
            <p style={{ fontSize: window.innerWidth < 640 ? '14px' : '14px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: window.innerWidth < 640 ? '20px' : '20px', lineHeight: '1.4', opacity: '0.7' }}>
              Your password has been successfully reset.
            </p>

            {/* Deep link back into the app for anyone who started there. The
                scheme is declared in connekt-mobile/app.json ("connekt"). If the
                app is not installed nothing opens, so the web link below stays
                as the fallback for everyone. */}
            <a
              href="connekt://login"
              style={{ display: 'block', width: '100%', padding: '12px 18px', borderRadius: 9999, backgroundColor: '#083A85', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', textAlign: 'center', marginBottom: 10 }}
            >
              Open the Connekyt app
            </a>
            <Link
              href="/user/auth/login"
              style={{ display: 'block', fontSize: 14, color: '#083A85', fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}
            >
              Or sign in here
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        <div style={{width: '100%',maxWidth: '420px',padding: window.innerWidth < 640 ? '12px 18px 24px 18px' : '24px 36px', margin: '0 auto'}}>
          {/* Lock and Key Icon */}
          <div style={{display: 'flex',justifyContent: 'center',marginBottom: window.innerWidth < 640 ? '8px' : '10px'}}>
            <div style={{ width: window.innerWidth < 640 ? '40px' : '48px', height: window.innerWidth < 640 ? '40px' : '48px', borderRadius: '50%', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <i className="bi bi-lock" style={{ fontSize: window.innerWidth < 640 ? '17px' : '20px', color: '#ffffff', position: 'absolute', left: window.innerWidth < 640 ? '8px' : '10px' }}></i>
              <i className="bi bi-key" style={{ fontSize: window.innerWidth < 640 ? '17px' : '20px', color: '#ffffff', position: 'absolute', right: window.innerWidth < 640 ? '8px' : '10px' }}></i>
            </div>
          </div>

          {/* Title and Description */}
          <h1 style={{ fontSize: window.innerWidth < 640 ? '18px' : '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: window.innerWidth < 640 ? '3px' : '4px', letterSpacing: '0.3px' }}>Create New Password</h1>

          <p style={{ fontSize: window.innerWidth < 640 ? '12px' : '16px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: window.innerWidth < 640 ? '12px' : '14px', lineHeight: '1.3', opacity: '0.7' }}>
            Your identity has been verified. Please create a new secure password for your account.
          </p>

          {/* Error Message */}
          {error && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: window.innerWidth < 640 ? '7px' : '8px', marginBottom: window.innerWidth < 640 ? '8px' : '10px' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '12px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit}>
            {/* New Password Input */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '10px' : '12px' }}>
              <label htmlFor="newPassword" style={{ display: 'block', fontSize: window.innerWidth < 640 ? '12px' : '16px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '3px' : '4px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: window.innerWidth < 640 ? '10px 40px 10px 12px' : '10px 40px 10px 14px',
                    fontSize: window.innerWidth < 640 ? '15px' : '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: window.innerWidth < 640 ? '10px' : '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: window.innerWidth < 640 ? '8px' : '4px',
                  }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: window.innerWidth < 640 ? '18px' : '16px' }}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '10px' : '12px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: window.innerWidth < 640 ? '12px' : '16px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '3px' : '4px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: window.innerWidth < 640 ? '10px 40px 10px 12px' : '10px 40px 10px 14px',
                    fontSize: window.innerWidth < 640 ? '15px' : '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: window.innerWidth < 640 ? '10px' : '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: window.innerWidth < 640 ? '8px' : '4px',
                  }}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: window.innerWidth < 640 ? '18px' : '16px' }}></i>
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '10px' : '12px', padding: window.innerWidth < 640 ? '5px 10px' : '6px 10px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '10.5px' : '14.5px', color: '#6b7280', margin: 0 }}>
                Password must contain: <span style={{ fontWeight: '500' }}>At least 8 characters, a letter, a number and one of @!#$%^&amp;*=+</span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isDisabled || loading}
              style={{
                width: '100%',
                padding: window.innerWidth < 640 ? '10px' : '9px',
                fontSize: window.innerWidth < 640 ? '15px' : '16px',
                borderRadius: window.innerWidth < 640 ? '10px' : '12px',
                fontWeight: '500',
                transition: 'all 0.3s',
                cursor: (isDisabled || loading) ? 'not-allowed' : 'pointer',
                backgroundColor: (isDisabled || loading) ? '#d1d5db' : '#083A85',
                color: (isDisabled || loading) ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: window.innerWidth < 640 ? '8px' : '10px'
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            {/* Back to Sign In Link */}
            <div style={{ textAlign: 'center', marginBottom: window.innerWidth < 640 ? '8px' : '10px' }}>
              <Link href="/user/auth/login" style={{ fontSize: window.innerWidth < 640 ? '12px' : '14px', fontWeight: '500', color: '#000000', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: '0.7' }}>
                <span>←</span> Back to Sign In
              </Link>
            </div>

            {/* Divider */}
            <div style={{borderTop: '1.5px solid #9a9a9cff',marginBottom: window.innerWidth < 640 ? '8px' : '10px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center', paddingBottom: window.innerWidth < 640 ? '0px' : '0px' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '15px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '3px' : '3px', opacity: '0.7' }}>Need help?</p>
              <Link href="/user/help-center" style={{fontSize: window.innerWidth < 640 ? '12px' : '14px',color: '#083A85',textDecoration: 'none', fontWeight: '510'}}>Contact Support</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ResetPasswordPage(): React.JSX.Element {
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
      <ResetPasswordContent />
    </Suspense>
  );
}

export { ResetPasswordPage };
