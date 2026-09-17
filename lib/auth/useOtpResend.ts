'use client';

import { useCallback, useEffect, useState } from 'react';
import { requestOtpResend, resendSecondsLeft } from './otp-resend';

/**
 * Resend state for an inline OTP step. Call `markSent()` whenever the backend
 * has just emailed a code (signup, unverified login) so the cooldown starts
 * from that email, then wire `resend` to the "Resend code" button.
 */
export function useOtpResend() {
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const secondsLeft = resendSecondsLeft(sentAt, now);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const markSent = useCallback((message = '') => {
    const t = Date.now();
    setSentAt(t);
    setNow(t);
    setNotice(message);
    setError('');
  }, []);

  const resend = useCallback(async (customerId: string) => {
    if (sending || resendSecondsLeft(sentAt, Date.now()) > 0) return;
    setSending(true);
    setNotice('');
    setError('');
    const result = await requestOtpResend(customerId);
    setSending(false);
    if (result.ok) markSent(result.message);
    else setError(result.message);
  }, [sending, sentAt, markSent]);

  const reset = useCallback(() => {
    setSentAt(null);
    setNotice('');
    setError('');
  }, []);

  return { secondsLeft, sending, notice, error, markSent, resend, reset };
}
