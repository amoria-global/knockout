import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sanitizePostAuthDestination,
  resolvePostAuthDestination,
  readPostAuthDestination,
  rememberPostAuthDestination,
} from './post-auth-destination';

/**
 * Regression cover for a shared collaboration link losing its destination.
 *
 * The dashboard bounces a signed-out visitor to /user/auth/login?returnUrl=<link>.
 * The login screen only understood `redirect`, so after signing in or signing up
 * the visitor landed on their own dashboard instead of the collaboration page.
 * These pin the two rules that fix it: the link is accepted only when it is ours,
 * and it survives the screens that rebuild the query string.
 */
const LINK = 'https://dashboard.connekyt.com/user/photographer/collaborate/join/Dl-BJR1AHVfgoAYoTKzJyFM9oP0C3WfF';

function stubSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
}

beforeEach(stubSessionStorage);
afterEach(() => vi.unstubAllGlobals());

describe('sanitizePostAuthDestination', () => {
  it('accepts the dashboard collaboration link unchanged', () => {
    expect(sanitizePostAuthDestination(LINK)).toBe(LINK);
  });

  it('rejects foreign hosts, lookalikes, non-https and auth pages', () => {
    expect(sanitizePostAuthDestination('https://evil.example/x')).toBeNull();
    expect(sanitizePostAuthDestination('https://dashboard.connekyt.com.evil.example/x')).toBeNull();
    expect(sanitizePostAuthDestination('http://dashboard.connekyt.com/x')).toBeNull();
    expect(sanitizePostAuthDestination('javascript:alert(1)')).toBeNull();
    expect(sanitizePostAuthDestination('/user/photographer/dashboard')).toBeNull();
    expect(sanitizePostAuthDestination('https://connekyt.com/user/auth/login')).toBeNull();
    expect(sanitizePostAuthDestination(null)).toBeNull();
  });
});

describe('resolvePostAuthDestination', () => {
  it('keeps the link after the URL param is gone (login/signup toggle, OTP hop)', () => {
    expect(resolvePostAuthDestination(LINK)).toBe(LINK);
    expect(resolvePostAuthDestination(null)).toBe(LINK);
    expect(readPostAuthDestination()).toBe(LINK);
  });

  it('does not store an unsafe param', () => {
    expect(resolvePostAuthDestination('https://evil.example/x')).toBeNull();
    expect(readPostAuthDestination()).toBeNull();
  });

  it('forgets a destination left behind by an abandoned attempt', () => {
    vi.useFakeTimers();
    rememberPostAuthDestination(LINK);
    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(readPostAuthDestination()).toBeNull();
    vi.useRealTimers();
  });
});
