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
  email: string;
  code: string; // Verification code from forgot-password email
  password: string; // Backend requires 'password'
  newPassword: string; // Backend also requires 'newPassword'
  confirmPassword: string; // Password confirmation
}

export interface SetNewPasswordResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
}

/**
 * Set New Password
 * Uses enhanced API client with automatic retry and error handling
 */
export async function setNewPassword(data: SetNewPasswordRequest): Promise<ApiResponse<SetNewPasswordResponse>> {
  const response = await apiClient.post<SetNewPasswordResponse>(
    API_ENDPOINTS.AUTH.SET_NEW_PASSWORD,
    data,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
