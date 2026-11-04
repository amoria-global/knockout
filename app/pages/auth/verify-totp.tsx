'use client';
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyTotp, verifyEmailCode, sendEmailCode } from '@/lib/APIs/auth/verify-totp/route';
import OtpInput from '@/app/components/OtpInput';
import {
  attemptsText,
  formatCountdown,
  localDeadline,
  lockText,
  OTP_LENGTH,
  refusalFrom,
  secondsLeft,
  sentFromResponse,
  type CodeRefusal,
} from '@/lib/otp';
import { readChallenge, type TwoFactorMethod } from '@/lib/utils/two-factor-url';
import { useToast } from '@/lib/notifications/ToastProvider';
import { getRefreshToken } from '@/lib/api/client';
import { useAuth } from '@/app/providers/AuthProvider';
import { isCollaboratorType, workspaceDestination } from '@/lib/utils/workspace-entry';
import PostLoginModal from '@/app/components/PostLoginModal';
import { getDashboardUrlWithToken } from '@/lib/utils/dashboard-url';
import { readPostAuthDestination, goToPostAuthDestination } from '@/lib/utils/post-auth-destination';

/** Whole seconds left until a deadline, re-rendering once a second while it runs. */
function useCountdown(deadlineMs: number | null): number {
  const [, tick] = useState(0);
  useEffect(() => {
    if (deadlineMs == null) return;
    const id = setInterval(() => {
      tick((n) => n + 1);
      if (Date.now() >= deadlineMs) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);
  return secondsLeft(deadlineMs);
}

/**
 * Second step of sign-in. The server decides everything: this page sends the code and shows what
 * comes back (tries left, a lock with its time, a resend wait). Timers run off the server's
 * timestamps, never the device clock alone, and no code is ever checked in the browser.
 */
function VerifyTotpContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();
  const { login: loginUser } = useAuth();

  const challenge = readChallenge((k) => searchParams.get(k));
  const canVerify = !!(challenge.challengeId || challenge.customerId);
  const [method, setMethod] = useState<TwoFactorMethod>(challenge.defaultMethod);
  const [maskedEmail, setMaskedEmail] = useState(challenge.maskedEmail);
  const [code, setCode] = useState('');
  const [refusal, setRefusal] = useState<CodeRefusal | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  // The server locks each method on its own, so a lock on one must not block the other.
  const [locks, setLocks] = useState<Partial<Record<TwoFactorMethod, number>>>({});
  const lockedUntil = locks[method] ?? null;
  const [resendAt, setResendAt] = useState<number | null>(null);
  const submitting = useRef(false);
  const asked = useRef(false);

  const lockSeconds = useCountdown(lockedUntil);
  const resendSeconds = useCountdown(resendAt);
  const locked = lockSeconds > 0;

  // PostLoginModal state
  const [showPostLoginModal, setShowPostLoginModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [loggedInUserType, setLoggedInUserType] = useState<string | undefined>(undefined);
  const storedTokenRef = useRef<string>('');
  const storedRefreshTokenRef = useRef<string>('');

  const refuse = useCallback((r: CodeRefusal) => {
    if (r.errorCode === 'SESSION_EXPIRED') {
      showWarning('Your sign-in session ended. Please sign in again.');
      router.replace('/user/auth/login');
      return;
    }
    setRefusal(r);
    if (r.retryAfterSeconds) {
      const until = Date.now() + r.retryAfterSeconds * 1000;
      if (r.errorCode === 'LOCKED') setLocks((l) => ({ ...l, [method]: until }));
      else setResendAt(until);
    }
  }, [router, showWarning, method]);

  const sendEmail = useCallback(async () => {
    if (!challenge.challengeId || sending) return;
    setSending(true);
    setRefusal(null);
    try {
      const out = sentFromResponse(await sendEmailCode(challenge.challengeId), 'We could not send a code. Try again.');
      if ('sent' in out) {
        // Measured on the server clock, so a device with the wrong time still counts right.
        setResendAt(localDeadline(out.sent.resendAvailableAt, out.sent.serverTime, Date.now()));
        if (out.sent.maskedEmail) setMaskedEmail(out.sent.maskedEmail);
      } else {
        refuse(out.refused);
      }
    } catch {
      setRefusal({ message: 'We could not send a code. Try again.', errorCode: 'UNKNOWN' });
    } finally {
      setSending(false);
    }
  }, [challenge.challengeId, sending, refuse]);

  // Landing on the email method asks for its code once.
  useEffect(() => {
    if (method === 'EMAIL' && !asked.current) {
      asked.current = true;
      void sendEmail();
    }
  }, [method, sendEmail]);

  const doVerify = useCallback(async (typed: string) => {
    if (!canVerify || submitting.current || locked || showPostLoginModal || typed.length !== OTP_LENGTH) return;

    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    submitting.current = true;
    setRefusal(null);
    setLoading(true);

    try {
      const send = method === 'EMAIL' ? verifyEmailCode : verifyTotp;
      const response = await send({ challengeId: challenge.challengeId, customerId: challenge.customerId, code: typed });

      if (response.success && response.data?.token) {
        const data = response.data;
        const token = data.token as string;
        const customerType = data.customerType || '';
        const userData = {
          id: data.customerId || challenge.customerId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          customerId: data.customerId || challenge.customerId,
          customerType,
        };
        setDone(true);
        loginUser(userData, token);

        // Store for modal handlers
        storedTokenRef.current = token;
        storedRefreshTokenRef.current = getRefreshToken() || '';
        setLoggedInUserName(userData.firstName || 'User');
        setLoggedInUserType(customerType);

        showSuccess('Verified successfully!');
        // A collaborator login only opens workspaces: straight in, or to the picker when there are several.
        if (isCollaboratorType(customerType)) {
          const dest = workspaceDestination((data as { workspaces?: Array<{ workspaceId: string }> }).workspaces);
          if (dest.startsWith('http')) window.location.href = dest; else router.push(dest);
          return;
        }
        if (readPostAuthDestination()) { setTimeout(() => goToPostAuthDestination(), 300); }
        else { setShowPostLoginModal(true); }
      } else {
        setCode('');
        setShakeKey((k) => k + 1);
        const body = (response.data ?? {}) as { message?: string };
        refuse(refusalFrom({ ...body, message: body.message || response.error }, 'Invalid code. Please try again.'));
      }
    } catch (err) {
      setCode('');
      setShakeKey((k) => k + 1);
      setRefusal({ message: err instanceof Error ? err.message : 'An error occurred. Please try again.', errorCode: 'UNKNOWN' });
      showError('An error occurred. Please try again.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }, [canVerify, locked, showPostLoginModal, isOnline, showWarning, showError, showSuccess, loginUser, method, challenge.challengeId, challenge.customerId, refuse]);

  const switchMethod = (next: TwoFactorMethod) => {
    setMethod(next);
    setCode('');
    setRefusal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void doVerify(code);
  };

  const error = !canVerify
    ? 'Invalid verification link. Please log in again.'
    : locked
      ? lockText(lockSeconds)
      : refusal?.message;
  const hint = !locked && refusal ? attemptsText(refusal.attemptsLeft) : undefined;

  // PostLoginModal handlers
  const handleGoToDashboard = () => {
    setShowPostLoginModal(false);
    const dashboardUrl = getDashboardUrlWithToken(loggedInUserType, storedTokenRef.current || undefined, storedRefreshTokenRef.current || undefined);
    if (dashboardUrl && storedTokenRef.current) {
      window.open(dashboardUrl, '_blank');
    } else {
      window.open('/user/photographers', '_blank');
    }
    router.push('/user/photographers');
  };

  const handleKeepExploring = () => {
    setShowPostLoginModal(false);
    router.push('/user/photographers');
  };

  const blocked = loading || locked || !canVerify || code.length !== OTP_LENGTH;

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
            {method === 'EMAIL'
              ? `We sent a 6-digit code to ${maskedEmail ?? 'your email'}. Enter it to sign in.`
              : 'Open your authenticator app and enter the 6-digit code to sign in.'}
          </p>

          {challenge.methods.length > 1 && (
            <div role="tablist" aria-label="Sign-in method" style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: '#f3f4f6', padding: '4px', borderRadius: '10px' }}>
              {challenge.methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={method === m}
                  onClick={() => switchMethod(m)}
                  disabled={loading}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: method === m ? '#083A85' : 'transparent', color: method === m ? '#ffffff' : '#374151' }}
                >
                  {m === 'EMAIL' ? 'Email code' : 'Authenticator app'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <OtpInput
                id="signin-code"
                label="Verification Code"
                value={code}
                onChange={setCode}
                onComplete={doVerify}
                error={error}
                hint={hint}
                busy={loading}
                success={done}
                disabled={locked || !canVerify}
                shakeKey={shakeKey}
                colors={{ border: '#d1d5db', bg: '#ffffff', text: '#000000', muted: '#4b5563' }}
              />
            </div>

            <button
              type="submit"
              disabled={blocked}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#083A85', color: '#ffffff', fontWeight: 600, fontSize: '15px', marginBottom: '16px', opacity: blocked ? 0.6 : 1, cursor: blocked ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            {method === 'EMAIL' && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={resendSeconds > 0 || sending || locked}
                  style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: resendSeconds > 0 || locked ? '#6b7280' : '#083A85', cursor: resendSeconds > 0 || locked ? 'not-allowed' : 'pointer' }}
                >
                  {resendSeconds > 0 ? `Resend code in ${formatCountdown(resendSeconds)}` : 'Resend code'}
                </button>
              </div>
            )}

            {/* Info text */}
            {method === 'TOTP' && (
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
            )}

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
