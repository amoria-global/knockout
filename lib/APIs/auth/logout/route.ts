/**
 * User Logout API
 * POST /api/remote/auth/logout
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, getAuthToken, getRefreshToken, removeAuthToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface LogoutResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
}

/**
 * User Logout
 * Calls backend to invalidate the token, then clears local auth data
 */
export async function logout(): Promise<ApiResponse<LogoutResponse>> {
  const token = getAuthToken();
  // Names this device's session so the backend ends exactly that one; the
  // access token above is revoked with it. Read before the storage is cleared.
  const refreshToken = getRefreshToken();

  // Always clear local auth data regardless of backend response
  removeAuthToken();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser');
  }

  // If no token, just return success (already logged out)
  if (!token) {
    return {
      success: true,
      data: { action: 1, message: 'Logged out successfully' },
      message: 'Logged out successfully',
    };
  }

  // Call backend to end this device's session
  const response = await apiClient.post<LogoutResponse>(
    API_ENDPOINTS.AUTH.LOGOUT,
    { token, refreshToken },
    {
      skipAuth: true, // We send token in body, not header
      retries: 1,
    }
  );

  // Return success even if backend call fails (local data is already cleared)
  return {
    success: true,
    data: response.data || { action: 1, message: 'Logged out successfully' },
    message: 'Logged out successfully',
  };
}
