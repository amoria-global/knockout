/**
 * Refresh Token API
 * GET /api/remote/auth/refresh-token
 */

import { apiRequest, API_ENDPOINTS, getAuthToken, setAuthToken } from '../../../db';

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

/**
 * Refresh Token
 */
export async function refreshToken() {
  const token = getAuthToken();

  const response = await apiRequest<RefreshTokenResponse>(
    `${API_ENDPOINTS.AUTH}/refresh-token`,
    {
      method: 'GET',
      token: token || undefined,
    }
  );

  // Update stored token if successful
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
