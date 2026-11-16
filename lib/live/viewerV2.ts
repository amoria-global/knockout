/**
 * The new livestream viewer layout (".ls-v2") is served behind one switch, decided at the edge (proxy.ts) and handed
 * to the page as the `lv_ui` cookie. Nothing of the new layout applies without it, so with the switch off the viewer is
 * exactly what it was.
 *
 * Server settings, read from the environment only:
 *   LIVESTREAM_V2            off | allowlist | all     (default off)
 *   LIVESTREAM_V2_ALLOWLIST  comma-separated account emails, used when LIVESTREAM_V2=allowlist
 *   LIVESTREAM_V2_KEY        optional QA key. Opening any livestream URL with ?lv2=<key> turns the layout on for that
 *                            browser even with no account, so a guest can be tested. Only honoured while the mode is
 *                            allowlist or all, and not at all when the key is unset.
 *
 * Rollback: set LIVESTREAM_V2=off and restart the service. The cookie is cleared on the next page load.
 *
 * The decision reads the email from the session token without verifying it. That is enough for a cosmetic switch: the
 * backend still checks the token and every permission on each call, so a forged cookie or token shows a different
 * layout and nothing more.
 */

export const LIVE_V2_COOKIE = 'lv_ui';
export const LIVE_V2_VALUE = 'v2';
export const LIVE_V2_ROOT_CLASS = 'ls-v2';

export type LiveV2Mode = 'off' | 'allowlist' | 'all';

export function parseMode(raw: string | undefined | null): LiveV2Mode {
  const v = (raw || '').trim().toLowerCase();
  return v === 'allowlist' || v === 'all' ? v : 'off';
}

export function parseAllowlist(raw: string | undefined | null): Set<string> {
  return new Set(
    (raw || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes('@')),
  );
}

/** The `sub` (account email) of a JWT, unverified. Null for anything that is not a readable token. */
export function emailFromToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof json.sub === 'string' && json.sub.includes('@') ? json.sub.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

/** The livestream viewer pages, current and legacy URLs. */
export function isLivestreamPath(pathname: string): boolean {
  return /^\/user\/events\/(livestream(\/|$)|live-stream(\/|$))/.test(pathname);
}

/**
 * Whether this visitor gets the new layout. `all` is everyone, `allowlist` is the listed accounts plus any browser that
 * presented the right QA key, anything else is off.
 */
export function liveV2EnabledFor(
  mode: LiveV2Mode,
  allowlist: Set<string>,
  email: string | null,
  keyOk: boolean,
): boolean {
  if (mode === 'all') return true;
  if (mode === 'allowlist') return keyOk || (!!email && allowlist.has(email));
  return false;
}

/** True when a configured QA key was presented, constant-shape compare. Unset key never matches. */
export function qaKeyMatches(configured: string | undefined | null, presented: string | undefined | null): boolean {
  const a = (configured || '').trim();
  const b = (presented || '').trim();
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
