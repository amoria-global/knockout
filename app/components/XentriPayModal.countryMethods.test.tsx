import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// What the country lookup and the options lookup answer, set per test.
type Op = { id: string; name: string; iconKey: string };
let country: string | null = 'RW';
let countryLoading = false;
let options: { operators: Op[]; supportsCard: boolean; currency: string } | null = null;
let supported = false;

vi.mock('@/lib/APIs/payments/xentripay', () => ({
  initiateXentriPayTip: vi.fn(), initiateXentriPayStreaming: vi.fn(), initiateXentriPayDonation: vi.fn(),
  initiateXentriPayPhotoPurchase: vi.fn(), initiateXentriPayAlbumPurchase: vi.fn(),
  initiateAnonymousStreamingPayment: vi.fn(), checkAnonymousPaymentStatus: vi.fn(),
  initiateXentriPayment: vi.fn(), pollXentriPayStatus: vi.fn(() => () => {}),
}));
vi.mock('@/lib/api/config', () => ({ API_ENDPOINTS: { PUBLIC: { DONATION_TIERS: '/tiers' } } }));
vi.mock('./PaymentCurrencyPreview', () => ({
  default: () => null,
  useLiveRates: () => ({ format: (v: number, from: string) => `${v} ${from}` }),
}));
vi.mock('@/app/hooks/useGeoPaymentStatus', () => ({
  useGeoPaymentStatus: () => ({ loading: false, blocked: false, disableMobileMoney: false }),
}));
vi.mock('./DonationPromptModal', () => ({ default: () => null }));
vi.mock('@/lib/payments/usePaymentCountry', () => ({
  usePaymentCountry: () => ({ country, setCountry: vi.fn(), loading: countryLoading }),
}));
vi.mock('@/lib/payments/usePaymentOptions', () => ({
  usePaymentOptions: () => ({ options, supported, loading: false }),
}));
vi.mock('./payments/CountryPicker', () => ({ CountryPicker: () => null }));
vi.mock('./payments/PaymentMethodChooser', () => ({
  PaymentMethodChooser: (p: { methods: { id: string; name: string }[]; onSelect: (id: string) => void }) => (
    <div>{p.methods.map((m) => <button key={m.id} data-testid={`method-${m.id}`} onClick={() => p.onSelect(m.id)}>{m.name}</button>)}</div>
  ),
}));
vi.mock('./phone/InternationalPhoneInput', () => ({ default: () => null }));

import XentriPayModal from './XentriPayModal';

/**
 * The REAL XentriPayModal over FAKE country and options lookups, once per market.
 * Checks what a buyer is offered. Cards stay; Rwanda's MTN and Airtel never appear
 * unless the backend returned them for the buyer's country.
 */
let container: HTMLDivElement;
let root: Root;

const ids = () =>
  Array.from(container.querySelectorAll('[data-testid^="method-"]')).map((b) => b.getAttribute('data-testid'));
const text = () => container.textContent ?? '';

async function open() {
  await act(async () => {
    root.render(
      <XentriPayModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} amount={1000} currencyCode="USD"
        currencyId="cur-1" paymentType="booking" declarationId="decl-1" />,
    );
  });
}

beforeEach(() => {
  country = 'RW';
  countryLoading = false;
  options = null;
  supported = false;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe('payment methods by buyer country', () => {
  it('Rwanda: the backend operators and the card', async () => {
    options = {
      operators: [
        { id: 'MTN', name: 'MTN Mobile Money', iconKey: 'mtn' },
        { id: 'AIRTEL', name: 'Airtel Money', iconKey: 'airtel' },
      ],
      supportsCard: true,
      currency: 'RWF',
    };
    supported = true;
    await open();
    expect(ids()).toEqual(['method-mtn', 'method-airtel', 'method-card']);
  });

  it('United States (no mobile-money coverage): card only, with a plain explanation', async () => {
    country = 'US';
    await open();
    expect(ids()).toEqual(['method-card']);
    expect(text()).toContain('Mobile money is not available in');
  });

  it('country not detected: card only, and Rwanda is not assumed', async () => {
    country = null;
    await open();
    expect(ids()).toEqual(['method-card']);
    expect(text()).toContain('could not confirm your country');
  });

  it('options still loading: card only, no MTN or Airtel flash', async () => {
    country = 'RW';
    countryLoading = true;
    await open();
    expect(ids()).toEqual(['method-card']);
  });

  it('another supported market shows its own operators, not Rwanda\'s', async () => {
    country = 'KE';
    options = { operators: [{ id: 'MPESA', name: 'M-Pesa', iconKey: 'mpesa' }], supportsCard: true, currency: 'KES' };
    supported = true;
    await open();
    expect(ids()).toEqual(['method-mpesa', 'method-card']);
  });
});
