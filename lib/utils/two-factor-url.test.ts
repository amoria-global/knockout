import { describe, expect, it } from 'vitest';
import { buildTotpUrl, readChallenge } from './two-factor-url';

/**
 * The login answer decides which second step the person lands on. The signed challenge and the account's
 * methods ride in the URL; an old link with only a customerId must still open the authenticator step.
 */
const read = (url: string) => {
  const q = new URL(url, 'https://x.test').searchParams;
  return readChallenge((k) => q.get(k));
};

describe('buildTotpUrl', () => {
  it('carries the signed challenge, methods, default and masked email', () => {
    const url = buildTotpUrl({
      customerId: 'c1', challengeId: 'p.sig', twoFactorMethods: ['TOTP', 'EMAIL'], twoFactorDefaultMethod: 'EMAIL', maskedEmail: 'jo•••@mail.com',
    });
    expect(url.startsWith('/user/auth/verify-totp?')).toBe(true);
    expect(read(url)).toEqual({ challengeId: 'p.sig', customerId: 'c1', methods: ['TOTP', 'EMAIL'], defaultMethod: 'EMAIL', maskedEmail: 'jo•••@mail.com' });
  });

  it('drops method names it does not know', () => {
    expect(read(buildTotpUrl({ customerId: 'c1', twoFactorMethods: ['TOTP', 'SMS'] })).methods).toEqual(['TOTP']);
  });

  it('keeps a challenge id with special characters intact', () => {
    expect(read(buildTotpUrl({ challengeId: 'a+b/c=.d_e-f' })).challengeId).toBe('a+b/c=.d_e-f');
  });
});

describe('readChallenge', () => {
  it('treats an old customerId-only link as an authenticator challenge', () => {
    expect(read('/user/auth/verify-totp?customerId=c1')).toEqual({ challengeId: '', customerId: 'c1', methods: ['TOTP'], defaultMethod: 'TOTP', maskedEmail: undefined });
  });

  it('ignores a default method the account does not have', () => {
    expect(read('/x?methods=TOTP&defaultMethod=EMAIL').defaultMethod).toBe('TOTP');
  });

  it('reads an empty link as nothing to verify', () => {
    const c = read('/x');
    expect(c.challengeId).toBe('');
    expect(c.customerId).toBe('');
  });
});
