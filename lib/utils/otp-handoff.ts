/**
 * The signup/login → verify-otp handoff.
 *
 * The identity record used to travel as query parameters:
 *   /user/auth/verify-otp?applicantId=…&email=…&customerType=…&firstName=…
 *                        &lastName=…&phone=…
 * which put a real person's email, phone and full name in the address bar,
 * in browser history, and in the Referer of anything the page requested.
 *
 * Only the opaque `applicantId` belongs in the URL — it is the one value the
 * verify screen genuinely needs to survive a refresh or a link. Everything
 * else is handed over out of band, in sessionStorage keyed by that id:
 * same tab, same origin, cleared when the tab closes, and never written to
 * history.
 *
 * Reading is tolerant of the old shape so a verify-otp page already open in
 * someone's tab, or a link they bookmarked, keeps working.
 */

export interface OtpHandoff {
  email?: string;
  customerType?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const KEY = 'otp_handoff';

function storageKey(applicantId: string): string {
  return `${KEY}:${applicantId}`;
}

/** Stash the identity record, then build the URL that carries only the id. */
export function buildVerifyOtpUrl(
  applicantId: string,
  data: OtpHandoff,
  redirectUrl?: string,
): string {
  if (typeof window !== 'undefined' && applicantId) {
    try {
      window.sessionStorage.setItem(storageKey(applicantId), JSON.stringify(data));
    } catch {
      // Private mode, quota, storage disabled — the verify screen falls back
      // to asking, which is better than putting the record in the URL.
    }
  }
  const params = new URLSearchParams();
  params.set('applicantId', applicantId);
  // A redirect target is not personal data, and the verify screen needs it
  // to hand the session back to whatever launched the flow.
  if (redirectUrl) params.set('redirect', redirectUrl);
  return `/user/auth/verify-otp?${params.toString()}`;
}

/**
 * Read the identity record for this applicant. `fromQuery` is the legacy
 * shape, accepted so links minted before this change still work.
 */
export function readOtpHandoff(
  applicantId: string,
  fromQuery?: OtpHandoff,
): OtpHandoff {
  let stored: OtpHandoff = {};
  if (typeof window !== 'undefined' && applicantId) {
    try {
      const raw = window.sessionStorage.getItem(storageKey(applicantId));
      if (raw) stored = JSON.parse(raw) as OtpHandoff;
    } catch {
      stored = {};
    }
  }
  // Stored wins; the query is only a fallback for the legacy shape.
  return {
    email: stored.email || fromQuery?.email,
    customerType: stored.customerType || fromQuery?.customerType,
    firstName: stored.firstName || fromQuery?.firstName,
    lastName: stored.lastName || fromQuery?.lastName,
    phone: stored.phone || fromQuery?.phone,
  };
}

/**
 * Strip the legacy personal parameters from the address bar, keeping
 * `applicantId` and `redirect`. Same one-shot replaceState the album links
 * use: the values have already been read into state, and leaving them there
 * keeps them in history and in outbound referrers.
 */
export function scrubOtpUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const personal = ['email', 'firstName', 'lastName', 'phone', 'customerType'];
  if (!personal.some((p) => url.searchParams.has(p))) return;
  personal.forEach((p) => url.searchParams.delete(p));
  window.history.replaceState(null, '', url.toString());
}
