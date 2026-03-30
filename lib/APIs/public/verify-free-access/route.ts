/**
 * FREE Album OTP Verification API
 * POST /api/remote/public/albums/free/verify-access
 * No authentication required — verifies OTP and grants access
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface FreeAlbumVerifyAccessData {
  albumId: string;
  customerId: string;
  message: string;
  albumTitle: string;
}

/**
 * Verify OTP and grant access to FREE album.
 * Creates AlbumViewer record, establishes session, and returns album details.
 */
export async function verifyFreeAlbumAccess(
  accessCode: string,
  email: string,
  otp: string
): Promise<ApiResponse<FreeAlbumVerifyAccessData>> {
  const response = await apiClient.post<FreeAlbumVerifyAccessData>(
    API_ENDPOINTS.PUBLIC.FREE_ALBUM_VERIFY_ACCESS,
    {
      accessCode: accessCode.trim(),
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    },
    {
      retries: 1,
      skipAuth: true,
      credentials: 'include'  // Receive session cookie in response
    }
  );

  // Handle wrapped { action, data } response
  if (response.success && response.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = response.data as any;
    if (raw?.data && typeof raw.data === 'object') {
      response.data = raw.data as FreeAlbumVerifyAccessData;
    }
  }

  return response;
}
