import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';


const LIMITS: Record<string, unknown> = {
  USD: { currency: 'USD', minimum: '0.07', decimals: 2, wholeNumbersOnly: false, rateStale: false },
  RWF: { currency: 'RWF', minimum: '100', decimals: 0, wholeNumbersOnly: true, rateStale: false },
  KES: { currency: 'KES', minimum: '8.79', decimals: 2, wholeNumbersOnly: false, rateStale: true },
};

import MoneyInput from './MoneyInput';
import { __resetPaymentLimitCache } from '@/lib/paymentLimits';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options = [
  { value: 'rwf', code: 'RWF', name: 'Rwandan franc' },
  { value: 'usd', code: 'USD', name: 'US dollar' },
  { value: 'kes', code: 'KES', name: 'Kenyan shilling' },
];

function Harness({ amount = '', currency = 'usd', onAmount, keep = true }: { amount?: string; currency?: string; onAmount?: (v: string) => void; keep?: boolean }) {
  const [a, setA] = useState(amount);
  const [c, setC] = useState(currency);
  return <MoneyInput label="PRICE PER IMAGE" required value={a} onChange={(v) => { setA(v); onAmount?.(v); }} currencyId={c} onCurrencyChange={setC} currencies={options} displayCurrency="RWF" keepAmountOnCurrencyChange={keep} />;
}

let root: Root;
let host: HTMLDivElement;

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

async function mount(el: React.ReactElement) {
  await act(async () => root.render(el));
  await flush();
}

const text = () => host.textContent ?? '';
const input = () => host.querySelector('input#' + CSS.escape(host.querySelector('label')!.getAttribute('for')!)) as HTMLInputElement;

function type(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

beforeEach(() => {
  __resetPaymentLimitCache();
  window.localStorage.clear();
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/payments/limits')) {
      const code = decodeURIComponent(url.split('currency=')[1]);
      return Promise.resolve({ json: async () => ({ action: 1, data: LIMITS[code] }) });
    }
    return Promise.resolve({ json: async () => ({ data: { RWF: { rateToUsd: 1478.5 }, KES: { rateToUsd: 130 }, USD: { rateToUsd: 1 } } }) });
  }));
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe('MoneyInput (web)', () => {
  it('shows the minimum before anything is typed, and names the currency button for screen readers', async () => {
    await mount(<Harness />);
    expect(text()).toContain('Minimum USD 0.07');
    expect(host.querySelector('button[aria-label="Currency, US dollar, change"]')).not.toBeNull();
  });

  it('accepts USD 4.00, shows the conversion, and keeps the amount a plain number', async () => {
    const seen: string[] = [];
    await mount(<Harness onAmount={(v) => seen.push(v)} />);
    type(input(), '4.00');
    await flush();
    expect(seen).toEqual(['4.00']);
    expect(text()).toContain('≈ RWF 5,914');
    expect(text()).not.toContain('The minimum price');
  });

  it('shows the field error below the minimum, in plain language', async () => {
    await mount(<Harness amount="0.05" />);
    expect(text()).toContain("The minimum price in USD is 0.07. Mobile Money can't process smaller payments.");
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('shows thousands separators while the stored value stays clean', async () => {
    await mount(<Harness amount="1234567" />);
    expect(input().value).toBe('1,234,567');
  });

  it('takes whole numbers only in a zero-decimal currency', async () => {
    const seen: string[] = [];
    await mount(<Harness currency="rwf" onAmount={(v) => seen.push(v)} />);
    expect(text()).toContain('Minimum RWF 100 · whole numbers only');
    expect(input().getAttribute('inputmode')).toBe('numeric');
    type(input(), '500.5');
    expect(seen).toEqual(['5005']);
  });

  it('keeps the amount when the currency changes and drops digits the new currency cannot carry', async () => {
    await mount(<Harness amount="50.5" />);
    const rwf = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('RWF') && b.getAttribute('aria-pressed') !== null)!;
    await act(async () => rwf.click());
    await flush();
    expect(input().value).toBe('505');
    expect(text()).toContain('Minimum RWF 100');
  });

  it('opens a searchable popover and picks with the keyboard', async () => {
    await mount(<Harness />);
    const more = [...host.querySelectorAll('button')].find((b) => b.textContent === 'More...')!;
    await act(async () => more.click());
    expect(host.querySelector('[role=dialog]')).not.toBeNull();
    expect(text()).toContain('SUGGESTED');
    const search = host.querySelector('input[aria-label="Search currencies"]') as HTMLInputElement;
    type(search, 'kenya');
    await flush();
    const rows = [...host.querySelectorAll('[role=option]')];
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining('KES')]);
    await act(async () => search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    await flush();
    expect(host.querySelector('[role=dialog]')).toBeNull();
    expect(text()).toContain('Minimum KES 8.79');
  });

  it('closes the popover on Escape', async () => {
    await mount(<Harness />);
    const more = [...host.querySelectorAll('button')].find((b) => b.textContent === 'More...')!;
    await act(async () => more.click());
    const search = host.querySelector('input[aria-label="Search currencies"]') as HTMLInputElement;
    await act(async () => search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(host.querySelector('[role=dialog]')).toBeNull();
  });

  it('warns when the rate is old and still lets the user type', async () => {
    await mount(<Harness amount="50" currency="kes" />);
    expect(text()).toContain('more than 24 hours old');
    expect(input().disabled).toBe(false);
  });

  it('leaves out the minimum where the server does not enforce it', async () => {
    await act(async () => root.render(<MoneyInput label="P" value="1" onChange={() => {}} currencyId="usd" onCurrencyChange={() => {}} currencies={options} showLimits={false} />));
    await flush();
    expect(text()).not.toContain('Minimum');
  });

  it('empties the amount on a currency change where the amount is a payment', async () => {
    await mount(<Harness amount="5000" keep={false} />);
    const rwf = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('RWF') && b.getAttribute('aria-pressed') !== null)!;
    await act(async () => rwf.click());
    await flush();
    expect(input().value).toBe('');
  });
});
