import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The new-account verification page over a fake server. The fake says what the real one would; the page must show
 * those answers (tries left, lock time, resend wait), send the code as a string, and never decide whether a code is right.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let query = '';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(query) }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/lib/notifications/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), isOnline: true }),
}));
vi.mock('@/lib/api/client', () => ({ getAuthToken: () => '', getRefreshToken: () => '', setAuthToken: vi.fn() }));
vi.mock('@/lib/utils/dashboard-url', () => ({ getDashboardUrlWithToken: () => '' }));
vi.mock('@/lib/utils/post-auth-destination', () => ({ goToPostAuthDestination: vi.fn() }));
vi.mock('@/lib/utils/otp-handoff', () => ({ readOtpHandoff: () => ({}), scrubOtpUrl: vi.fn() }));
vi.mock('@/lib/photographer/persist-profile', () => ({ persistPhotographerProfile: vi.fn() }));
const verifyOtp = vi.fn();
const resendOtp = vi.fn();
vi.mock('@/lib/APIs/auth/verify-otp/route', () => ({ verifyOtp: (...a: unknown[]) => verifyOtp(...a) }));
vi.mock('@/lib/APIs/auth/resend-otp/route', () => ({ resendOtp: (...a: unknown[]) => resendOtp(...a) }));

import VerifyOtpPage from './verify-otp';

const sent = (resendIn = 180) => ({
  success: true,
  data: {
    maskedEmail: 'ad•••@mail.com',
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    resendAvailableAt: new Date(Date.now() + resendIn * 1000).toISOString(),
    serverTime: new Date().toISOString(),
  },
});

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

async function mount(q = 'applicantId=c1&email=ada@mail.com') {
  query = q;
  await act(async () => {
    root.render(<VerifyOtpPage />);
  });
}
const field = () => host.querySelector('input[autocomplete="one-time-code"]') as HTMLInputElement;
async function type(value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setter.call(field(), value);
    field().dispatchEvent(new Event('input', { bubbles: true }));
  });
}
const resendButton = () => Array.from(host.querySelectorAll('button')).find((b) => /Resend/.test(b.textContent ?? '')) as HTMLButtonElement;

describe('signup verification page', () => {
  it('submits on the sixth digit with the code as a string, so a leading zero survives', async () => {
    verifyOtp.mockResolvedValue({ success: true, data: { token: 't' } });
    await mount();
    await type('012345');
    expect(verifyOtp).toHaveBeenCalledWith({ customerId: 'c1', otp: '012345' });
  });

  it('a wrong code clears the field and shows the attempts the server says are left', async () => {
    verifyOtp.mockResolvedValue({ success: false, error: 'That code did not work.', data: { errorCode: 'WRONG_CODE', attemptsLeft: 2, message: 'That code did not work.' } });
    await mount();
    await type('000000');
    expect(field().value).toBe('');
    expect(host.textContent).toContain('That code did not work.');
    expect(host.textContent).toContain('2 attempts left');
  });

  it('a lock shows the remaining time, stops input and blocks Resend', async () => {
    verifyOtp.mockResolvedValue({ success: false, data: { errorCode: 'LOCKED', retryAfterSeconds: 900, message: 'Locked' } });
    await mount();
    await type('000000');
    expect(host.textContent).toContain('Try again in 15:00');
    expect(field().disabled).toBe(true);
    expect(resendButton().disabled).toBe(true);
  });

  it('does not submit twice while the server is checking', async () => {
    let release!: (v: unknown) => void;
    verifyOtp.mockReturnValue(new Promise((r) => { release = r; }));
    await mount();
    await type('123456');
    expect(field().disabled).toBe(true);
    expect(verifyOtp).toHaveBeenCalledTimes(1);
    await act(async () => release({ success: true, data: { token: 't' } }));
  });

  it('an empty link says to sign up again', async () => {
    await mount('');
    expect(host.textContent).toContain('Invalid verification link');
  });
});

describe('resend', () => {
  it('holds Resend for the server gap after a good resend', async () => {
    resendOtp.mockResolvedValue(sent(180));
    await mount();
    await act(async () => resendButton().click());
    expect(resendOtp).toHaveBeenCalledWith({ customerId: 'c1' });
    expect(host.textContent).toContain('Resend code in 3:00');
    expect(resendButton().disabled).toBe(true);
  });

  it('a refused resend shows the server wait', async () => {
    resendOtp.mockResolvedValue({ success: false, error: 'Too many codes.', data: { errorCode: 'RATE_LIMITED', retryAfterSeconds: 480, message: 'Too many codes.' } });
    await mount();
    await act(async () => resendButton().click());
    expect(host.textContent).toContain('Too many codes.');
    expect(host.textContent).toContain('Resend code in 8:00');
  });

  it('falls back to the 3 minute gap when an older backend sends no timers', async () => {
    resendOtp.mockResolvedValue({ success: true, data: { customerId: 'c1' } });
    await mount();
    await act(async () => resendButton().click());
    expect(host.textContent).toContain('Resend code in 3:00');
  });
});
