/**
 * Validate Token API
 * GET /api/remote/auth/validate-token
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, getAuthToken, removeAuthToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Validate Token
 * Uses enhanced API client with automatic retry and error handling
 * Backend expects the token as a query parameter
 */
export async function validateToken(): Promise<ApiResponse<ValidateTokenResponse>> {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'No token found',
    };
  }

  const queryParams = new URLSearchParams({ token });

  const response = await apiClient.get<ValidateTokenResponse>(
    `${API_ENDPOINTS.AUTH.VALIDATE_TOKEN}?${queryParams}`,
    {
      skipAuth: true, // Token is sent as query param, not header
      retries: 1,
    }
  );

  // If token is invalid, remove it
  // Backend returns action: 1 for valid tokens (mapped to success: true by apiClient)
  if (!response.success) {
    removeAuthToken();
  }

  return response;
}
