'use client';

import { useCallback, useState } from 'react';
import { attemptsText, lockText, refusalFrom, type CodeRefusal } from '@/lib/otp';
import { useCountdown } from '@/lib/useCountdown';

/**
 * What an inline code step shows after the server refused a code: its message, the tries it says are left, a lock
 * with a live countdown, and a shake to run on the field. The server decides everything; this only holds its answer.
 */
export function useOtpRefusal() {
  const [refusal, setRefusal] = useState<CodeRefusal | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const lockSeconds = useCountdown(lockedUntil);
  const locked = lockSeconds > 0;

  /** Take a refused answer (the API client puts the body in `data`); returns what was understood. */
  const record = useCallback((res: { data?: unknown; error?: string }, fallback: string): CodeRefusal => {
    const body = (res.data ?? {}) as { message?: string };
    const r = refusalFrom({ ...(body as object), message: body.message || res.error }, fallback);
    setRefusal(r);
    setShakeKey((k) => k + 1);
    if (r.errorCode === 'LOCKED' && r.retryAfterSeconds) setLockedUntil(Date.now() + r.retryAfterSeconds * 1000);
    return r;
  }, []);

  const clear = useCallback(() => setRefusal(null), []);

  return {
    error: locked ? lockText(lockSeconds) : refusal?.message,
    hint: !locked && refusal ? attemptsText(refusal.attemptsLeft) : undefined,
    locked,
    shakeKey,
    record,
    clear,
  };
}
