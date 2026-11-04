import { describe, it, expect, vi } from 'vitest';
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  requestOtpResend,
  resendSecondsLeft,
  unverifiedLoginCustomerId,
} from './otp-resend';

/**
 * Regression cover for "I never got my OTP code" on the inline auth steps
 * (booking wizard, live stream, view event).
 *
 * Production proved delivery works: a fresh signup's code landed in 8 seconds,
 * DKIM signed as connekyt.com, and resend delivered too. The users were stuck
 * in the UI instead: an unverified login showed the backend's "a new OTP has
 * been sent" as an error with no code box, and the OTP step had no resend.
 */
vi.mock('@/lib/APIs/auth/resend-otp/route', () => ({ resendOtp: vi.fn() }));

describe('unverifiedLoginCustomerId', () => {
  it('routes the backend unverified-login shape to the OTP step', () => {
    // What /auth/login returns (action 0) for a right password on an unverified account.
    expect(unverifiedLoginCustomerId({ otpVerified: false, customerId: 'abc', accountLocked: false })).toBe('abc');
  });

  it('accepts otpVerified sent as a string', () => {
    expect(unverifiedLoginCustomerId({ otpVerified: 'false', customerId: 'abc' })).toBe('abc');
  });

  it('never routes a locked account around the lock', () => {
    expect(unverifiedLoginCustomerId({ otpVerified: false, customerId: 'abc', accountLocked: true })).toBeNull();
    expect(unverifiedLoginCustomerId({ otpVerified: false, customerId: 'abc', accountLocked: 'true' })).toBeNull();
  });

  it('ignores wrong-password and verified responses', () => {
    // Wrong password: no customerId is leaked, so there is nothing to verify.
    expect(unverifiedLoginCustomerId({ otpVerified: undefined, customerId: null })).toBeNull();
    expect(unverifiedLoginCustomerId({ otpVerified: false, customerId: null })).toBeNull();
    expect(unverifiedLoginCustomerId({ otpVerified: true, customerId: 'abc' })).toBeNull();
    expect(unverifiedLoginCustomerId(undefined)).toBeNull();
  });
});

describe('requestOtpResend', () => {
  it('reports success and tells the user to use the newest code', async () => {
    const send = vi.fn().mockResolvedValue({ success: true, data: { action: 1 } });
    const r = await requestOtpResend('abc', send);
    expect(send).toHaveBeenCalledWith({ customerId: 'abc' });
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/newest code/i);
  });

  it('treats an HTTP 200 carrying action 0 as a failure and surfaces the backend message', async () => {
    const send = vi.fn().mockResolvedValue({ success: false, data: { action: 0, message: 'OTP already verified' } });
    expect(await requestOtpResend('abc', send)).toEqual({ ok: false, message: 'OTP already verified' });
  });

  it('does not call the backend without a customerId', async () => {
    const send = vi.fn();
    const r = await requestOtpResend('', send);
    expect(send).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
  });

  it('turns a network throw into a readable failure', async () => {
    const send = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const r = await requestOtpResend('abc', send);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/connect/i);
  });
});

describe('resendSecondsLeft', () => {
  it('is 180 seconds, the server gap', () => {
    expect(OTP_RESEND_COOLDOWN_SECONDS).toBe(180);
  });

  it('allows a resend when nothing has been sent yet', () => {
    expect(resendSecondsLeft(null, 1_000_000)).toBe(0);
  });

  it('counts down from the last send and then opens up', () => {
    const t = 1_000_000;
    expect(resendSecondsLeft(t, t)).toBe(180);
    expect(resendSecondsLeft(t, t + 10_500)).toBe(170);
    expect(resendSecondsLeft(t, t + 180_000)).toBe(0);
    expect(resendSecondsLeft(t, t + 600_000)).toBe(0);
  });
});

describe('requestOtpResend and the server clock', () => {
  it('returns the deadline the server timers give', async () => {
    const now = Date.now();
    const send = vi.fn().mockResolvedValue({
      success: true,
      data: { expiresAt: new Date(now + 300_000).toISOString(), resendAvailableAt: new Date(now + 180_000).toISOString(), serverTime: new Date(now).toISOString() },
    });
    const r = await requestOtpResend('abc', send);
    expect(r.ok).toBe(true);
    expect(r.resendAt).toBeGreaterThan(now + 170_000);
    expect(r.resendAt).toBeLessThan(now + 190_000);
  });

  it('has no deadline from an older backend, so the hook falls back to the 3 minute gap', async () => {
    const send = vi.fn().mockResolvedValue({ success: true, data: { action: 1 } });
    expect((await requestOtpResend('abc', send)).resendAt).toBeUndefined();
  });

  it('turns a refusal into the server words and its wait', async () => {
    const send = vi.fn().mockResolvedValue({ success: false, error: 'x', data: { errorCode: 'RESEND_TOO_SOON', retryAfterSeconds: 120, message: 'Please wait before asking for another code.' } });
    const before = Date.now();
    const r = await requestOtpResend('abc', send);
    expect(r.ok).toBe(false);
    expect(r.message).toBe('Please wait before asking for another code.');
    expect(r.resendAt).toBeGreaterThanOrEqual(before + 120_000);
  });
});
