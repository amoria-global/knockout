/**
 * Get Donation Tiers API
 * GET /api/remote/public/donation-tiers
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface DonationTier {
  amount: number;
  currency: string;
}

export interface ExchangeRate {
  symbol: string;
  rateToUsd: number | null;
  rateUpdatedAt?: string;
}

export interface DonationTiersResponse {
  baseCurrency: string;
  tiers: DonationTier[];
  exchangeRates: Record<string, ExchangeRate>;
}

export async function getDonationTiers(): Promise<ApiResponse<DonationTiersResponse>> {
  return apiClient.get<DonationTiersResponse>(
    API_ENDPOINTS.PUBLIC.DONATION_TIERS,
    { skipAuth: true, retries: 1 }
  );
}
