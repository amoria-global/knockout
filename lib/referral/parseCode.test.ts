import { describe, expect, it } from 'vitest';
import { parseReferralCode } from './parseCode';

describe('parseReferralCode', () => {
  it('accepts a bare code in any case with spaces', () => {
    expect(parseReferralCode(' abcd2345 ')).toBe('ABCD2345');
  });
  it('extracts the code from a full link', () => {
    expect(parseReferralCode('https://connekyt.com/join?ref=ABCD2345')).toBe('ABCD2345');
    expect(parseReferralCode('connekyt.com/join?ref=abcd2345&utm=x')).toBe('ABCD2345');
  });
  it('rejects ambiguous characters, wrong length and empty input', () => {
    expect(parseReferralCode('ABCD0OI1')).toBeNull();
    expect(parseReferralCode('ABC')).toBeNull();
    expect(parseReferralCode('')).toBeNull();
    expect(parseReferralCode(null)).toBeNull();
  });
});
