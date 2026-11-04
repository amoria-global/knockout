import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The sign-in code page over a fake server. The fake says what the real one would; the page must show
 * those answers (tries left, lock time, resend wait) and never decide whether a code is right.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let query = '';
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(query),
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock('@/lib/notifications/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), isOnline: true }),
}));
const loginUser = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ useAuth: () => ({ login: loginUser }) }));
vi.mock('@/app/components/PostLoginModal', () => ({ default: () => null }));
vi.mock('@/lib/api/client', () => ({ getRefreshToken: () => '' }));
vi.mock('@/lib/utils/dashboard-url', () => ({ getDashboardUrlWithToken: () => '' }));
vi.mock('@/lib/utils/post-auth-destination', () => ({ readPostAuthDestination: () => null, goToPostAuthDestination: vi.fn() }));
const verifyTotp = vi.fn();
const verifyEmailCode = vi.fn();
const sendEmailCode = vi.fn();
vi.mock('@/lib/APIs/auth/verify-totp/route', () => ({
  verifyTotp: (...a: unknown[]) => verifyTotp(...a),
  verifyEmailCode: (...a: unknown[]) => verifyEmailCode(...a),
  sendEmailCode: (...a: unknown[]) => sendEmailCode(...a),
}));

import VerifyTotpPage from './verify-totp';

const sent = (resendIn = 180) => ({
  success: true,
  data: {
    maskedEmail: 'jo•••@mail.com',
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

async function mount(q: string) {
  query = q;
  await act(async () => {
    root.render(<VerifyTotpPage />);
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

describe('authenticator sign-in', () => {
  it('submits on the sixth digit with the signed challenge and signs in', async () => {
    verifyTotp.mockResolvedValue({ success: true, data: { token: 't', customerId: 'c1', firstName: 'Ada' } });
    await mount('challengeId=p.sig&customerId=c1&methods=TOTP');
    await type('123456');
    expect(verifyTotp).toHaveBeenCalledWith({ challengeId: 'p.sig', customerId: 'c1', code: '123456' });
    expect(loginUser).toHaveBeenCalled();
  });

  it('a wrong code clears the field and shows the attempts the server says are left', async () => {
    verifyTotp.mockResolvedValue({ success: false, error: 'That code is not right.', data: { errorCode: 'WRONG_CODE', attemptsLeft: 2, message: 'That code is not right.' } });
    await mount('challengeId=p.sig&methods=TOTP');
    await type('000000');
    expect(field().value).toBe('');
    expect(host.textContent).toContain('That code is not right.');
    expect(host.textContent).toContain('2 attempts left');
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('a lock shows the remaining time and stops input', async () => {
    verifyTotp.mockResolvedValue({ success: false, data: { errorCode: 'LOCKED', retryAfterSeconds: 900, message: 'Locked' } });
    await mount('challengeId=p.sig&methods=TOTP');
    await type('000000');
    expect(host.textContent).toContain('Try again in 15:00');
    expect(field().disabled).toBe(true);
  });

  it('an expired session goes back to sign-in', async () => {
    verifyTotp.mockResolvedValue({ success: false, data: { errorCode: 'SESSION_EXPIRED', message: 'Session expired' } });
    await mount('challengeId=p.sig&methods=TOTP');
    await type('123456');
    expect(replace).toHaveBeenCalledWith('/user/auth/login');
  });

  it('does not submit twice while the server is checking', async () => {
    let release!: (v: unknown) => void;
    verifyTotp.mockReturnValue(new Promise((r) => { release = r; }));
    await mount('challengeId=p.sig&methods=TOTP');
    await type('123456');
    expect(field().disabled).toBe(true);
    expect(verifyTotp).toHaveBeenCalledTimes(1);
    await act(async () => release({ success: true, data: { token: 't' } }));
  });

  it('shows no method switcher when the account has only the authenticator', async () => {
    await mount('challengeId=p.sig&methods=TOTP');
    expect(host.querySelector('[role="tablist"]')).toBeNull();
  });

  it('an empty link says to sign in again', async () => {
    await mount('');
    expect(host.textContent).toContain('Invalid verification link');
  });
});

describe('email sign-in', () => {
  it('asks for the code once, names the address and holds Resend until the server timer ends', async () => {
    sendEmailCode.mockResolvedValue(sent(180));
    await mount('challengeId=p.sig&methods=TOTP,EMAIL&defaultMethod=EMAIL');
    expect(sendEmailCode).toHaveBeenCalledTimes(1);
    expect(sendEmailCode).toHaveBeenCalledWith('p.sig');
    expect(host.textContent).toContain('jo•••@mail.com');
    expect(host.textContent).toContain('Resend code in 3:00');
    const resend = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.startsWith('Resend code in'));
    expect(resend?.disabled).toBe(true);
  });

  it('verifies through the email endpoint', async () => {
    sendEmailCode.mockResolvedValue(sent());
    verifyEmailCode.mockResolvedValue({ success: true, data: { token: 't' } });
    await mount('challengeId=p.sig&methods=TOTP,EMAIL&defaultMethod=EMAIL');
    await type('123456');
    expect(verifyEmailCode).toHaveBeenCalledWith(expect.objectContaining({ challengeId: 'p.sig', code: '123456' }));
    expect(verifyTotp).not.toHaveBeenCalled();
  });

  it('a rate limit shows the server wait on the Resend button', async () => {
    sendEmailCode.mockResolvedValue({ success: false, error: 'Too many codes', data: { errorCode: 'RATE_LIMITED', retryAfterSeconds: 480, message: 'Too many codes' } });
    await mount('challengeId=p.sig&methods=TOTP,EMAIL&defaultMethod=EMAIL');
    expect(host.textContent).toContain('Too many codes');
    expect(host.textContent).toContain('Resend code in 8:00');
  });

  it('switching to email from the authenticator asks for a code', async () => {
    sendEmailCode.mockResolvedValue(sent());
    await mount('challengeId=p.sig&methods=TOTP,EMAIL&defaultMethod=TOTP');
    expect(sendEmailCode).not.toHaveBeenCalled();
    const tab = Array.from(host.querySelectorAll('[role="tab"]')).find((t) => t.textContent === 'Email code') as HTMLButtonElement;
    await act(async () => tab.click());
    expect(sendEmailCode).toHaveBeenCalledTimes(1);
  });

  it('a lock on the authenticator does not block the email code, and comes back with its tab', async () => {
    sendEmailCode.mockResolvedValue(sent());
    verifyTotp.mockResolvedValue({ success: false, data: { errorCode: 'LOCKED', retryAfterSeconds: 900, message: 'Locked' } });
    await mount('challengeId=p.sig&methods=TOTP,EMAIL&defaultMethod=TOTP');
    await type('000000');
    expect(field().disabled).toBe(true);
    const tab = (label: string) => Array.from(host.querySelectorAll('[role="tab"]')).find((t) => t.textContent === label) as HTMLButtonElement;
    await act(async () => tab('Email code').click());
    expect(field().disabled).toBe(false);
    expect(host.textContent).not.toContain('Too many wrong codes');
    await act(async () => tab('Authenticator app').click());
    expect(field().disabled).toBe(true);
    expect(host.textContent).toContain('Try again in 15:00');
  });
});
