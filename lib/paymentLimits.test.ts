import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __resetPaymentLimitCache,
  cachedPaymentLimit,
  fetchPaymentLimit,
  parsePaymentLimit,
  priceError,
  priceHint,
  priceStep,
  type PaymentLimit,
} from './paymentLimits';

const usd: PaymentLimit = { currency: 'USD', minimum: '0.08', decimals: 2, wholeNumbersOnly: false };
const rwf: PaymentLimit = { currency: 'RWF', minimum: '100', decimals: 0, wholeNumbersOnly: true };
const ugx: PaymentLimit = { currency: 'UGX', minimum: '289', decimals: 0, wholeNumbersOnly: true };

afterEach(() => {
  __resetPaymentLimitCache();
  vi.unstubAllGlobals();
});

describe('price against the currency minimum', () => {
  it('accepts USD 4 and refuses USD 0.05 with the field message', () => {
    expect(priceError('4', usd)).toBeNull();
    expect(priceError('0.05', usd)).toBe("The minimum price in USD is 0.08. Mobile Money can't process smaller payments.");
  });

  it('judges whole-number currencies in their own unit', () => {
    expect(priceError('100', rwf)).toBeNull();
    expect(priceError('50', rwf)).toContain('The minimum price in RWF is 100.');
    expect(priceError('200', ugx)).toContain('minimum price in UGX is 289');
    expect(priceError('500.5', ugx)).toBe('Prices in UGX must be whole numbers.');
  });

  it('leaves the server to judge when the minimum is unknown', () => {
    expect(priceError('4', null)).toBeNull();
    expect(priceError('abc', null)).toBe('Enter a valid price.');
    expect(priceError('', usd)).toBeNull();
    expect(priceError('0', usd)).toBe('Enter a price above zero.');
    expect(priceError('1.234', usd)).toBe('Enter a valid price.');
  });

  it('shows the minimum as helper text and steps by the currency unit', () => {
    expect(priceHint(usd)).toBe('Minimum USD 0.08');
    expect(priceHint(null)).toBeNull();
    expect(priceStep('USD')).toBe(0.01);
    ['RWF', 'UGX', 'XAF', 'XOF'].forEach((c) => expect(priceStep(c)).toBe(1));
    expect(priceStep('USD', rwf)).toBe(1);
  });
});

describe('fetching', () => {
  it('reads the limit once, caches it, and ignores a failure envelope', async () => {
    const ok = { action: 1, data: { currency: 'USD', minimum: '0.08', decimals: 2, wholeNumbersOnly: false } };
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ok });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchPaymentLimit('usd')).toEqual({ ...usd, rateStale: false });
    await fetchPaymentLimit('USD');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachedPaymentLimit('USD')).toEqual({ ...usd, rateStale: false });

    expect(parsePaymentLimit({ action: 0, message: 'no rate' }, 'KES')).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await fetchPaymentLimit('KES')).toBeNull();
    expect(cachedPaymentLimit('KES')).toBeNull();
  });
});
