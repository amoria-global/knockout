'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { DetectedCountry } from './types';

/**
 * Resolves the user's ISO-2 country for payment routing.
 *
 * Order of precedence:
 *   1. localStorage `paymentCountry` (sticky after a manual pick).
 *   2. Backend IP-detection (/api/remote/public/payments/country) —
 *      called once per session, cached for 1h in localStorage.
 *   3. null (caller shows the country picker as fallback).
 *
 * Exposes a setter so the country picker can override the detected
 * value; the override is persisted to localStorage so refreshing the
 * page doesn't re-prompt.
 */

const STORAGE_KEY = 'payment.country';
const STORAGE_DETECTED_KEY = 'payment.country.detected';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedDetection {
  country: string | null;
  source: DetectedCountry['source'];
  at: number;
}

function readCache(key: string): CachedDetection | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDetection;
    if (typeof parsed?.at !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: CachedDetection) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota / disabled */ }
}

export function usePaymentCountry() {
  const [country, setCountryState] = useState<string | null>(null);
  const [source, setSource] = useState<DetectedCountry['source']>('DEFAULT');
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Manual selection wins forever.
    const manual = readCache(STORAGE_KEY);
    if (manual?.country) {
      setCountryState(manual.country);
      setSource('MANUAL');
      setSupported(true); // assume true — caller can revalidate via options
      setLoading(false);
      return;
    }

    // Cached IP detection (1h TTL) — avoids re-asking on every modal open.
    const cached = readCache(STORAGE_DETECTED_KEY);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setCountryState(cached.country);
      setSource('CACHED');
      setSupported(!!cached.country);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await apiClient.get<{
          country: string | null;
          source: DetectedCountry['source'];
          supported: boolean;
        }>(API_ENDPOINTS.PAYMENT_COUNTRY);
        if (cancelled) return;
        const detected = res.data?.country ?? null;
        const detectedSource = res.data?.source ?? 'DEFAULT';
        setCountryState(detected);
        setSource(detectedSource);
        setSupported(!!res.data?.supported);
        writeCache(STORAGE_DETECTED_KEY, { country: detected, source: detectedSource, at: Date.now() });
      } catch {
        // Network blip / endpoint missing — leave country null so the
        // modal falls back to its country picker.
        if (!cancelled) {
          setCountryState(null);
          setSource('DEFAULT');
          setSupported(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const setCountry = useCallback((iso2: string | null) => {
    setCountryState(iso2);
    setSource(iso2 ? 'MANUAL' : 'DEFAULT');
    setSupported(!!iso2);
    if (iso2) {
      writeCache(STORAGE_KEY, { country: iso2, source: 'MANUAL', at: Date.now() });
    } else if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, []);

  return { country, source, supported, loading, setCountry };
}
