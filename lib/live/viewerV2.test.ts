import { describe, expect, it } from 'vitest';
import {
  emailFromToken,
  isLivestreamPath,
  liveV2EnabledFor,
  parseAllowlist,
  parseMode,
  qaKeyMatches,
} from './viewerV2';

const jwt = (sub: unknown) => {
  const body = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `h.${body}.s`;
};

describe('livestream v2 switch', () => {
  it('is off unless the mode says allowlist or all', () => {
    expect(parseMode(undefined)).toBe('off');
    expect(parseMode('')).toBe('off');
    expect(parseMode('maybe')).toBe('off');
    expect(parseMode(' ALL ')).toBe('all');
    expect(parseMode('Allowlist')).toBe('allowlist');
  });

  it('off shows nobody the new layout, even an allowlisted account or a QA key', () => {
    const allow = parseAllowlist('owner@example.test');
    expect(liveV2EnabledFor('off', allow, 'owner@example.test', true)).toBe(false);
  });

  it('allowlist shows only listed accounts, or a browser that presented the QA key', () => {
    const allow = parseAllowlist('Owner@Example.test, qa-one@example.test, not-an-email');
    expect([...allow]).toEqual(['owner@example.test', 'qa-one@example.test']);
    expect(liveV2EnabledFor('allowlist', allow, 'owner@example.test', false)).toBe(true);
    expect(liveV2EnabledFor('allowlist', allow, 'someone@example.test', false)).toBe(false);
    expect(liveV2EnabledFor('allowlist', allow, null, false)).toBe(false);
    expect(liveV2EnabledFor('allowlist', allow, null, true)).toBe(true);
  });

  it('all shows everybody', () => {
    expect(liveV2EnabledFor('all', new Set(), null, false)).toBe(true);
  });

  it('reads the account email from a session token and nothing else', () => {
    expect(emailFromToken(jwt('Owner@Example.test'))).toBe('owner@example.test');
    expect(emailFromToken(jwt(42))).toBeNull();
    expect(emailFromToken(jwt('no-at-sign'))).toBeNull();
    expect(emailFromToken('garbage')).toBeNull();
    expect(emailFromToken(undefined)).toBeNull();
  });

  it('an unset QA key never matches, and a wrong or different-length key does not', () => {
    expect(qaKeyMatches(undefined, '')).toBe(false);
    expect(qaKeyMatches('', '')).toBe(false);
    expect(qaKeyMatches('secret-key', 'secret-kez')).toBe(false);
    expect(qaKeyMatches('secret-key', 'secret')).toBe(false);
    expect(qaKeyMatches('secret-key', 'secret-key')).toBe(true);
  });

  it('applies only to the livestream viewer pages, current and legacy', () => {
    expect(isLivestreamPath('/user/events/livestream/violin-conference')).toBe(true);
    expect(isLivestreamPath('/user/events/livestream/violin-conference/abc')).toBe(true);
    expect(isLivestreamPath('/user/events/live-stream')).toBe(true);
    expect(isLivestreamPath('/user/events/view-event')).toBe(false);
    expect(isLivestreamPath('/user/photographers/book-now')).toBe(false);
  });
});
