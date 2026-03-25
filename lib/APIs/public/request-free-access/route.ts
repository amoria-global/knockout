/**
 * FREE Album Access Request API
 * POST /api/remote/public/albums/free/request-access
 * No authentication required — open to recipients with valid access code
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface FreeAlbumAccessRequestData {
  customerId: string;
  otpExpiry: string;
  message: string;
}

/**
 * Request access to a FREE album.
 * Validates access code and email, creates/gets Viewer account,
 * generates OTP, and sends it via email.
 */
export async function requestFreeAlbumAccess(
  accessCode: string,
  email: string
): Promise<ApiResponse<FreeAlbumAccessRequestData>> {
  const response = await apiClient.post<FreeAlbumAccessRequestData>(
    API_ENDPOINTS.PUBLIC.FREE_ALBUM_REQUEST_ACCESS,
    {
      accessCode: accessCode.trim(),
      email: email.trim().toLowerCase(),
    },
    { retries: 1, skipAuth: true }
  );

  // Handle wrapped { action, data } response
  if (response.success && response.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = response.data as any;
    if (raw?.data && typeof raw.data === 'object') {
      response.data = raw.data as FreeAlbumAccessRequestData;
    }
  }

  return response;
}
