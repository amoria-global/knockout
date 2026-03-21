/**
 * Get Live Currency Rates API
 * GET /api/remote/public/currencies/rates
 * Returns all currencies with live rateToUsd and rateUpdatedAt.
 * rateToUsd semantics: "1 USD = X of this currency" (e.g. KES=1300 means 1 USD = 1300 KES)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface CurrencyRate {
  id: string;
  name: string;
  abbreviation: string;
  symbol: string;
  rateToUsd: number | null;
  rateUpdatedAt: string | null;
}

export type CurrencyRatesResponse = Record<string, CurrencyRate>;

export async function getCurrencyRates(): Promise<ApiResponse<CurrencyRatesResponse>> {
  return apiClient.get<CurrencyRatesResponse>(
    API_ENDPOINTS.PUBLIC.CURRENCY_RATES,
    { skipAuth: true, retries: 1 }
  );
}
