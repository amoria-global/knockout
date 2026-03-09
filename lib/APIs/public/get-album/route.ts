/**
 * Public Album API
 * GET /api/remote/public/albums?code={inviteCode}
 * No authentication required — open to all visitors with a valid invite code
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface AlbumPhoto {
  id: string;
  imageUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  alt?: string;
  eventTitle?: string;
  createdAt?: string;
}

export interface AlbumPricing {
  pricePerImage: number;
  currencyId: string;
  currencySymbol: string;
  currencyAbbreviation: string;
}

export interface AlbumData {
  eventId?: string;
  eventTitle?: string;
  photographerId?: string;
  photographerName?: string;
  pricing?: AlbumPricing | null;
  photos: AlbumPhoto[];
}

/**
 * Fetch all photos in a published album by invite code.
 * Public endpoint — no auth needed.
 */
export async function getAlbumByCode(inviteCode: string): Promise<ApiResponse<AlbumData>> {
  const response = await apiClient.get<AlbumData>(
    `${API_ENDPOINTS.PUBLIC.ALBUM_BY_CODE}?code=${encodeURIComponent(inviteCode)}`,
    { retries: 1, skipAuth: true }
  );

  // Handle wrapped { action, data } response
  if (response.success && response.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = response.data as any;
    if (raw?.data && typeof raw.data === 'object') {
      response.data = raw.data as AlbumData;
    }
    // Backward compat: if data is an array (old format), wrap it
    if (Array.isArray(response.data)) {
      response.data = { photos: response.data as unknown as AlbumPhoto[] };
    }
  }

  return response;
}
