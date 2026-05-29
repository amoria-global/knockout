/**
 * Maps a PawaPay operator `iconKey` to a /public logo asset, with a
 * graceful fallback so the payment UI never shows a broken image.
 *
 * Shared by XentriPayModal and PaymentMethodPicker so the operator
 * tiles render the same real logos (MoMo, Airtel, M-Pesa, …) instead
 * of a phone emoji. Operators we don't yet ship a brand asset for fall
 * back to a clean generic mobile-money icon (never a 404).
 */

export const GENERIC_OPERATOR_ICON = '/mobile-money.svg';
export const CARD_ICON = '/cards.png';

export function iconForOperator(iconKey: string): string {
  switch ((iconKey || '').toLowerCase()) {
    case 'mtn': return '/mtn.png';
    case 'airtel': return '/airtel.png';
    case 'mpesa': return '/mpesa.png';
    case 'vodafone': return '/vodafone.png';
    case 'airteltigo': return '/airteltigo.png';
    case 'orange': return '/orange.png';
    case 'moov': return '/moov.png';
    case 'wave': return '/wave.png';
    case 'free': return '/free.png';
    case 'tigo': return '/tigo.png';
    case 'zamtel': return '/zamtel.png';
    case 'halotel': return '/halotel.png';
    case 'tnm': return '/tnm.png';
    case 'movitel': return '/movitel.png';
    case 'card': return CARD_ICON;
    default: return GENERIC_OPERATOR_ICON;
  }
}

/**
 * <img onError> handler — swaps a missing operator logo for the generic
 * mobile-money icon exactly once (guards against an infinite loop if the
 * fallback itself were ever missing).
 */
export function handleLogoError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.dataset.fallback === '1') return;
  img.dataset.fallback = '1';
  img.src = GENERIC_OPERATOR_ICON;
}
