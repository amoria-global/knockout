/**
 * Sign in with Apple for the browser: Apple's JS SDK in popup mode.
 *
 * Contract with the backend (POST /api/remote/auth/apple, same handler as the
 * mobile app):
 *   - the client generates a raw nonce, hands SHA-256(nonce) to Apple, and
 *     sends the RAW nonce to our server, which hashes it again and compares it
 *     with the identity token's `nonce` claim;
 *   - Apple returns `email` and `name` on the FIRST authorisation only. They
 *     are cached in localStorage per Apple user until the backend has the
 *     account, so a failed first POST does not lose the only copy.
 *
 * Needs an Apple "Services ID" in NEXT_PUBLIC_APPLE_CLIENT_ID whose registered
 * domains include this site and whose return URLs include
 * `${origin}/user/auth/login`. With the variable empty nothing renders.
 */

export const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '';
export const appleConfigured = APPLE_CLIENT_ID.length > 0;

const APPLE_JS_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
const CACHE_PREFIX = 'auth.apple.firstHandshake.';

/** What the login page POSTs (plus customerType / createIfMissing). Nulls are deliberate. */
export type AppleWebCredential = {
  identityToken: string;
  /** Raw nonce; Apple holds its SHA-256 in the token. */
  nonce: string;
  /** `sub` read from the token payload for cache keys and as a hint; the backend verifies the real one. */
  appleUserId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

type FirstHandshakeProfile = Pick<AppleWebCredential, 'email' | 'firstName' | 'lastName'>;

type AppleSignInResponse = {
  authorization: { code: string; id_token: string; state?: string };
  user?: { email?: string; name?: { firstName?: string; lastName?: string } };
};

type AppleIDApi = {
  auth: {
    init(config: {
      clientId: string;
      scope: string;
      redirectURI: string;
      state?: string;
      nonce?: string;
      usePopup?: boolean;
    }): void;
    signIn(): Promise<AppleSignInResponse>;
  };
};

declare global {
  interface Window {
    AppleID?: AppleIDApi;
  }
}

export class AppleSignInCancelled extends Error {
  constructor() {
    super('Apple sign-in was cancelled.');
    this.name = 'AppleSignInCancelled';
  }
}

export function isAppleSignInCancelled(err: unknown): err is AppleSignInCancelled {
  return err instanceof AppleSignInCancelled;
}

let scriptPromise: Promise<AppleIDApi> | null = null;

/** Loads Apple's SDK once, on first use, so the landing pages never pay for it. */
function loadAppleJs(): Promise<AppleIDApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Apple sign-in only runs in the browser.'));
  }
  if (window.AppleID) return Promise.resolve(window.AppleID);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = APPLE_JS_SRC;
      script.async = true;
      script.onload = () => {
        if (window.AppleID) resolve(window.AppleID);
        else reject(new Error('Apple sign-in did not initialise. Please try again.'));
      };
      script.onerror = () => {
        scriptPromise = null; // allow a retry after a transient network failure
        reject(new Error('Could not load Apple sign-in. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Opens Apple's sign-in popup and returns the credential to POST.
 * Throws AppleSignInCancelled when the user closes the popup.
 */
export async function requestAppleCredential(): Promise<AppleWebCredential> {
  if (!appleConfigured) throw new Error('Apple sign-in is not configured on this site.');
  const AppleID = await loadAppleJs();

  const nonce = crypto.randomUUID();
  const state = crypto.randomUUID();
  AppleID.auth.init({
    clientId: APPLE_CLIENT_ID,
    scope: 'name email',
    // Must be one of the Services ID's registered return URLs even in popup mode.
    redirectURI: `${window.location.origin}/user/auth/login`,
    state,
    nonce: await sha256Hex(nonce),
    usePopup: true,
  });

  let response: AppleSignInResponse;
  try {
    response = await AppleID.auth.signIn();
  } catch (err) {
    if (isCancellation(err)) throw new AppleSignInCancelled();
    throw new Error(describeAppleError(err));
  }

  if (response.authorization?.state && response.authorization.state !== state) {
    throw new Error('Apple sign-in response did not match this request. Please try again.');
  }
  const identityToken = response.authorization?.id_token;
  if (!identityToken) throw new Error('Apple did not return an identity token. Please try again.');

  const appleUserId = readSubject(identityToken);
  const profile = rememberFirstHandshake(appleUserId, {
    email: response.user?.email ?? null,
    firstName: response.user?.name?.firstName ?? null,
    lastName: response.user?.name?.lastName ?? null,
  });

  return { identityToken, nonce, appleUserId, ...profile };
}

/** Call once the backend has the account; the cached first-handshake copy is no longer needed. */
export function forgetFirstHandshake(appleUserId: string | null): void {
  if (!appleUserId) return;
  try {
    window.localStorage.removeItem(CACHE_PREFIX + appleUserId);
  } catch {
    /* storage unavailable (private mode); nothing to clear */
  }
}

function rememberFirstHandshake(
  appleUserId: string | null,
  fresh: FirstHandshakeProfile,
): FirstHandshakeProfile {
  if (!appleUserId) return fresh;
  const key = CACHE_PREFIX + appleUserId;
  try {
    if (fresh.email || fresh.firstName || fresh.lastName) {
      window.localStorage.setItem(key, JSON.stringify(fresh));
      return fresh;
    }
    const cached = window.localStorage.getItem(key);
    if (!cached) return fresh;
    const parsed = JSON.parse(cached) as Partial<FirstHandshakeProfile>;
    return {
      email: parsed.email ?? null,
      firstName: parsed.firstName ?? null,
      lastName: parsed.lastName ?? null,
    };
  } catch {
    return fresh;
  }
}

/** Unverified read of the token's `sub`, used only as a cache key and hint. */
function readSubject(identityToken: string): string | null {
  try {
    const payload = identityToken.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const sub = (JSON.parse(json) as { sub?: unknown }).sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function isCancellation(err: unknown): boolean {
  const code = (err as { error?: unknown } | null)?.error;
  return code === 'popup_closed_by_user' || code === 'user_cancelled_authorize';
}

function describeAppleError(err: unknown): string {
  const code = (err as { error?: unknown } | null)?.error;
  if (code === 'popup_blocked_by_browser') {
    return 'Your browser blocked the Apple sign-in window. Allow pop-ups for this site and try again.';
  }
  return typeof code === 'string' ? `Apple sign-in failed (${code}).` : 'Apple sign-in failed. Please try again.';
}
