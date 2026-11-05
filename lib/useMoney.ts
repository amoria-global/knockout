'use client';

import { useEffect, useState } from 'react';
import { apiBase } from './apiBase';
import { EMPTY_USAGE, parseUsage, recordUse, type Rates, type Usage } from './money';

/**
 * State behind MoneyInput: which currencies this browser uses most (kept in localStorage, never sent anywhere) and the
 * exchange rates for the "about" line, read once from the existing public endpoint.
 */
const USAGE_KEY = 'money.currencyUsage';

function readUsage(): Usage {
  try {
    return parseUsage(window.localStorage.getItem(USAGE_KEY));
  } catch {
    return EMPTY_USAGE;
  }
}

const usageListeners = new Set<() => void>();

export function recordCurrencyUse(code: string) {
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(recordUse(readUsage(), code)));
  } catch {
    // Private mode or storage blocked: the field still works, it just does not remember.
  }
  usageListeners.forEach((l) => l());
}

/** The currencies this browser has picked, most used first. Empty on the server render, filled after mount. */
export function useCurrencyUsage(): Usage {
  const [usage, setUsage] = useState<Usage>(EMPTY_USAGE);
  useEffect(() => {
    const sync = () => setUsage(readUsage());
    sync();
    usageListeners.add(sync);
    return () => {
      usageListeners.delete(sync);
    };
  }, []);
  return usage;
}

let ratesPromise: Promise<Rates> | null = null;

function loadRates(): Promise<Rates> {
  ratesPromise ??= fetch(`${apiBase()}/api/remote/public/currencies/rates`)
    .then((r) => r.json())
    .then((json: { data?: Record<string, { rateToUsd?: number | string }> }) => {
      const out: Rates = {};
      for (const [code, v] of Object.entries(json?.data ?? {})) {
        const n = Number(v?.rateToUsd);
        if (n > 0) out[code.toUpperCase()] = { rateToUsd: n };
      }
      return out;
    })
    .catch(() => {
      ratesPromise = null; // try again the next time a field mounts
      return {} as Rates;
    });
  return ratesPromise;
}

/** The exchange rates (units per 1 USD), or an empty set while loading or when they cannot be read. */
export function useRates(): Rates {
  const [rates, setRates] = useState<Rates>({});
  useEffect(() => {
    let live = true;
    void loadRates().then((r) => live && setRates(r));
    return () => {
      live = false;
    };
  }, []);
  return rates;
}
