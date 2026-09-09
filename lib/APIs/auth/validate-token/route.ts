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

/**
 * Validate a PASSWORD-RESET token taken from the URL.
 *
 * Distinct from `validateToken()` above, which reads the SESSION token from
 * storage and clears it on failure — doing that here would log out a signed-in
 * visitor who merely opened a stale reset link.
 *
 * The reset page must call this before rendering the form. Without it the page
 * told every visitor "Your identity has been verified" and rendered the form
 * even with no token at all, so an expired link was only discovered on submit.
 *
 * Backend: GET /auth/validate-token?token=... -> action 1 valid, 0 invalid/expired.
 */
export async function validateResetToken(
  token: string,
): Promise<ApiResponse<ValidateTokenResponse>> {
  if (!token) {
    return { success: false, error: 'No reset token supplied' };
  }

  return apiClient.get<ValidateTokenResponse>(
    `${API_ENDPOINTS.AUTH.VALIDATE_TOKEN}?${new URLSearchParams({ token })}`,
    { skipAuth: true, retries: 1 },
  );
}
