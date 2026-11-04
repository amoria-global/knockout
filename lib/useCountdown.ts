import { useEffect, useState } from 'react';
import { secondsLeft } from '@/lib/otp';

/**
 * Whole seconds left until a deadline (epoch ms on this device's clock), re-rendering once a second while it
 * runs. Build the deadline from the server's timestamps with `localDeadline`, so a device with the wrong time
 * still counts a lock or a resend wait correctly. `null` means no timer.
 */
export function useCountdown(deadlineMs: number | null): number {
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
