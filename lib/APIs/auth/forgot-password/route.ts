/**
 * Forgot Password API
 * POST /api/remote/auth/forgot-password
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
}

/**
 * Forgot Password (Request Reset)
 * Uses enhanced API client with automatic retry and error handling
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponse>> {
  // Backend expects query parameters, not body
  const queryParams = new URLSearchParams({ email: data.email });

  const response = await apiClient.post<ForgotPasswordResponse>(
    `${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}?${queryParams}`,
    undefined,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
