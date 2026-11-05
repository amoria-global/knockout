'use client';

import { useEffect, useState } from 'react';
import { apiBase } from './apiBase';

/**
 * The smallest price a form may accept, per currency, read from the backend so the dashboard, the app and the website
 * all quote the same figure (GET /api/remote/public/payments/limits?currency=X). The server judges every price again,
 * so a missing answer never blocks a form: it only means the minimum cannot be shown yet.
 */
export type PaymentLimit = {
  currency: string;
  /** Plain decimal text, e.g. "0.08" or "100". */
  minimum: string;
  decimals: number;
  wholeNumbersOnly: boolean;
  /** The exchange-rate feed is older than the stale window; the minimum then carries a wider margin. */
  rateStale?: boolean;
};

/** Currencies with no minor unit. Used only before the backend has answered, so typing is already right. */
const ZERO_DECIMAL = new Set(['RWF', 'UGX', 'XAF', 'XOF']);

export function isWholeNumberCurrency(code: string | undefined | null): boolean {
  return !!code && ZERO_DECIMAL.has(code.toUpperCase());
}

const cache = new Map<string, PaymentLimit>();
const inflight = new Map<string, Promise<PaymentLimit | null>>();
const listeners = new Set<() => void>();

/** The limit already fetched for a currency, or null. Safe to call from any validator. */
export function cachedPaymentLimit(code: string | undefined | null): PaymentLimit | null {
  return code ? cache.get(code.toUpperCase()) ?? null : null;
}

export function parsePaymentLimit(res: unknown, currency: string): PaymentLimit | null {
  const r = res as { action?: number; data?: Record<string, unknown> } | null;
  const d = r?.data;
  if (!r || r.action !== 1 || !d || typeof d.minimum !== 'string') return null;
  const decimals = typeof d.decimals === 'number' ? d.decimals : isWholeNumberCurrency(currency) ? 0 : 2;
  return {
    currency: String(d.currency ?? currency).toUpperCase(),
    minimum: d.minimum,
    decimals,
    wholeNumbersOnly: decimals === 0,
    rateStale: d.rateStale === true,
  };
}

export function fetchPaymentLimit(currency: string): Promise<PaymentLimit | null> {
  const code = currency.toUpperCase();
  const hit = cache.get(code);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(code);
  if (pending) return pending;
  const p = fetch(`${apiBase()}/api/remote/public/payments/limits?currency=${encodeURIComponent(code)}`)
    .then((r) => r.json())
    .then((json) => {
      const limit = parsePaymentLimit(json, code);
      if (limit) {
        cache.set(code, limit);
        listeners.forEach((l) => l());
      }
      return limit;
    })
    .catch(() => null)
    .finally(() => inflight.delete(code));
  inflight.set(code, p);
  return p;
}

/** Loads the limit for a currency and re-renders when it arrives. Returns null while loading or when unavailable. */
export function usePaymentLimit(currency: string | undefined | null): PaymentLimit | null {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    if (currency) void fetchPaymentLimit(currency);
    return () => {
      listeners.delete(l);
    };
  }, [currency]);
  return cachedPaymentLimit(currency);
}

/** The limit for a currency and whether its first answer is still on the way. Cached, so it never refetches. */
export function usePaymentLimitState(currency: string | undefined | null): { limit: PaymentLimit | null; loading: boolean } {
  const limit = usePaymentLimit(currency);
  const code = currency ? currency.toUpperCase() : '';
  const [settled, setSettled] = useState<string>('');
  useEffect(() => {
    if (!code || cache.has(code)) return;
    let live = true;
    void fetchPaymentLimit(code).then(() => live && setSettled(code));
    return () => {
      live = false;
    };
  }, [code]);
  return { limit, loading: !!code && !limit && settled !== code };
}

/** The message to show on the field, or null when the amount is fine (or still empty). */
export function priceError(text: string, limit: PaymentLimit | null): string | null {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'Enter a valid price.';
  const amount = Number(t);
  if (!(amount > 0)) return 'Enter a price above zero.';
  if (limit && limit.wholeNumbersOnly && t.includes('.')) return `Prices in ${limit.currency} must be whole numbers.`;
  if (limit && amount < Number(limit.minimum)) {
    return `The minimum price in ${limit.currency} is ${limit.minimum}. Mobile Money can't process smaller payments.`;
  }
  return null;
}

/** Helper text for under the field. */
export function priceHint(limit: PaymentLimit | null): string | null {
  return limit ? `Minimum ${limit.currency} ${limit.minimum}` : null;
}

/** The step for a number input: whole numbers only where the currency has no cents. */
export function priceStep(code: string | undefined | null, limit?: PaymentLimit | null): number {
  const whole = limit ? limit.wholeNumbersOnly : isWholeNumberCurrency(code);
  return whole ? 1 : 0.01;
}

export function __resetPaymentLimitCache() {
  cache.clear();
  inflight.clear();
}
