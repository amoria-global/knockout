/**
 * Set New Password API
 * POST /api/remote/auth/set-new-password
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface SetNewPasswordRequest {
  /** Advisory. The backend picks the account from `code` or the session, never from this. */
  email?: string;
  /** Reset token from the forgot-password email. Omit for an authenticated change. */
  code?: string;
  password: string;
  newPassword?: string;
  confirmPassword: string;
}

export interface SetNewPasswordResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
}

/**
 * Set New Password
 * Uses enhanced API client with automatic retry and error handling
 */
export async function setNewPassword(
  data: SetNewPasswordRequest,
  opts: { authenticated?: boolean } = {},
): Promise<ApiResponse<SetNewPasswordResponse>> {
  const response = await apiClient.post<SetNewPasswordResponse>(
    API_ENDPOINTS.AUTH.SET_NEW_PASSWORD,
    data,
    {
      // The backend now resolves the account from proof: the reset token in
      // `code`, or the caller's own session. The forgot-password screen is
      // logged out and carries the token; the forced-change screen holds a
      // JWT and must actually send it, which `skipAuth` was suppressing.
      skipAuth: !opts.authenticated,
      // Reset tokens are single-use. A retry after a request that committed
      // but timed out would burn the token and report failure for a change
      // that actually succeeded.
      retries: 0,
    }
  );

  return response;
}
