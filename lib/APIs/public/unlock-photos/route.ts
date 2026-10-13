/**
 * Album Photo Unlock API (Public)
 * POST /api/remote/public/albums/{albumId}/unlock-photos
 *
 * Lets a returning buyer reclaim previously purchased photos using either
 * the unlock code emailed to them at purchase time (per-purchase) or the
 * email they used at purchase (per-buyer).
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export type UnlockAlbumPhotosRequest =
  | { unlockCode: string }
  | { email: string };

export interface UnlockAlbumPhotosResponse {
  buyerId: string | null;
  /** True for the email door: the codes were sent to that inbox, nothing is unlocked here. */
  emailSent?: boolean;
  purchasedPhotoIds: string[];
  refid: string | null;
}

export async function unlockAlbumPhotos(
  albumId: string,
  data: UnlockAlbumPhotosRequest
): Promise<ApiResponse<UnlockAlbumPhotosResponse>> {
  return apiClient.post<UnlockAlbumPhotosResponse>(
    API_ENDPOINTS.PUBLIC.UNLOCK_ALBUM_PHOTOS(albumId),
    data,
    { skipAuth: true, retries: 1 }
  );
}
