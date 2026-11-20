import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The emailed-code page says who it is for and gives everyone else a way to the password reset. */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock('@/app/providers/AuthProvider', () => ({ useAuth: () => ({ login: vi.fn() }) }));
vi.mock('@/app/components/OtpInput', () => ({ default: () => null }));
vi.mock('@/lib/APIs/auth/workspace/route', () => ({ sendLoginCode: vi.fn(), verifyLoginCode: vi.fn() }));

import LoginCode from './login-code';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('login with an emailed code', () => {
  it('says it is for invited team members and links to "Forgot your password?"', async () => {
    await act(async () => {
      root.render(<LoginCode />);
    });
    expect(host.textContent).toContain('Sign in with an email code');
    expect(host.textContent).toContain('For invited team members');
    expect(host.textContent).toContain('only for invited team members');
    const forgot = [...host.querySelectorAll('a')].find((a) => a.textContent?.includes('Forgot your password?'));
    expect(forgot?.getAttribute('href')).toBe('/user/auth/forgotpswd');
  });
});
