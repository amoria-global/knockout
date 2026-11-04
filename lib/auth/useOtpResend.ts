'use client';

import { useCallback, useEffect, useState } from 'react';
import { OTP_RESEND_COOLDOWN_SECONDS, requestOtpResend } from './otp-resend';
import { secondsLeft } from '@/lib/otp';

/**
 * Resend state for an inline OTP step. Call `markSent()` whenever the backend
 * has just emailed a code (signup, unverified login) so the wait starts from
 * that email, then wire `resend` to the "Resend code" button. The wait comes from
 * the server's timestamps when it sends them, and from its 3 minute gap otherwise.
 */
export function useOtpResend() {
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const left = secondsLeft(resendAt, now);

  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [left]);

  const markSent = useCallback((message = '', deadlineMs?: number) => {
    const t = Date.now();
    setResendAt(deadlineMs ?? t + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    setNow(t);
    setNotice(message);
    setError('');
  }, []);

  const resend = useCallback(async (customerId: string) => {
    if (sending || secondsLeft(resendAt, Date.now()) > 0) return;
    setSending(true);
    setNotice('');
    setError('');
    const result = await requestOtpResend(customerId);
    setSending(false);
    if (result.ok) {
      markSent(result.message, result.resendAt);
    } else {
      setError(result.message);
      // A refusal carries its own wait (too soon, rate limited): hold Resend for it.
      if (result.resendAt) {
        setResendAt(result.resendAt);
        setNow(Date.now());
      }
    }
  }, [sending, resendAt, markSent]);

  const reset = useCallback(() => {
    setResendAt(null);
    setNotice('');
    setError('');
  }, []);

  return { secondsLeft: left, sending, notice, error, markSent, resend, reset };
}
