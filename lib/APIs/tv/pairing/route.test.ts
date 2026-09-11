import { describe, it, expect } from 'vitest';
import {
  PAIRING_CODE_ALPHABET,
  PAIRING_CODE_LENGTH,
  normalizePairingCode,
  isCompletePairingCode,
} from './route';

/**
 * The first test in this repo (CONN-TEST-2).
 *
 * It guards a CROSS-SYSTEM contract rather than a local detail, which is the
 * class of bug that has actually escaped here: CONN-ONB-1 shipped a mobile
 * client calling an endpoint that did not exist and posting parameters the
 * backend never accepted, and it reached production because nothing checked
 * that a client's assumptions matched the server's.
 *
 * These constants are duplicated from TvPairingService.CODE_ALPHABET and
 * CODE_LENGTH in the backend. If someone changes the alphabet on one side
 * only, users start typing codes their own client silently strips.
 */
describe('pairing code contract', () => {
  it('mirrors the backend alphabet exactly', () => {
    // TvPairingService.java: CODE_ALPHABET
    expect(PAIRING_CODE_ALPHABET).toBe('23456789ABCDEFGHJKLMNPQRSTUVWXYZ');
    expect(PAIRING_CODE_LENGTH).toBe(6);
  });

  it('excludes the glyphs that are unreadable across a room', () => {
    // 0/O and 1/I are indistinguishable on a television at viewing distance,
    // which is the whole reason the backend picked this alphabet.
    for (const c of ['0', 'O', '1', 'I']) {
      expect(PAIRING_CODE_ALPHABET).not.toContain(c);
    }
  });
});

describe('normalizePairingCode', () => {
  it('uppercases what the user typed', () => {
    expect(normalizePairingCode('bgjcjp')).toBe('BGJCJP');
  });

  it('survives a pasted code with spaces or dashes', () => {
    expect(normalizePairingCode('BGJ-CJP')).toBe('BGJCJP');
    expect(normalizePairingCode(' BGJ CJP ')).toBe('BGJCJP');
  });

  it('drops characters the alphabet does not contain', () => {
    // A typed O is not silently turned into a zero - it is removed, because
    // guessing which the user meant would send a code they never saw.
    expect(normalizePairingCode('BGJCJO')).toBe('BGJCJ');
    expect(normalizePairingCode('B1GJCJP')).toBe('BGJCJP');
  });

  it('never returns more than the code length', () => {
    expect(normalizePairingCode('BGJCJPEXTRA')).toHaveLength(PAIRING_CODE_LENGTH);
  });

  it('handles an empty string without throwing', () => {
    expect(normalizePairingCode('')).toBe('');
  });
});

describe('isCompletePairingCode', () => {
  it('is true only at exactly the full length', () => {
    expect(isCompletePairingCode('BGJCJP')).toBe(true);
    expect(isCompletePairingCode('BGJCJ')).toBe(false);
    expect(isCompletePairingCode('')).toBe(false);
  });

  it('judges the normalized form, not the raw input', () => {
    // Six characters typed, but one is not in the alphabet, so it is not a
    // complete code. Returning true here would enable the submit button on
    // something the server will reject.
    expect(isCompletePairingCode('BGJCJO')).toBe(false);
    expect(isCompletePairingCode('BGJ-CJP')).toBe(true);
  });
});
