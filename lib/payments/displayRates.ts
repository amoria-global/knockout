/**
 * Rules for when an amount may be shown or offered in a currency other than the
 * one it is denominated in. Pure TypeScript, no React.
 *
 * A rate the backend did not supply is not "1": reading it as 1 treats 1,000 RWF
 * as 1,000 USD. When a conversion cannot be done from usable rates the caller
 * keeps the amount in its own currency (or offers nothing), never a guess.
 *
 * rateToUsd semantics: "1 USD = X of this currency" (RWF 1300 means 1 USD = 1300 RWF).
 */

export type RateTable = Record<string, { rateToUsd?: unknown } | undefined> | null | undefined;

export function hasUsableRate(rates: RateTable, code: string): boolean {
  if (code === 'USD') return true;
  const r = rates?.[code]?.rateToUsd;
  return typeof r === 'number' && Number.isFinite(r) && r > 0;
}

/** True when `amount` in `from` can be expressed in `to` from usable rates. Same currency needs none. */
export function canConvert(from: string, to: string, rates: RateTable): boolean {
  if (from === to) return true;
  return hasUsableRate(rates, from) && hasUsableRate(rates, to);
}

/**
 * The factor that turns a preset tier (denominated in `baseCurrency`) into
 * `currencyCode`, or null when it is not known. 1 only when the currencies are
 * the same; otherwise it must have come from the backend (`apiRate`).
 */
export function resolveDonationRate(
  currencyCode: string,
  baseCurrency: string,
  apiRate: number | null,
): number | null {
  if (currencyCode === baseCurrency) return 1;
  return typeof apiRate === 'number' && Number.isFinite(apiRate) && apiRate > 0 ? apiRate : null;
}
