'use client';
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyTotp } from '@/lib/APIs/auth/verify-totp/route';
import { useToast } from '@/lib/notifications/ToastProvider';
import { getRefreshToken } from '@/lib/api/client';
import { useAuth } from '@/app/providers/AuthProvider';
import PostLoginModal from '@/app/components/PostLoginModal';
import { getDashboardUrlWithToken } from '@/lib/utils/dashboard-url';

function VerifyTotpContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();
  const { login: loginUser } = useAuth();

  const customerIdFromQuery = searchParams.get('customerId');
  const [customerId] = useState(customerIdFromQuery || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // PostLoginModal state
  const [showPostLoginModal, setShowPostLoginModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [loggedInUserType, setLoggedInUserType] = useState<string | undefined>(undefined);
  const storedTokenRef = useRef<string>('');
  const storedRefreshTokenRef = useRef<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!customerId) {
      setError('Invalid verification link. Please log in again.');
    }
  }, [customerId]);

  const doVerify = useCallback(async (totpCode: string) => {
    if (!customerId || loading || showPostLoginModal) return;

    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await verifyTotp({ customerId, code: totpCode });

      if (response.success && response.data?.token) {
        const data = response.data;
        const token = data.token as string;
        const customerType = data.customerType || '';
        const userData = {
          id: data.customerId || customerId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          customerId: data.customerId || customerId,
          customerType,
        };
        loginUser(userData, token);

        // Store for modal handlers
        storedTokenRef.current = token;
        storedRefreshTokenRef.current = getRefreshToken() || '';
        setLoggedInUserName(userData.firstName || 'User');
        setLoggedInUserType(customerType);

        showSuccess('Verified successfully!');
        setShowPostLoginModal(true);
      } else {
        const errorMessage = response.error || 'Invalid code. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [customerId, loading, showPostLoginModal, isOnline, showWarning, showError, showSuccess, loginUser]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (code.every(d => d !== '') && !loading && !showPostLoginModal && customerId) {
      doVerify(code.join(''));
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setCode(newCode);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.every(d => d !== '') && !loading && !showPostLoginModal && customerId) {
      doVerify(code.join(''));
    }
  };

  // PostLoginModal handlers
  const handleGoToDashboard = () => {
    setShowPostLoginModal(false);
    const dashboardUrl = getDashboardUrlWithToken(loggedInUserType, storedTokenRef.current || undefined, storedRefreshTokenRef.current || undefined);
    if (dashboardUrl && storedTokenRef.current) {
      window.open(dashboardUrl, '_blank');
    } else {
      window.open('/user/dashboard', '_blank');
    }
    router.push('/user/photographers');
  };

  const handleKeepExploring = () => {
    setShowPostLoginModal(false);
    router.push('/user/photographers');
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        <div style={{width: '100%', maxWidth: '420px', padding: '40px 36px', margin: '0 auto'}}>
          {/* Shield Icon */}
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-shield-lock" style={{ fontSize: '28px', color: '#ffffff' }}></i>
            </div>
          </div>

          {/* Title and Description */}
          <h1 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: '8px', letterSpacing: '0.3px' }}>
            Two-Factor Authentication
          </h1>

          <p style={{ fontSize: '15px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4', opacity: '0.7' }}>
            Open your authenticator app and enter the 6-digit code to sign in.
          </p>

          {/* Error Message */}
          {error && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Code Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                Verification Code
              </label>
              <div style={{
                display: 'flex',
                gap: '6px',
                justifyContent: 'center',
                marginTop: '10px'
              }}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    style={{
                      width: '45px',
                      height: '45px',
                      fontSize: '18px',
                      fontWeight: '500',
                      textAlign: 'center',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: loading ? '#f3f4f6' : '#ffffff',
                      color: '#000000',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#083A85'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                  />
                ))}
              </div>
            </div>

            {/* Loading indicator (replaces button) */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '10px',
                marginBottom: '16px',
                color: '#083A85',
                fontSize: '14px',
                fontWeight: '600',
              }}>
                Verifying...
              </div>
            )}

            {/* Info text */}
            <div style={{
              backgroundColor: '#f0f5ff',
              border: '1px solid #dbeafe',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '12px', color: '#1e40af', margin: 0, lineHeight: '1.5' }}>
                Open Google Authenticator, Authy, or your preferred authenticator app to find your code. The code refreshes every 30 seconds.
              </p>
            </div>

            {/* Divider */}
            <div style={{borderTop: '2px solid #9a9a9cff', marginBottom: '14px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px', opacity: '0.7' }}>
                Having trouble?
              </p>
              <Link href="/user/auth/login" style={{fontSize: '14px', color: '#083A85', textDecoration: 'none', fontWeight: '510'}}>
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>

      <PostLoginModal
        isOpen={showPostLoginModal}
        userName={loggedInUserName}
        customerType={loggedInUserType}
        onKeepExploring={handleKeepExploring}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
}

export default function VerifyTotpPage(): React.JSX.Element {
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
            <i className="bi bi-shield-lock"></i>
          </div>
          <p style={{
            fontSize: '16px',
            fontWeight: '500'
          }}>Loading...</p>
        </div>
      </div>
    }>
      <VerifyTotpContent />
    </Suspense>
  );
}
