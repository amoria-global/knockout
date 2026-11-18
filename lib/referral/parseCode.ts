/**
 * Referral codes are 8 characters from an alphabet without 0, O, 1, I or L. This mirrors the server's
 * parser so the field can validate as the user types. The server stays the source of truth.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function parseReferralCode(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim();
  const ref = s.toLowerCase().indexOf('ref=');
  if (ref >= 0) {
    s = s.slice(ref + 4);
    const amp = s.indexOf('&');
    if (amp >= 0) s = s.slice(0, amp);
  } else if (s.includes('/')) {
    s = s.slice(s.lastIndexOf('/') + 1);
  }
  s = s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (s.length !== 8) return null;
  for (const c of s) if (!ALPHABET.includes(c)) return null;
  return s;
}
