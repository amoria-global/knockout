/**
 * Verify TOTP API
 * POST /api/remote/auth/verify-totp
 *
 * Verifies a TOTP code during login for users with 2FA enabled.
 * On success, returns JWT tokens to complete the login flow.
 */

import { apiClient, setAuthToken, setRefreshToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface VerifyTotpRequest {
  customerId: string;
  code: string;
}

export interface VerifyTotpResponse {
  action: number;
  message: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  customerId?: string;
  customerType?: string;
  profilePicture?: string | null;
  coverPicture?: string | null;
  token?: string;
  refreshToken?: string;
  token_expiry?: string;
  refreshToken_expiry?: string;
}

/**
 * Verify TOTP code
 * Uses enhanced API client with automatic retry and error handling
 */
export async function verifyTotp(data: VerifyTotpRequest): Promise<ApiResponse<VerifyTotpResponse>> {
  const response = await apiClient.post<VerifyTotpResponse>(
    API_ENDPOINTS.AUTH.VERIFY_TOTP,
    data,
    {
      skipAuth: true,
      retries: 1,
    }
  );

  // Store tokens on successful TOTP verification
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }
  if (response.success && response.data?.refreshToken) {
    setRefreshToken(response.data.refreshToken);
  }

  return response;
}
