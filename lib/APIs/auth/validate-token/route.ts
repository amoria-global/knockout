/**
 * Validate Token API
 * GET /api/remote/auth/validate-token
 */

import { apiRequest, API_ENDPOINTS, getAuthToken, removeAuthToken } from '../../../db';

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
 */
export async function validateToken() {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'No token found',
    };
  }

  const response = await apiRequest<ValidateTokenResponse>(
    `${API_ENDPOINTS.AUTH}/validate-token`,
    {
      method: 'GET',
      token,
    }
  );

  // If token is invalid, remove it
  if (!response.success || !response.data?.valid) {
    removeAuthToken();
  }

  return response;
}
