/**
 * Which flag stands for a currency, and where its artwork is served from (public/flags, bundled so a flag shows
 * without a CDN). One country's currency takes that country's flag, the euro the EU flag, and the two CFA francs, which
 * belong to several countries, take their largest economy (XAF: Cameroon, XOF: Cote d'Ivoire). Artwork: country-flag-icons
 * (MIT). A code that is not listed has no flag and the picker shows the code alone.
 */
export const CURRENCY_FLAG_MAP: Record<string, string> = {
  RWF: 'rw', USD: 'us', EUR: 'eu', KES: 'ke', UGX: 'ug', TZS: 'tz', CDF: 'cd', ETB: 'et', GHS: 'gh', LSL: 'ls',
  MWK: 'mw', MZN: 'mz', NGN: 'ng', SLE: 'sl', ZMW: 'zm', XAF: 'cm', XOF: 'ci', GBP: 'gb', ZAR: 'za', BIF: 'bi',
  MAD: 'ma', EGP: 'eg', BWP: 'bw', DZD: 'dz', TND: 'tn',
  CAD: 'ca', AUD: 'au', NZD: 'nz', CHF: 'ch', SEK: 'se', NOK: 'no', DKK: 'dk', JPY: 'jp', CNY: 'cn', INR: 'in',
  BRL: 'br', MXN: 'mx', AED: 'ae', SAR: 'sa', QAR: 'qa', TRY: 'tr', RUB: 'ru', SGD: 'sg', HKD: 'hk', KRW: 'kr', THB: 'th',
};

/** The lower-case country code for a currency, or null. */
export function currencyFlagCountry(code: string | null | undefined): string | null {
  return CURRENCY_FLAG_MAP[(code ?? '').trim().toUpperCase()] ?? null;
}

/** The URL of the currency's flag, or null when it has none. */
export function currencyFlagSrc(code: string | null | undefined): string | null {
  const c = currencyFlagCountry(code);
  return c ? `/flags/${c}.svg` : null;
}
