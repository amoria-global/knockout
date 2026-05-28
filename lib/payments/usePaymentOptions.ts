'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaymentOptions } from './types';

/**
 * Fetches the operators + currency + card-support flag for one country.
 * Re-fetches whenever `country` changes. Returns `{ options, loading,
 * error, supported }`. When the backend reports the country has no
 * registered operators (action=0), `supported` is false and the caller
 * shows the country picker.
 *
 * In-memory cache by country code: opening the modal multiple times in
 * the same session for the same country doesn't re-hit the backend.
 */

const memCache = new Map<string, PaymentOptions>();

export function usePaymentOptions(country: string | null) {
  const [options, setOptions] = useState<PaymentOptions | null>(country ? memCache.get(country) ?? null : null);
  const [loading, setLoading] = useState<boolean>(!!country && !memCache.has(country));
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(country ? memCache.has(country) : false);

  useEffect(() => {
    if (!country) {
      setOptions(null);
      setSupported(false);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = memCache.get(country);
    if (cached) {
      setOptions(cached);
      setSupported(true);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await apiClient.get<PaymentOptions>(API_ENDPOINTS.PAYMENT_OPTIONS(country));
        if (cancelled) return;
        if (res.success && res.data?.operators) {
          memCache.set(country, res.data);
          setOptions(res.data);
          setSupported(true);
        } else {
          // Backend signals country has no operators registered.
          setOptions(null);
          setSupported(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load payment options');
        setOptions(null);
        setSupported(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [country]);

  return { options, loading, error, supported };
}
