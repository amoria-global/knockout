/**
 * Where a visitor was headed before they were sent to sign in.
 *
 * The dashboard bounces a signed-out visitor to `/user/auth/login?returnUrl=<the
 * dashboard page they asked for>`; a shared collaboration link is the case that
 * matters most. That page can only be reached by finishing sign-in or sign-up,
 * and both of those hop between screens (login <-> signup toggle, verify-otp,
 * verify-totp, the profile wizard) that rebuild the query string. So the
 * destination is captured once, validated, and parked in sessionStorage; every
 * screen that ends a sign-in asks here instead of reading the URL.
 *
 * Only an https URL on one of our own hosts is accepted. Anything else is
 * dropped, so `?returnUrl=https://evil.example` cannot become an open redirect.
 * No token travels in the URL: the amoria_auth cookie is scoped to
 * `.connekyt.com` and rides along to the dashboard on its own.
 */

const KEY = 'post_auth_destination';
// A destination older than this belongs to an abandoned attempt, not this sign-in.
const TTL_MS = 30 * 60 * 1000;

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(['connekyt.com', 'www.connekyt.com', 'dashboard.connekyt.com']);
  try {
    hosts.add(new URL(process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com').host);
  } catch {
    // keep the defaults
  }
  return hosts;
}

/** The URL if it is safe to send a signed-in user to, otherwise null. */
export function sanitizePostAuthDestination(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const local = /^(localhost|127\.0\.0\.1)$/.test(u.hostname);
    if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) return null;
    if (!local && !allowedHosts().has(u.host)) return null;
    // A destination that is itself an auth page would loop the user straight back.
    if (u.pathname.startsWith('/user/auth/')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function rememberPostAuthDestination(url: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ url, at: Date.now() }));
  } catch {
    // storage disabled: the URL param still works for the first screen
  }
}

export function readPostAuthDestination(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { url, at } = JSON.parse(raw) as { url?: string; at?: number };
    if (!url || !at || Date.now() - at > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return sanitizePostAuthDestination(url);
  } catch {
    return null;
  }
}

export function clearPostAuthDestination(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

/** Capture `?returnUrl=` when present, else fall back to what an earlier screen stored. */
export function resolvePostAuthDestination(returnUrlParam: string | null): string | null {
  const fromUrl = sanitizePostAuthDestination(returnUrlParam);
  if (fromUrl) {
    rememberPostAuthDestination(fromUrl);
    return fromUrl;
  }
  return readPostAuthDestination();
}

/** Navigate to the saved destination. Returns false when there is none. */
export function goToPostAuthDestination(): boolean {
  const dest = readPostAuthDestination();
  if (!dest) return false;
  clearPostAuthDestination();
  window.location.href = dest;
  return true;
}
