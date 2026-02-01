/**
 * Resend OTP API
 * POST /api/remote/auth/resend-otp
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

export interface ResendOtpRequest {
  customerId: string; // Backend expects customerId (UUID)
}

export interface ResendOtpResponse {
  action: number; // 0 = failure, 1 = success
  expr: string; // Timestamp
  message: string;
  applicant_id?: string; // Backend may return this
  customerId?: string; // Backend may return this
}

/**
 * Resend OTP
 * Uses enhanced API client with automatic retry and error handling
 */
export async function resendOtp(data: ResendOtpRequest): Promise<ApiResponse<ResendOtpResponse>> {
  // Backend expects query parameters, not body
  const queryParams = new URLSearchParams({ customerId: data.customerId });

  const response = await apiClient.post<ResendOtpResponse>(
    `${API_ENDPOINTS.AUTH.RESEND_OTP}?${queryParams}`,
    undefined,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
