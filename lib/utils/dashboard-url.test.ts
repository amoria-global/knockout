import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDashboardUrl } from './dashboard-url';

/**
 * Regression cover for a post-login 404.
 *
 * A user signed in with Google, authenticated successfully, and landed on the
 * landing site's "Page Not Found" - signed in, with no way forward but the nav
 * bar. The cause was this function falling back to an EMPTY base URL, which
 * turns its result into a relative path: `window.open('/user/client/home')`
 * then opens that path on the LANDING origin, which has no such route. The
 * dashboard is a separate deployment and a path without its host can never
 * reach it.
 *
 * Verified against production at the time:
 *   connekyt.com/user/client/home            -> 404
 *   dashboard.connekyt.com/user/client/home  -> 200
 *
 * The rule this pins: whatever the environment, never return something a
 * browser will resolve against the current origin.
 */
const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('getDashboardUrl', () => {
  describe('with NEXT_PUBLIC_DASHBOARD_URL set', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_DASHBOARD_URL = 'https://dashboard.connekyt.com';
    });

    it('routes each role to a path that exists on the dashboard', () => {
      expect(getDashboardUrl('client')).toBe('https://dashboard.connekyt.com/user/client/home');
      expect(getDashboardUrl('photographer')).toBe('https://dashboard.connekyt.com/user/photographer/dashboard');
      expect(getDashboardUrl('event-coordinator')).toBe('https://dashboard.connekyt.com/user/event-coordinator/home');
      // User was merged into Client, so a stale User session lands on the client dashboard.
      expect(getDashboardUrl('user')).toBe('https://dashboard.connekyt.com/user/client/home');
    });

    it('accepts "coordinator" as well as "event-coordinator"', () => {
      // The backend stores Coordinator as Event-coordinator; both spellings
      // reach this function depending on the path.
      expect(getDashboardUrl('coordinator')).toBe(getDashboardUrl('event-coordinator'));
    });

    it('is case-insensitive', () => {
      expect(getDashboardUrl('CLIENT')).toBe(getDashboardUrl('client'));
    });

    it('returns empty for viewer, which has no dashboard', () => {
      // Callers rely on '' to choose their own fallback, so this must stay ''
      // rather than becoming a URL to somewhere that does not exist.
      expect(getDashboardUrl('viewer')).toBe('');
    });
  });

  describe('with NEXT_PUBLIC_DASHBOARD_URL missing — the 404 case', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_DASHBOARD_URL;
    });

    it('still returns an ABSOLUTE url, never a relative path', () => {
      // The whole bug in one assertion. A leading "/" here means the browser
      // resolves it against the landing origin and the user gets a 404.
      for (const role of ['client', 'photographer', 'event-coordinator', 'user']) {
        const url = getDashboardUrl(role);
        expect(url.startsWith('http'), `${role} produced a relative path: ${url}`).toBe(true);
        expect(url.startsWith('/')).toBe(false);
      }
    });

    it('points at the dashboard host, not the landing host', () => {
      expect(new URL(getDashboardUrl('client')).host).toBe('dashboard.connekyt.com');
    });

    it('keeps viewer empty even without the env var', () => {
      expect(getDashboardUrl('viewer')).toBe('');
    });
  });
});
