/**
 * Refresh Token API
 * GET /api/remote/auth/refresh-token
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

export interface RefreshTokenResponse {
  action: number; // 0 = failure, 1 = success
  token: string;
  refreshToken?: string;
  message?: string;
}

/**
 * Refresh Token
 * Uses enhanced API client with automatic retry and error handling
 */
export async function refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'No token found',
    };
  }

  const response = await apiClient.get<RefreshTokenResponse>(
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    {
      retries: 2,
    }
  );

  // Update stored token if successful
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
