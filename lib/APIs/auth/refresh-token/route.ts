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

import { apiClient, getAuthToken, setAuthToken } from '@/lib/api/client';
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
 * Uses enhanced API client with automatic retry and error handling
 * Backend expects POST with refreshToken in request body
 */
export async function refreshToken(refreshTokenValue?: string): Promise<ApiResponse<RefreshTokenResponse>> {
  const token = refreshTokenValue || getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'No token found',
    };
  }

  const response = await apiClient.post<RefreshTokenResponse>(
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    { refreshToken: token },
    {
      skipAuth: true, // Token is sent in body, not header
      retries: 2,
    }
  );

  // Update stored token if successful
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
