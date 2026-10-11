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
  /**
   * Optional and no longer collected at verification. Identity is keyed on
   * (album, email) server-side; the payment step gathers the mobile-money
   * number where it is actually needed. Collecting it twice made buyers
   * think they were two different people paying twice.
   */
  phone?: string;
  deviceFingerprint: string;
}

export interface IdentifyBuyerResponse {
  /**
   * Null for VERIFY_EMAIL: the email belongs to an earlier buyer on another
   * device. Knowing an email is not proof of being that buyer, so the backend
   * returns no buyerId (it downloads their photos) and emails their unlock
   * codes to that address instead.
   */
  buyerId: string | null;
  status: 'NEW' | 'RETURNING' | 'VERIFY_EMAIL';
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
