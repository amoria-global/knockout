/**
 * E.164 phone formatter that mirrors the backend's
 * PawapayApiService.formatPhone(phone, iso2Country) so the UI shows
 * what will actually be sent to the gateway.
 *
 * Returns the dial code + national digits (no `+`). For unknown ISO-2
 * codes falls back to "250" (Rwanda) — same as the backend default,
 * preserving pre-multi-country behavior.
 */

export const DIAL_CODES: Record<string, string> = {
  RW: '250',
  KE: '254',
  UG: '256',
  TZ: '255',
  ZM: '260',
  GH: '233',
  NG: '234',
  MW: '265',
  BJ: '229',
  BF: '226',
  CM: '237',
  CD: '243',
  CG: '242',
  CI: '225',
  ET: '251',
  GA: '241',
  LS: '266',
  MZ: '258',
  SN: '221',
  SL: '232',
  ZW: '263',
};

export function dialCodeFor(iso2: string | null | undefined): string {
  if (!iso2) return '250';
  return DIAL_CODES[iso2.toUpperCase().trim()] ?? '250';
}

export function formatPhoneE164(phone: string, iso2: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  const dial = dialCodeFor(iso2);
  if (cleaned.startsWith(dial)) return cleaned;
  if (cleaned.startsWith('0')) return dial + cleaned.slice(1);
  return dial + cleaned;
}

/**
 * Quick validity check. Mobile-money numbers are typically 9 digits
 * after the country code; we accept 8–12 to be generous (Nigeria's
 * are 10, etc.). Not strict — server is authoritative.
 */
export function isPlausibleMobile(phone: string, iso2: string | null | undefined): boolean {
  const e164 = formatPhoneE164(phone, iso2);
  const dial = dialCodeFor(iso2);
  const national = e164.startsWith(dial) ? e164.slice(dial.length) : e164;
  return national.length >= 8 && national.length <= 12;
}

/**
 * A human placeholder for the phone input, country-aware so it never
 * shows a stale Rwanda "078…" example after the user switches country.
 * Most PawaPay markets enter the national number with a leading 0 and a
 * 9-digit body; a few (Kenya, etc.) drop the leading 0. We key the
 * common ones explicitly and fall back to a dial-code hint otherwise.
 */
const PHONE_HINTS: Record<string, string> = {
  RW: 'e.g. 078XXXXXXX',
  KE: 'e.g. 7XXXXXXXX',
  UG: 'e.g. 07XXXXXXXX',
  TZ: 'e.g. 06XXXXXXXX',
  ZM: 'e.g. 09XXXXXXXX',
  GH: 'e.g. 02XXXXXXXX',
  NG: 'e.g. 080XXXXXXXX',
  MW: 'e.g. 08XXXXXXXX',
  CI: 'e.g. 07XXXXXXXX',
  SN: 'e.g. 7XXXXXXXX',
  CM: 'e.g. 06XXXXXXXX',
  CD: 'e.g. 08XXXXXXXXX',
};

export function phoneHintForCountry(iso2: string | null | undefined): string {
  const code = (iso2 || '').toUpperCase().trim();
  if (PHONE_HINTS[code]) return PHONE_HINTS[code];
  return `+${dialCodeFor(iso2)} 7XXXXXXXX`;
}
