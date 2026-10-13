import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// ---- the payment client: the only thing faked is what the backend would answer ----
type PollCallbacks = { onSuccess: (d: unknown) => void; onFailure: (d: unknown) => void; onError: (m: string) => void };
let polled: { refid: string; callbacks: PollCallbacks; usePublic: boolean; grace: number } | null = null;
const stopPolling = vi.fn();
const initiate = vi.fn();

vi.mock('@/lib/APIs/payments/xentripay', () => ({
  initiateXentriPayTip: vi.fn(), initiateXentriPayStreaming: vi.fn(), initiateXentriPayDonation: vi.fn(),
  initiateXentriPayPhotoPurchase: vi.fn(), initiateXentriPayAlbumPurchase: vi.fn(),
  initiateAnonymousStreamingPayment: vi.fn(), checkAnonymousPaymentStatus: vi.fn(),
  initiateXentriPayment: (...a: unknown[]) => initiate(...a),
  pollXentriPayStatus: (refid: string, callbacks: PollCallbacks, _i: number, _m: number, usePublic: boolean, grace: number) => {
    polled = { refid, callbacks, usePublic, grace };
    return stopPolling;
  },
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
vi.mock('@/lib/payments/usePaymentCountry', () => ({ usePaymentCountry: () => ({ country: 'RW', setCountry: vi.fn() }) }));
vi.mock('@/lib/payments/usePaymentOptions', () => ({
  usePaymentOptions: () => ({
    options: { operators: [{ id: 'MTN', name: 'MTN MoMo', iconKey: 'mtn' }], supportsCard: false, currency: 'RWF' },
    supported: true, loading: false,
  }),
}));
vi.mock('./payments/CountryPicker', () => ({ CountryPicker: () => null }));
vi.mock('./payments/PaymentMethodChooser', () => ({
  PaymentMethodChooser: (p: { methods: { id: string; name: string }[]; onSelect: (id: string) => void }) => (
    <div>{p.methods.map((m) => <button key={m.id} data-testid={`method-${m.id}`} onClick={() => p.onSelect(m.id)}>{m.name}</button>)}</div>
  ),
}));
vi.mock('./phone/InternationalPhoneInput', () => ({
  default: (p: { onChange: (v: unknown) => void }) => (
    <button data-testid="phone" onClick={() => p.onChange({ isValid: true, digits: '250780000001' })}>enter phone</button>
  ),
}));

import XentriPayModal from './XentriPayModal';

/**
 * The REAL XentriPayModal rendered in happy-dom (react-dom, not a real browser), with the payment client
 * replaced by a stub that records the poller callbacks so each provider outcome can be delivered by hand.
 * It checks what the buyer is TOLD and OFFERED for success, declined, unknown (timeout), held (reported
 * pending, then timed out) and a start that fails. The poller's own decisions are tested in
 * lib/APIs/payments/xentripay.poll.test.ts. Synthetic references and amounts; no network.
 */
let container: HTMLDivElement;
let root: Root;
const onSuccess = vi.fn();
const onClose = vi.fn();
const onError = vi.fn();

const text = () => container.textContent ?? '';
const byText = (t: string) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(t)) as HTMLButtonElement | undefined;

async function openAndPay() {
  await act(async () => {
    root.render(
      <XentriPayModal isOpen onClose={onClose} onSuccess={onSuccess} onError={onError} amount={1000} currencyCode="RWF"
        currencyId="cur-1" paymentType="booking" declarationId="decl-1" />,
    );
  });
  await act(async () => { (container.querySelector('[data-testid="method-mtn"]') as HTMLElement).click(); });
  await act(async () => { (container.querySelector('[data-testid="phone"]') as HTMLElement).click(); });
  await act(async () => { byText('Pay ')!.click(); });
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => {
  polled = null;
  stopPolling.mockReset(); initiate.mockReset(); onSuccess.mockReset(); onClose.mockReset(); onError.mockReset();
  initiate.mockResolvedValue({ success: true, data: { refid: 'REF-1', status: 'PENDING' } });
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe('after the buyer pays by mobile money', () => {
  it('starts polling the status and shows nothing as paid yet', async () => {
    await openAndPay();
    expect(initiate).toHaveBeenCalledTimes(1);
    expect(polled?.refid).toBe('REF-1');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(text()).not.toContain('Payment declined');
  });

  it('a confirmed payment reports success to the host exactly once', async () => {
    await openAndPay();
    await act(async () => { polled!.callbacks.onSuccess({ status: 'SUCCESS' }); });
    await act(async () => { await new Promise((r) => setTimeout(r, 700)); });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('REF-1');
  });

  it('a declined payment says so and offers a retry', async () => {
    await openAndPay();
    await act(async () => { polled!.callbacks.onFailure({ status: 'FAILED' }); });
    expect(text()).toContain('Payment declined');
    expect(byText('Try a different way')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('a timeout is UNCONFIRMED: never declined, never a retry that could charge twice, never a success', async () => {
    await openAndPay();
    await act(async () => { polled!.callbacks.onError('Payment is taking longer than expected.'); });
    expect(text()).toContain('Still unconfirmed');
    expect(text()).not.toContain('Payment declined');
    expect(byText('Try a different way')).toBeUndefined();
    expect(byText('check my phone')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('a payment the backend holds for review (always pending, then timed out) ends unconfirmed, not paid', async () => {
    await openAndPay();
    await act(async () => {
      polled!.callbacks.onError('Payment is taking longer than expected. Please check your payment history.');
    });
    expect(text()).toContain('Still unconfirmed');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('when the start itself goes wrong', () => {
  it('a refused start (action 0) shows the reason, starts no polling and reports no success', async () => {
    initiate.mockResolvedValue({ success: false, error: 'Amount below the minimum' });
    await openAndPay();
    expect(polled).toBeNull();
    expect(text()).toContain('Amount below the minimum');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Amount below the minimum');
  });

  it('a dropped connection on the start is UNKNOWN (a prompt may already be on the phone): no retry offered', async () => {
    initiate.mockRejectedValue(new Error('Network request failed'));
    await openAndPay();
    expect(text()).toContain('Still unconfirmed');
    expect(byText('Try a different way')).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('an empty success (no payment data) is not polled as if it were a payment', async () => {
    initiate.mockResolvedValue({ success: true });
    await openAndPay();
    expect(polled).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('how a booking is polled', () => {
  it('uses the status route for a booking and no card grace for mobile money', async () => {
    await openAndPay();
    expect(polled?.usePublic).toBe(false);
    expect(polled?.grace).toBe(0);
  });
});
