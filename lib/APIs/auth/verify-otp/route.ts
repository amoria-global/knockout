/**
 * Verify OTP (Email Confirmation) API
 * POST /api/remote/auth/verify-otp
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, setAuthToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface VerifyOtpRequest {
  customerId: string; // Backend expects customerId (UUID)
  otp: number; // Backend expects otp as a number
}

export interface VerifyOtpResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Verify OTP (Email Confirmation)
 * Uses enhanced API client with automatic retry and error handling
 */
export async function verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<VerifyOtpResponse>> {
  const response = await apiClient.post<VerifyOtpResponse>(
    API_ENDPOINTS.AUTH.VERIFY_OTP,
    data,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  // If verification successful and token provided, store it
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
