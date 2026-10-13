import { describe, expect, it } from 'vitest';
import { canConvert, hasUsableRate, resolveDonationRate } from './displayRates';

const rates = { RWF: { rateToUsd: 1300 }, KES: { rateToUsd: '130' }, EUR: { rateToUsd: 0 }, UGX: {} };

describe('when a rate is usable', () => {
  it('USD always is; others need a finite number above zero', () => {
    expect(hasUsableRate(null, 'USD')).toBe(true);
    expect(hasUsableRate(rates, 'RWF')).toBe(true);
    for (const code of ['KES', 'EUR', 'UGX', 'GBP']) expect(hasUsableRate(rates, code)).toBe(false); // text, zero, missing, absent
    expect(hasUsableRate(null, 'RWF')).toBe(false);
    expect(hasUsableRate({ RWF: { rateToUsd: NaN } }, 'RWF')).toBe(false);
    expect(hasUsableRate({ RWF: { rateToUsd: -3 } }, 'RWF')).toBe(false);
  });
});

describe('when an amount may change currency', () => {
  it('same currency needs no rate at all', () => {
    expect(canConvert('RWF', 'RWF', null)).toBe(true);
  });
  it('needs a usable rate on both sides', () => {
    expect(canConvert('USD', 'RWF', rates)).toBe(true);
    expect(canConvert('RWF', 'USD', rates)).toBe(true);
    expect(canConvert('RWF', 'EUR', rates)).toBe(false); // EUR rate is zero: not treated as 1
    expect(canConvert('RWF', 'GBP', rates)).toBe(false); // absent from the table: not treated as 1
    expect(canConvert('RWF', 'USD', null)).toBe(false);
  });
});

describe('donation tier rate', () => {
  it('is 1 only when the tier currency is the payment currency', () => {
    expect(resolveDonationRate('RWF', 'RWF', null)).toBe(1);
  });
  it('is the backend rate otherwise', () => {
    expect(resolveDonationRate('USD', 'RWF', 1 / 1300)).toBeCloseTo(1 / 1300, 12);
  });
  it('is unknown, not 1, when the backend gave none, so tiers are hidden instead of relabelled', () => {
    expect(resolveDonationRate('USD', 'RWF', null)).toBeNull();
    expect(resolveDonationRate('USD', 'RWF', 0)).toBeNull();
    expect(resolveDonationRate('USD', 'RWF', NaN)).toBeNull();
    expect(resolveDonationRate('USD', 'RWF', -1)).toBeNull();
  });
});
