/**
 * Get Currencies API
 * GET /api/remote/public/currencies
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
}

export type GetCurrenciesResponse = Currency[];

/**
 * Get all available currencies (public, no auth required)
 */
export async function getCurrencies(): Promise<ApiResponse<GetCurrenciesResponse>> {
  const response = await apiClient.get<GetCurrenciesResponse>(
    API_ENDPOINTS.PUBLIC.CURRENCIES,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  // Normalize field names (API may use code/currencyCode, name/currencyName)
  if (response.success && response.data && Array.isArray(response.data)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = response.data as any[];
    response.data = raw.map((c) => ({
      id: c.id || '',
      code: c.code || c.currencyCode || '',
      name: c.name || c.currencyName || '',
      symbol: c.symbol || undefined,
    }));
  }

  return response;
}
