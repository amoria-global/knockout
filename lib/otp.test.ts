import { describe, expect, it } from 'vitest';
import {
  attemptsText,
  cleanOtp,
  formatCountdown,
  groupKey,
  localDeadline,
  lockText,
  refusalFrom,
  secondsLeft,
  sentFrom,
  serverWait,
} from './otp';

/**
 * The server decides everything about a code. These helpers only carry its numbers to the screen,
 * so the tests pin that what the server says is what the person sees.
 */
describe('cleanOtp', () => {
  it.each([
    ['123 456', '123456'],
    ['123-456', '123456'],
    [' 12 34-56 ', '123456'],
    ['12a3b4', '1234'],
    ['1234567890', '123456'],
    ['', ''],
  ])('%j becomes %j', (raw, expected) => {
    expect(cleanOtp(raw)).toBe(expected);
  });
});

describe('refusalFrom', () => {
  it('keeps the server numbers and a known code', () => {
    expect(refusalFrom({ message: 'Wrong', errorCode: 'WRONG_CODE', attemptsLeft: 2 }, 'x')).toMatchObject({
      errorCode: 'WRONG_CODE', attemptsLeft: 2, message: 'Wrong',
    });
  });
  it('carries a lock with its wait', () => {
    expect(refusalFrom({ errorCode: 'LOCKED', retryAfterSeconds: 900 }, 'x')).toMatchObject({ errorCode: 'LOCKED', retryAfterSeconds: 900 });
  });
  it('falls back to UNKNOWN and the fallback text for an answer it does not know', () => {
    expect(refusalFrom({ errorCode: 'NEW_THING' }, 'Try again')).toMatchObject({ errorCode: 'UNKNOWN', message: 'Try again' });
    expect(refusalFrom(null, 'Try again').message).toBe('Try again');
  });
});

describe('sentFrom', () => {
  const data = { maskedEmail: 'jo•••@mail.com', expiresAt: '2026-11-04T10:05:00Z', resendAvailableAt: '2026-11-04T10:03:00Z', serverTime: '2026-11-04T10:00:00Z' };
  it('returns the timers of a sent code', () => {
    expect(sentFrom({ action: 1, data }, 'x')).toEqual({ sent: data });
  });
  it('returns the refusal, with its wait, when the server says no', () => {
    expect(sentFrom({ action: 0, errorCode: 'RATE_LIMITED', retryAfterSeconds: 480, message: 'Slow down' }, 'x')).toEqual({
      refused: expect.objectContaining({ errorCode: 'RATE_LIMITED', retryAfterSeconds: 480 }),
    });
  });
  it('does not invent timers for a success that has none', () => {
    expect('refused' in sentFrom({ action: 1, data: { expiresAt: data.expiresAt } }, 'x')).toBe(true);
  });
});

describe('server clock timers', () => {
  it('counts on the server clock when the device clock is wrong', () => {
    const deviceNow = Date.parse('2026-11-04T09:00:00Z'); // the server says 10:00
    const deadline = localDeadline('2026-11-04T10:03:00Z', '2026-11-04T10:00:00Z', deviceNow);
    expect(secondsLeft(deadline, deviceNow)).toBe(180);
    expect(secondsLeft(deadline, deviceNow + 60_000)).toBe(120);
  });
  it('never goes below zero and has no timer for null', () => {
    expect(secondsLeft(Date.now() - 5000)).toBe(0);
    expect(secondsLeft(null)).toBe(0);
  });
  it('serverWait reads a send answer and falls back to the 180 second gap', () => {
    const now = Date.parse('2026-11-04T10:00:00Z');
    expect(serverWait({ resendAvailableAt: '2026-11-04T10:03:00Z', serverTime: '2026-11-04T10:00:00Z' }, now)).toBe(180);
    expect(serverWait({ resendAvailableAt: '2026-11-04T10:01:30Z', serverTime: '2026-11-04T10:00:00Z' }, now)).toBe(90);
    expect(serverWait({}, now)).toBe(180);
    expect(serverWait(undefined, now)).toBe(180);
  });
});

describe('text', () => {
  it.each([[180, '3:00'], [90, '1:30'], [5, '0:05'], [0, '0:00'], [-3, '0:00']])('%i seconds reads %s', (s, t) => {
    expect(formatCountdown(s)).toBe(t);
  });
  it('groups the setup key in fours', () => {
    expect(groupKey('ABCDEFGHIJKLMNOP')).toBe('ABCD EFGH IJKL MNOP');
    expect(groupKey('abcd efgh ij')).toBe('abcd efgh ij');
  });
  it('words attempts left and the lock', () => {
    expect(attemptsText(1)).toBe('1 attempt left');
    expect(attemptsText(2)).toBe('2 attempts left');
    expect(attemptsText(undefined)).toBeUndefined();
    expect(lockText(900)).toBe('Too many wrong codes. Try again in 15:00.');
  });
});
