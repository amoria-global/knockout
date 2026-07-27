/**
 * Public Gift Catalog API
 * TikTok-style live-gift catalog: each gift type carries an exact USD amount.
 * The backend charges exactly `amountUsd` when a gift is sent by `code`;
 * `exchangeRates` is provided so the UI can show a localized approximation.
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { ExchangeRate } from '../get-donation-tiers/route';

export interface GiftCatalogItem {
  code: string;
  name: string;
  emoji: string;
  amountUsd: number;
  tier: 'POPULAR' | 'PREMIUM' | string;
  bigAnimation: boolean;
  sortOrder: number;
}

export interface GiftCatalogResponse {
  baseCurrency: string; // always "USD"
  gifts: GiftCatalogItem[];
  exchangeRates: Record<string, ExchangeRate>;
}

export async function getGiftCatalog(): Promise<ApiResponse<GiftCatalogResponse>> {
  return apiClient.get<GiftCatalogResponse>(
    API_ENDPOINTS.PUBLIC.GIFT_CATALOG,
    { skipAuth: true, retries: 1 }
  );
}
