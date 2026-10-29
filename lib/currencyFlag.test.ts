import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CURRENCY_FLAG_MAP, currencyFlagCountry, currencyFlagSrc } from './currencyFlag';

describe('currency flags', () => {
  it('has bundled artwork for every currency it maps', () => {
    for (const [code, country] of Object.entries(CURRENCY_FLAG_MAP)) {
      expect(existsSync(path.join(process.cwd(), 'public', 'flags', `${country}.svg`)), code).toBe(true);
    }
  });

  it('covers every currency the platform lists', () => {
    for (const code of ['CDF', 'ETB', 'EUR', 'GHS', 'KES', 'LSL', 'MWK', 'MZN', 'NGN', 'RWF', 'SLE', 'TZS', 'UGX', 'USD', 'XAF', 'XOF', 'ZMW']) {
      expect(currencyFlagCountry(code), code).not.toBeNull();
    }
  });

  it('is case-insensitive, and null for a currency with no flag', () => {
    expect(currencyFlagSrc('rwf')).toBe('/flags/rw.svg');
    expect(currencyFlagSrc('ZZZ')).toBeNull();
    expect(currencyFlagSrc(undefined)).toBeNull();
  });
});
