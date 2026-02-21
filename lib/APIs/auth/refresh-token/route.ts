/**
 * Refresh Token API
 * POST /api/remote/auth/refresh-token
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, getAuthToken, setAuthToken, getRefreshToken, setRefreshToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  action: number; // 0 = failure, 1 = success
  token: string;
  refreshToken?: string;
  message?: string;
}

/**
 * Refresh Token
 * Uses POST with refresh token UUID in the body
 */
export async function refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
  const storedRefreshToken = getRefreshToken();

  if (!storedRefreshToken) {
    return {
      success: false,
      error: 'No refresh token found',
    };
  }

  const response = await apiClient.post<RefreshTokenResponse>(
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    { refreshToken: storedRefreshToken },
    {
      skipAuth: true,
      retries: 2,
    }
  );

  // Update stored tokens if successful
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }
  if (response.success && response.data?.refreshToken) {
    setRefreshToken(response.data.refreshToken);
  }

  return response;
}
