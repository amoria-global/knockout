/**
 * Reset Password API
 * POST /api/remote/auth/reset-password
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

export interface ResetPasswordRequest {
  email: string;
  token: string; // Backend expects 'token', not 'code'
  password: string; // Backend expects 'password', not 'newPassword'
  confirmPassword: string; // Backend requires confirmPassword
}

export interface ResetPasswordResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
}

/**
 * Reset Password (with token)
 * Uses enhanced API client with automatic retry and error handling
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<ResetPasswordResponse>> {
  // Backend expects query parameters, not body
  const queryParams = new URLSearchParams({
    email: data.email,
    token: data.token,
    password: data.password,
    confirmPassword: data.confirmPassword,
  });

  const response = await apiClient.post<ResetPasswordResponse>(
    `${API_ENDPOINTS.AUTH.RESET_PASSWORD}?${queryParams}`,
    undefined,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
