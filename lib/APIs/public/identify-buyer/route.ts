/**
 * Album Buyer Identity API (Public)
 * POST /api/remote/public/albums/{albumId}/identify-buyer
 * Upserts a buyer on (album, email) and returns their persistent buyerId
 * plus the list of photoIds they've already purchased in this album.
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface IdentifyBuyerRequest {
  name: string;
  email: string;
  phone: string;
  deviceFingerprint: string;
}

export interface IdentifyBuyerResponse {
  buyerId: string;
  status: 'NEW' | 'RETURNING';
  purchasedPhotoIds: string[];
}

export async function identifyAlbumBuyer(
  albumId: string,
  data: IdentifyBuyerRequest
): Promise<ApiResponse<IdentifyBuyerResponse>> {
  return apiClient.post<IdentifyBuyerResponse>(
    API_ENDPOINTS.PUBLIC.IDENTIFY_BUYER(albumId),
    data,
    { skipAuth: true, retries: 1 }
  );
}
