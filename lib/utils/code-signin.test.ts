import { beforeEach, describe, expect, it } from 'vitest';
import { CODE_SIGNIN_KEY, codeSignInRemembered, rememberCodeSignIn } from './code-signin';

/**
 * "Sign in with an email code" is for invited team members only. The login page offers it only in a browser where a
 * team-member login has already signed in, so nobody takes it for a way to reset a password.
 */
describe('the browser remembers a team-member sign-in', () => {
  beforeEach(() => window.localStorage.clear());

  it('starts without it, and keeps it once set', () => {
    expect(codeSignInRemembered()).toBe(false);
    expect(rememberCodeSignIn()).toBe(true);
    expect(window.localStorage.getItem(CODE_SIGNIN_KEY)).toBe('1');
    expect(codeSignInRemembered()).toBe(true);
  });

  it('is not set by any other value', () => {
    window.localStorage.setItem(CODE_SIGNIN_KEY, '0');
    expect(codeSignInRemembered()).toBe(false);
  });
});
